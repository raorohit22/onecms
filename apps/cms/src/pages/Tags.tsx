import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTags } from '../hooks/use-tags';
import { usePermissions } from '../auth/permissions';
import { Button } from '@onecms/ui/components/button';
import { Input } from '@onecms/ui/components/input';
import { Label } from '@onecms/ui/components/label';
import { Plus, Edit2, Trash2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { DataTable, type DataTableColumn } from '@onecms/ui/components/data-table';
import { Checkbox } from '@onecms/ui/components/checkbox';
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
import { DetailSheet, DetailSheetHeader, DetailSheetBody, DetailSheetMain, DetailSheetSection, DetailSheetProperties } from '../components/detail-sheet';
import { ConfirmDeleteDialog } from '../components/confirm-delete-dialog';
import Papa from 'papaparse';
import { ImportExport } from '../components/import-export';
import { parseImportFile } from '../utils/file-parser';
import { useTableQuery } from '../hooks/use-table-query';
import { useTableSelection } from '../hooks/use-table-selection';

const tagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, hyphens only'),
});

type TagFormData = z.infer<typeof tagSchema>;

export function Tags() {
  const tableQuery = useTableQuery({ defaultSort: 'createdAt' });
  const { query, deleteMutation, bulkDeleteMutation, createMutation, updateMutation, exportQuery, importMutation } = useTags(tableQuery);
  const { can } = usePermissions();
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagSchema),
    defaultValues: { name: '', slug: '' }
  });

  const response = query.data || { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
  const tags = response.data;
  const totalItems = response.meta.total;
  const pageIds = tags.map((t: any) => t.id);

  const selection = useTableSelection(totalItems);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportQuery();
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tags_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const data = await parseImportFile(file);
      const res = await importMutation.mutateAsync(data);
      toast.success(`Import complete! ${res.successCount} tags processed. ${res.errors?.length ? `${res.errors.length} errors.` : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    }
  };

  const handleCreateNew = () => {
    form.reset({ name: '', slug: '' });
    setIsCreating(true);
  };

  const handleEdit = (tag: any) => {
    form.reset({ name: tag.name, slug: tag.slug });
    setEditingId(tag.id);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      toast.success('Tag deleted');
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete tag');
    }
  };

  const handleBulkDelete = async () => {
    if (!selection.hasSelection) return;
    try {
      setIsBulkDeleting(true);
      await bulkDeleteMutation.mutateAsync({
        ids: selection.isAllSelected ? undefined : selection.selectedIds,
        selectAll: selection.isAllSelected,
        excludedIds: selection.isAllSelected ? selection.deselectedIds : undefined
      });
      toast.success('Selected tags deleted');
      selection.clearSelection();
      setIsBulkDeleting(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete selected tags');
      setIsBulkDeleting(false);
    }
  };

  const onSubmit = async (data: TagFormData) => {
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, payload: data });
        toast.success('Tag updated');
        setEditingId(null);
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Tag created');
        setIsCreating(false);
        form.reset();
      }
    } catch (err: any) {
      if (err.status === 409) {
        form.setError('slug', { message: 'A tag with this slug already exists' });
      } else {
        toast.error(err.message || 'Save failed');
      }
    }
  };

  const isSheetOpen = isCreating || !!editingId;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns = useMemo<DataTableColumn<any>[]>(() => [
    {
      id: "select",
      header: (
        <Checkbox
          checked={selection.isAllSelected || (tags.length > 0 && selection.isPageFullySelected(pageIds))}
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
          checked={selection.isRowSelected(row.id)}
          onCheckedChange={() => selection.toggleRow(row.id)}
          aria-label="Select row"
        />
      ),
      width: "w-12",
      sortable: false,
    },
    {
      id: "name",
      header: "Name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      id: "slug",
      header: "Slug",
      cell: (row) => <span className="text-muted-foreground">{row.slug}</span>,
      sortable: true,
    },
    {
      id: "createdAt",
      header: "Date",
      cell: (row) => <span className="text-muted-foreground">{row.createdAt ? format(new Date(row.createdAt), 'MMM d, yyyy') : '-'}</span>,
      sortable: true,
    },
    {
      id: "createdBy",
      header: "Created By",
      cell: (row) => <span className="text-muted-foreground">{row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : '-'}</span>,
      sortable: false,
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleEdit(row)}
              disabled={!can('UPDATE', 'TAG')}
            >
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            {can('DELETE', 'TAG') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setItemToDelete(row.id)} 
                  className="text-red-500 hover:text-red-600 focus:text-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      align: "right",
      width: "w-[100px]",
    }
  ], [tags, pageIds, selection, can]);

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
          disabled={!can('DELETE', 'TAG')}
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
      isExporting={isExporting}
      isImporting={importMutation.isPending}
      canExport={can('EXPORT', 'TAG')}
      canImport={can('IMPORT', 'TAG')}
    />
  );

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Tags</PageShellTitle>
        <PageShellDescription>Manage post tags.</PageShellDescription>
        <PageShellActions>
          {can('CREATE', 'TAG') && (
            <Button size="sm" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Tag
            </Button>
          )}
        </PageShellActions>
      </PageShellHeader>

      <PageShellContent>
        <DataTable
          query={tableQuery}
          columns={columns}
          getRowId={(row) => row.id}
          rows={tags}
          total={totalItems}
          loading={query.isFetching}
          actions={tableActions}
          trailingActions={trailingActions}
        />
      </PageShellContent>

      <DetailSheet open={isSheetOpen} onOpenChange={(val) => { if (!val) { setIsCreating(false); setEditingId(null); } }}>
        <DetailSheetHeader 
          title={editingId ? 'Edit Tag' : 'New Tag'} 
          description={editingId ? 'Update tag details' : 'Create a new tag'}
          onClose={() => { setIsCreating(false); setEditingId(null); }}
        />
        <DetailSheetBody>
          <form id="tag-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <DetailSheetMain>
              <DetailSheetSection>
                <DetailSheetProperties>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" {...form.register('name')} placeholder="e.g. Tutorial" />
                      {form.formState.errors.name && <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug</Label>
                      <Input id="slug" {...form.register('slug')} placeholder="e.g. tutorial" />
                      {form.formState.errors.slug && <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>}
                    </div>
                  </div>
                </DetailSheetProperties>
              </DetailSheetSection>
            </DetailSheetMain>
            <div className="mt-auto border-t p-4 flex justify-end gap-2 bg-muted/20">
              <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); }}>Cancel</Button>
              <Button type="submit" isLoading={isSaving}>{isSaving ? 'Saving...' : 'Save Tag'}</Button>
            </div>
          </form>
        </DetailSheetBody>
      </DetailSheet>

      <ConfirmDeleteDialog 
        open={!!itemToDelete}
        onOpenChange={(val) => { if (!val) setItemToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Tag?"
        description="This tag will be permanently removed."
      />
      
      <ConfirmDeleteDialog 
        open={isBulkDeleting}
        onOpenChange={(val) => setIsBulkDeleting(val)}
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
        title={`Delete ${selection.selectionCount} Tags?`}
        description="These tags will be permanently removed across all pages."
      />
    </PageShell>
  );
}
