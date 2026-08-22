import React, { useState } from 'react';
import { useMasterTypes } from '../../hooks/use-masters';
import { usePermissions } from '../../auth/permissions';
import { Button } from '@onecms/ui/components/button';
import { Input } from '@onecms/ui/components/input';
import { Plus, Trash2, MoreHorizontal, Edit2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@onecms/ui/components/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@onecms/ui/components/table';
import { Checkbox } from '@onecms/ui/components/checkbox';
import { GlobalLoader } from '@onecms/ui/components/loader';
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

export function MasterTypesAdmin() {
  const { query, createMutation, updateMutation, deleteMutation } = useMasterTypes();
  const { can } = usePermissions();

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', config: { allowImportExport: false } });

  const data = query.data || [];
  const loading = query.isFetching;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteMutation.mutateAsync(itemToDelete);
      toast.success('Master Type deleted successfully');
      setItemToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete Master Type');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...formData });
        toast.success('Master Type updated');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Master Type created');
      }
      setIsCreating(false);
      setEditingItem(null);
      setFormData({ name: '', slug: '', description: '', config: { allowImportExport: false } });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save Master Type');
    }
  };

  const autoGenerateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Masters Administration</PageShellTitle>
        <PageShellActions>
          {can('CREATE', 'MASTER_TYPE') && (
            <Button size="sm" onClick={() => { setIsCreating(true); setFormData({ name: '', slug: '', description: '', config: { allowImportExport: false } }); }}>
              <Plus className="mr-2 h-4 w-4" />
              New Master Type
            </Button>
          )}
        </PageShellActions>
      </PageShellHeader>

      <PageShellContent>
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    <GlobalLoader text="Loading dictionaries..." />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.slug}</TableCell>
                    <TableCell>
                      {item.isSystem ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">System</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-800">Custom</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.isActive !== false ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Active</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}` : (item.isSystem ? 'System' : '-')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={!can('UPDATE', 'MASTER_TYPE')}
                            onClick={() => {
                              setEditingItem(item);
                              setFormData({ name: item.name, slug: item.slug, description: item.description || '', config: item.config || { allowImportExport: false } });
                            }}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            disabled={!can('DELETE', 'MASTER_TYPE')}
                            onClick={() => setItemToDelete(item.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </PageShellContent>

      <ConfirmDeleteDialog 
        open={!!itemToDelete}
        onOpenChange={(val) => { if (!val) setItemToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={deleteMutation.isPending}
        title="Delete Master Type?"
        description="This will permanently delete this taxonomy AND all associated records inside it."
      />

      <DetailSheet open={isCreating || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setIsCreating(false);
          setEditingItem(null);
        }
      }}>
        <DetailSheetHeader
          title={editingItem ? "Edit Master Type" : "New Master Type"}
          description="Create or edit a dictionary taxonomy which will appear in the left sidebar."
          onClose={() => { setIsCreating(false); setEditingItem(null); }}
        />
        <DetailSheetBody>
          <form onSubmit={handleSave} className="flex flex-col flex-1">
            <DetailSheetMain>
              <DetailSheetSection>
                <DetailSheetProperties>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Display Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={e => {
                          const newName = e.target.value;
                          setFormData({ ...formData, name: newName, slug: autoGenerateSlug(newName) });
                        }}
                        required
                        placeholder="e.g. Industry Type"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input 
                        id="slug" 
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                        required
                        placeholder="e.g. industry-type"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Input 
                        id="description" 
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional details"
                      />
                    </div>
                    <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <Label>Enable Bulk Import/Export</Label>
                        <p className="text-[0.8rem] text-muted-foreground">
                          Allow users with proper permissions to import/export this taxonomy's data via CSV.
                        </p>
                      </div>
                      <Checkbox 
                        checked={formData.config.allowImportExport}
                        onCheckedChange={(checked) => setFormData({ ...formData, config: { ...formData.config, allowImportExport: checked as boolean } })}
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
                {isSaving ? 'Saving...' : 'Save Master Type'}
              </Button>
            </div>
          </form>
        </DetailSheetBody>
      </DetailSheet>
    </PageShell>
  );
}
