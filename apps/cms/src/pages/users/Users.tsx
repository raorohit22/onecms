import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useBulkDeleteUsers, useExportUsers, useImportUsers } from '../../hooks/use-users';
import { useRoles } from '../../hooks/use-roles';
import { usePermissions } from '../../auth/permissions';
import { Button } from '@onecms/ui/components/button';
import { Input } from '@onecms/ui/components/input';
import { Label } from '@onecms/ui/components/label';
import { Plus, Edit2, Trash2, ChevronDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { 
  PageShell, 
  PageShellHeader, 
  PageShellTitle, 
  PageShellDescription,
  PageShellActions,
  PageShellContent
} from '../../components/page-shell';
import { DetailSheet, DetailSheetHeader, DetailSheetBody, DetailSheetMain, DetailSheetSection, DetailSheetProperties } from '../../components/detail-sheet';
import { ConfirmDeleteDialog } from '../../components/confirm-delete-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@onecms/ui/components/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@onecms/ui/components/dropdown-menu';
import { Badge } from '@onecms/ui/components/badge';
import { format } from 'date-fns';
import { DataTable, type DataTableColumn } from '@onecms/ui/components/data-table';
import { useTableQuery } from '../../hooks/use-table-query';
import { useTableSelection } from '../../hooks/use-table-selection';
import { Checkbox } from '@onecms/ui/components/checkbox';
import { ImportExport } from '../../components/import-export';
import { parseImportFile } from '../../utils/file-parser';

export function Users() {
  const { can } = usePermissions();
  const tableQuery = useTableQuery();
  
  const { data: usersData, isFetching } = useUsers(tableQuery);
  const { data: roles } = useRoles();

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const bulkDeleteUsers = useBulkDeleteUsers();
  const exportMutation = useExportUsers();
  const importMutation = useImportUsers();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const users = usersData?.data || [];
  const totalItems = usersData?.meta?.total || 0;
  const pageIds = users.map((u: any) => u.id || u._id);
  
  const selection = useTableSelection(totalItems);

  const form = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      roleId: '',
      status: 'ACTIVE'
    }
  });

  const handleCreateNew = () => {
    form.reset({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      roleId: '',
      status: 'ACTIVE'
    });
    setIsCreating(true);
  };

  const handleEdit = (user: any) => {
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      status: user.status,
      roleId: user.roles?.[0]?.id || ''
    });
    setEditingId(user.id);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteUser.mutateAsync(itemToDelete);
      toast.success('User deleted');
      setItemToDelete(null);
      selection.clearSelection();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const payload = {
        ids: selection.isAllSelected ? [] : selection.selectedIds,
        selectAll: selection.isAllSelected,
        excludedIds: selection.isAllSelected ? selection.deselectedIds : []
      };
      const res = await bulkDeleteUsers.mutateAsync(payload);
      toast.success(`Deleted ${res.count} users`);
      setIsBulkDeleting(false);
      selection.clearSelection();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete users');
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
      toast.success(`Imported ${result.successCount} users successfully`);
      if (result.errors?.length) {
        const firstError = result.errors[0]?.error || 'Validation error';
        toast.error(`${result.errors.length} users failed to import (e.g. Row ${result.errors[0]?.row}: ${firstError})`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import users');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await updateUser.mutateAsync({ id: userId, data: { status: newStatus } });
      toast.success(`User status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await updateUser.mutateAsync({ id: editingId, data });
        toast.success('User updated');
        setEditingId(null);
      } else {
        await createUser.mutateAsync(data);
        toast.success('User created');
        setIsCreating(false);
        form.reset();
      }
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  const columns = useMemo<DataTableColumn<any>[]>(() => [
    {
      id: 'selection',
      header: (
        <Checkbox 
          checked={selection.isAllSelected || (users.length > 0 && selection.isPageFullySelected(pageIds))}
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
      id: 'name',
      header: 'Name',
      sortable: true,
      cell: (row) => (
        <div className="font-medium">
          {row.firstName} {row.lastName}
          <div className="text-xs text-muted-foreground">@{row.username}</div>
        </div>
      )
    },
    {
      id: 'email',
      header: 'Email',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{row.email}</span>
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row) => (
        <>
          {row.roles?.map((role: any) => (
            <Badge key={role.id} variant="secondary" className="mr-1">{role.name}</Badge>
          ))}
          {(!row.roles || row.roles.length === 0) && <span className="text-muted-foreground italic text-sm">None</span>}
        </>
      )
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none disabled:opacity-50" disabled={!can('MANAGE', 'MEMBERS')}>
            <Badge 
              variant={row.status === 'ACTIVE' ? 'default' : row.status === 'SUSPENDED' ? 'destructive' : 'secondary'} 
              className={can('MANAGE', 'MEMBERS') ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
            >
              {row.status}
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem 
              onClick={() => handleStatusChange(row.id, 'ACTIVE')}
              disabled={row.status === 'ACTIVE'}
            >
              Set Active
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(row.id, 'DISABLED')}
              disabled={row.status === 'DISABLED'}
            >
              Set Disabled
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleStatusChange(row.id, 'SUSPENDED')}
              disabled={row.status === 'SUSPENDED'}
              className="text-red-500 hover:text-red-600 focus:text-red-500"
            >
              Suspend User
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleStatusChange(row.id, 'LOCKED')}
              disabled={row.status === 'LOCKED'}
            >
              Lock User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    {
      id: 'createdAt',
      header: 'Joined',
      sortable: true,
      cell: (row) => <span className="text-muted-foreground">{format(new Date(row.createdAt), 'MMM d, yyyy')}</span>
    },
    {
      id: 'createdBy',
      header: 'Created By',
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : 'Self Registered'}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      width: '60px',
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
              disabled={!can('MANAGE', 'MEMBERS')}
            >
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            
            {can('MANAGE', 'MEMBERS') && (
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
      )
    }
  ], [selection, can]);

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
          disabled={!can('MANAGE', 'MEMBERS')}
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
      canExport={can('MANAGE', 'MEMBERS')}
      canImport={can('MANAGE', 'MEMBERS')}
    />
  );

  const isSheetOpen = isCreating || !!editingId;
  const isSaving = createUser.isPending || updateUser.isPending;

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Users</PageShellTitle>
        <PageShellDescription>Manage system users, roles, and access.</PageShellDescription>
        <PageShellActions>
          {can('MANAGE', 'MEMBERS') && (
            <Button size="sm" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              New User
            </Button>
          )}
        </PageShellActions>
      </PageShellHeader>

      <PageShellContent>
        <DataTable
          rows={users}
          getRowId={(row) => row.id || row._id}
          columns={columns}
          query={tableQuery}
          total={totalItems}
          loading={isFetching}
          actions={tableActions}
          trailingActions={trailingActions}
        />
      </PageShellContent>

      <DetailSheet open={isSheetOpen} onOpenChange={(val) => { if (!val) { setIsCreating(false); setEditingId(null); } }}>
        <DetailSheetHeader 
          title={editingId ? 'Edit User' : 'New User'} 
          description={editingId ? 'Update user details' : 'Create a new user'}
          onClose={() => { setIsCreating(false); setEditingId(null); }}
        />
        <DetailSheetBody>
          <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <DetailSheetMain>
              <DetailSheetSection>
                <DetailSheetProperties>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...form.register('firstName', { required: true })} placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...form.register('lastName', { required: true })} placeholder="Doe" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" {...form.register('email', { required: true })} type="email" placeholder="john@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" {...form.register('username', { required: true })} placeholder="johndoe123" disabled={!!editingId} />
                    </div>

                    <div className="space-y-2 gap-4">
                      <Label>Role</Label>
                      <Select onValueChange={(val) => form.setValue('roleId', val)} value={form.watch('roleId')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map((role: any) => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    
                      <Label>Status</Label>
                      <Select onValueChange={(val) => form.setValue('status', val)} value={form.watch('status')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="DISABLED">Disabled</SelectItem>
                          <SelectItem value="LOCKED">Locked</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DetailSheetProperties>
              </DetailSheetSection>
            </DetailSheetMain>
            <div className="mt-auto border-t p-4 flex justify-end gap-2 bg-muted/20">
              <Button type="button" variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); }}>Cancel</Button>
              <Button type="submit" isLoading={isSaving}>{isSaving ? 'Saving...' : 'Save User'}</Button>
            </div>
          </form>
        </DetailSheetBody>
      </DetailSheet>

      <ConfirmDeleteDialog 
        open={!!itemToDelete}
        onOpenChange={(val) => { if (!val) setItemToDelete(null); }}
        onConfirm={handleDelete}
        isDeleting={deleteUser.isPending}
        title="Delete User?"
        description="This user will be permanently removed. They will immediately lose access to the system."
      />

      <ConfirmDeleteDialog 
        open={isBulkDeleting}
        onOpenChange={setIsBulkDeleting}
        onConfirm={handleBulkDelete}
        isDeleting={bulkDeleteUsers.isPending}
        title="Delete Selected Users?"
        description={`You are about to delete ${selection.selectionCount} users. This action cannot be undone.`}
      />
    </PageShell>
  );
}
