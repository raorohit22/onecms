import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePosts, useBulkDeletePosts, useExportPosts, useImportPosts } from '../hooks/use-posts';
import { usePermissions } from '../auth/permissions';
import { Button } from '@onecms/ui/components/button';
import { Plus, Edit2, Trash2, ChevronDown, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@onecms/ui/components/dropdown-menu';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  PageShell, 
  PageShellHeader, 
  PageShellTitle, 
  PageShellDescription,
  PageShellActions,
  PageShellContent
} from '../components/page-shell';
import { ConfirmDeleteDialog } from '../components/confirm-delete-dialog';
import { DataTable, type DataTableColumn } from '@onecms/ui/components/data-table';
import { useTableQuery } from '../hooks/use-table-query';
import { useTableSelection } from '../hooks/use-table-selection';
import { Checkbox } from '@onecms/ui/components/checkbox';
import { ImportExport } from '../components/import-export';
import { parseImportFile } from '../utils/file-parser';

export function Posts() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const tableQuery = useTableQuery();
  
  const { query, deleteMutation } = usePosts(tableQuery);
  const bulkDeleteMutation = useBulkDeletePosts();
  const exportMutation = useExportPosts();
  const importMutation = useImportPosts();

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const posts = query.data?.data || [];
  const totalItems = query.data?.meta?.total || 0;
  const pageIds = posts.map((p: any) => p.id || p._id);
  
  const selection = useTableSelection(totalItems);

  /** Navigate to the post editor for editing */
  const handleEdit = (row: any) => {
    navigate(`/posts/${row.id || row._id}`);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      toast.success('Post deleted successfully');
      setItemToDelete(null);
      selection.clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const payload = {
        ids: selection.isAllSelected ? [] : selection.selectedIds,
        selectAll: selection.isAllSelected,
        excludedIds: selection.isAllSelected ? selection.deselectedIds : []
      };
      const res = await bulkDeleteMutation.mutateAsync(payload);
      toast.success(`Deleted ${res.count} posts`);
      setIsBulkDeleting(false);
      selection.clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete posts');
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportMutation.mutateAsync();
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to export');
      throw error;
    }
  };

  const handleImport = async (file: File) => {
    try {
      const parsedData = await parseImportFile(file);
      const result = await importMutation.mutateAsync(parsedData);
      toast.success(`Imported ${result.successCount} posts successfully`);
      if (result.errors?.length) {
        const firstError = result.errors[0]?.error || 'Validation error';
        toast.error(`${result.errors.length} posts failed to import (e.g. Row ${result.errors[0]?.row}: ${firstError})`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import posts');
    }
  };

  const columns = useMemo<DataTableColumn<any>[]>(() => [
    {
      id: 'selection',
      header: (
        <Checkbox 
          checked={selection.isAllSelected || (posts.length > 0 && selection.isPageFullySelected(pageIds))}
          onCheckedChange={(c) => {
            if (c) selection.toggleAllOnPage(pageIds);
            else {
              if (selection.isAllSelected) selection.clearSelection();
              else selection.toggleAllOnPage(pageIds);
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: (row) => (
        <Checkbox 
          checked={selection.isRowSelected(row.id || row._id)}
          onCheckedChange={() => selection.toggleRow(row.id || row._id)}
          aria-label="Select row"
        />
      ),
      width: '40px'
    },
    {
      id: 'title',
      header: 'Post',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.featuredImage ? (
            <img
              src={row.featuredImage}
              alt=""
              className="h-10 w-14 rounded-md object-cover border border-border shrink-0 bg-muted"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="h-10 w-14 rounded-md bg-muted/50 border border-border flex items-center justify-center shrink-0 text-muted-foreground/40 text-[10px] font-semibold">
              POST
            </div>
          )}
          <div className="font-medium min-w-0">
            <div className="truncate flex items-center gap-1.5">
              <span className="truncate">{row.title}</span>
              {row.youtubeUrl && (
                <span className="inline-flex items-center text-[10px] bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 font-semibold px-1.5 py-0.2 rounded shrink-0">
                  ▶ Video
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground font-mono truncate">/{row.slug}</div>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          row.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' :
          row.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      id: 'authorId',
      header: 'Created By',
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.authorId ? `${(row.authorId as any).firstName} ${(row.authorId as any).lastName}` : 'Unknown'}
        </span>
      )
    },
    {
      id: 'createdAt',
      header: 'Date',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'}</span>
    },
    {
      id: 'actions',
      header: '',
      width: '60px',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleEdit(row)}
              disabled={!can('UPDATE', 'POST')}
            >
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            
            {can('DELETE', 'POST') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setItemToDelete(row.id || row._id)} 
                  className="text-red-500 hover:text-red-600 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ], [selection, can, navigate]);

  const tableActions = selection.hasSelection ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Bulk Actions ({selection.selectionCount}) <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {!selection.isAllSelected && (
          <DropdownMenuItem onClick={() => selection.selectAllAcrossPages()}>
            Select All {totalItems} Items
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => selection.clearSelection()}>
          Clear Selection
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="text-red-600 focus:bg-red-50" 
          onClick={() => setIsBulkDeleting(true)}
          disabled={!can('DELETE', 'POST')}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const trailingActions = (
    <ImportExport 
      onExport={handleExport} 
      onImport={handleImport} 
      isExporting={exportMutation.isPending}
      isImporting={importMutation.isPending}
      canExport={can('EXPORT', 'POST')}
      canImport={can('IMPORT', 'POST')}
    />
  );

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Posts</PageShellTitle>
        <PageShellDescription>Manage content entries.</PageShellDescription>
        <PageShellActions>
          {can('CREATE', 'POST') && (
            <Button size="sm" onClick={() => navigate('/posts/new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          )}
        </PageShellActions>
      </PageShellHeader>

      <PageShellContent>
        <DataTable
          rows={posts}
          getRowId={(row) => row.id || row._id}
          columns={columns}
          query={tableQuery}
          total={totalItems}
          loading={query.isFetching}
          actions={tableActions}
          trailingActions={trailingActions}
        />
      </PageShellContent>

      <ConfirmDeleteDialog 
        open={!!itemToDelete}
        onOpenChange={(val) => { if (!val) setItemToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Post?"
        description="This post will be permanently deleted along with all its revisions."
      />

      <ConfirmDeleteDialog 
        open={isBulkDeleting}
        onOpenChange={setIsBulkDeleting}
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
        title="Delete Selected Posts?"
        description={`You are about to delete ${selection.selectionCount} posts. This action cannot be undone.`}
      />
    </PageShell>
  );
}
