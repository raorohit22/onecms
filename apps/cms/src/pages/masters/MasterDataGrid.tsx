import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useMasterValues, useMasterTypes } from '../../hooks/use-masters';
import { usePermissions } from '../../auth/permissions';
import { Button } from '@onecms/ui/components/button';
import { Input } from '@onecms/ui/components/input';
import { Plus, Edit2, Trash2, MoreHorizontal, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@onecms/ui/components/dropdown-menu';
import { DataTable, type DataTableColumn } from '@onecms/ui/components/data-table';
import { Checkbox } from '@onecms/ui/components/checkbox';
import { toast } from 'sonner';
import { 
  PageShell, 
  PageShellHeader, 
  PageShellTitle, 
  PageShellDescription,
  PageShellActions,
  PageShellContent
} from '../../components/page-shell';
import { ConfirmDeleteDialog } from '../../components/confirm-delete-dialog';
import { DetailSheet, DetailSheetHeader, DetailSheetBody, DetailSheetMain, DetailSheetProperties, DetailSheetSection } from '../../components/detail-sheet';
import { Label } from '@onecms/ui/components/label';

import Papa from 'papaparse';
import { ImportExport } from '../../components/import-export';
import { parseImportFile } from '../../utils/file-parser';
import { useTableQuery } from '../../hooks/use-table-query';
import { useTableSelection } from '../../hooks/use-table-selection';

export function MasterDataGrid() {
  const { slug } = useParams<{ slug: string }>();
  const tableQuery = useTableQuery({ defaultSort: 'sortOrder' });
  const { query, createMutation, updateMutation, deleteMutation, exportQuery, importMutation, bulkDeleteMutation } = useMasterValues(slug || '', tableQuery);
  const { query: typesQuery } = useMasterTypes();
  const { can } = usePermissions();

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ label: '', value: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const response = query.data || { data: [], meta: { total: 0, page: 1, totalPages: 0 } };
  const data = response.data;
  const totalItems = response.meta.total;
  const pageIds = data.map((item: any) => item.id);

  const selection = useTableSelection(totalItems);

  const loading = query.isFetching;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const currentType = (typesQuery.data || []).find((t: any) => t.slug === slug);
  const allowImportExport = currentType?.config?.allowImportExport === true;

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      toast.success('Record deleted successfully');
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete record');
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
      toast.success('Selected records deleted');
      selection.clearSelection();
      setIsBulkDeleting(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete selected records');
      setIsBulkDeleting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportQuery();
      const csv = Papa.unparse(exportData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${slug}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const parsedData = await parseImportFile(file);
      const res = await importMutation.mutateAsync(parsedData);
      toast.success(`Import complete! ${res.successCount} records processed. ${res.errors?.length ? `${res.errors.length} errors.` : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...formData });
        toast.success('Record updated');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Record created');
      }
      setIsCreating(false);
      setEditingItem(null);
      setFormData({ label: '', value: '' });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save record');
    }
  };

  const columns = useMemo<DataTableColumn<any>[]>(() => [
    {
      id: "select",
      header: (
        <Checkbox
          checked={selection.isAllSelected || (data.length > 0 && selection.isPageFullySelected(pageIds))}
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
      id: "label",
      header: "Label",
      cell: (row) => <span className="font-medium">{row.label}</span>,
      sortable: true,
    },
    {
      id: "value",
      header: "Value / Code",
      cell: (row) => <span className="text-muted-foreground">{row.value}</span>,
      sortable: true,
    },
    {
      id: "createdAt",
      header: "Date",
      cell: (row) => <span className="text-muted-foreground">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '-'}</span>,
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
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!can('UPDATE', 'MASTER_VALUE')}
              onClick={() => {
                setEditingItem(row);
                setFormData({ label: row.label, value: row.value });
              }}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            
            {can('DELETE', 'MASTER_VALUE') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => setItemToDelete(row.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      align: "right",
      width: "w-[100px]",
    }
  ], [data, pageIds, selection, can]);

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
          disabled={!can('DELETE', 'MASTER_VALUE')}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : null;

  const trailingActions = allowImportExport ? (
    <ImportExport 
      onExport={handleExport} 
      onImport={handleImport} 
      isExporting={isExporting}
      isImporting={importMutation.isPending}
      canExport={can('EXPORT', 'MASTER_VALUE')}
      canImport={can('IMPORT', 'MASTER_VALUE')}
    />
  ) : null;

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle className="capitalize">{slug} Master</PageShellTitle>
        <PageShellDescription>Manage Dictionary Values</PageShellDescription>
        <PageShellActions>
          {can('CREATE', 'MASTER_VALUE') && (
            <Button size="sm" onClick={() => { setIsCreating(true); setEditingItem(null); setFormData({ label: '', value: '' }); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          )}
        </PageShellActions>
      </PageShellHeader>

      <PageShellContent>
        <DataTable
          query={tableQuery}
          columns={columns}
          getRowId={(row) => row.id}
          rows={data}
          total={totalItems}
          loading={loading}
          actions={tableActions}
          trailingActions={trailingActions}
        />
      </PageShellContent>

      <ConfirmDeleteDialog 
        open={!!itemToDelete}
        onOpenChange={(val) => { if (!val) setItemToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Record?"
        description="This record will be permanently deleted."
      />

      <ConfirmDeleteDialog 
        open={isBulkDeleting}
        onOpenChange={(val) => setIsBulkDeleting(val)}
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
        title={`Delete ${selection.selectionCount} Records?`}
        description="These records will be permanently removed across all pages."
      />

      <DetailSheet open={isCreating || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingItem(null);
        }
      }}>
        <DetailSheetHeader
          title={editingItem ? `Edit ${slug}` : `New ${slug}`}
          description={`Update dictionary values for ${slug}.`}
          onClose={() => { setIsCreating(false); setEditingItem(null); }}
        />
        <DetailSheetBody>
          <form onSubmit={handleSave} className="flex flex-col flex-1">
            <DetailSheetMain>
              <DetailSheetSection>
                <DetailSheetProperties>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="label">Display Label</Label>
                      <Input 
                        id="label" 
                        value={formData.label}
                        onChange={e => setFormData({ ...formData, label: e.target.value })}
                        required
                        placeholder="e.g. English"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="value">Unique Code / Value</Label>
                      <Input 
                        id="value" 
                        value={formData.value}
                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                        required
                        placeholder="e.g. EN"
                      />
                    </div>
                  </div>
                </DetailSheetProperties>
              </DetailSheetSection>
            </DetailSheetMain>
            <div className="mt-auto border-t p-4 flex justify-end gap-2 bg-muted/20">
              <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingItem(null); }}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save Record'}
              </Button>
            </div>
          </form>
        </DetailSheetBody>
      </DetailSheet>
    </PageShell>
  );
}
