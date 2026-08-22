import { useState } from 'react';
import { PageShell, PageShellHeader, PageShellTitle, PageShellDescription, PageShellContent } from '../../components/page-shell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@onecms/ui/components/table';
import { Checkbox } from '@onecms/ui/components/checkbox';
import { Button } from '@onecms/ui/components/button';
import { GlobalLoader } from '@onecms/ui/components/loader';
import { Input } from '@onecms/ui/components/input';
import { Textarea } from '@onecms/ui/components/textarea';
import { Label } from '@onecms/ui/components/label';
import { Plus, Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from '../../components/confirm-delete-dialog';
import { toast } from 'sonner';
import React from 'react';
import { useForm } from 'react-hook-form';
import { DetailSheet, DetailSheetHeader, DetailSheetBody, DetailSheetMain, DetailSheetSection, DetailSheetProperties } from '../../components/detail-sheet';
import { apiClient } from '../../api/client';

export function RbacSettings() {
  const [isCreating, setIsCreating] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);
  const form = useForm({
    defaultValues: {
      name: '',
      description: ''
    }
  });
  const { data: roles = [], isLoading: loadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/roles');
      return res.data;
    }
  });

  const { data: permissions = [], isLoading: loadingPerms } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/permissions');
      return res.data;
    }
  });

  const queryClient = useQueryClient();

  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, permissionIds }: { roleId: string, permissionIds: string[] }) => {
      const res = await apiClient.put(`/settings/roles/${roleId}`, { permissionIds });
      return res.data;
    },
    onMutate: async (newRoleData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['roles'] });

      // Snapshot the previous value
      const previousRoles = queryClient.getQueryData<any[]>(['roles']);

      // Optimistically update to the new value
      if (previousRoles) {
        queryClient.setQueryData<any[]>(['roles'], (old) => {
          if (!old) return old;
          return old.map(role => {
            if (role.id === newRoleData.roleId || role._id === newRoleData.roleId) {
              return { ...role, permissionIds: newRoleData.permissionIds };
            }
            return role;
          });
        });
      }

      return { previousRoles };
    },
    onError: (err: any, newRoleData, context) => {
      // Roll back to the previous value if mutation fails
      if (context?.previousRoles) {
        queryClient.setQueryData(['roles'], context.previousRoles);
      }
      toast.error(err.message || 'Failed to update permissions');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure state is in sync with server
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onSuccess: () => {
      toast.success('Permissions updated successfully');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/settings/roles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role deleted successfully');
      setRoleToDelete(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: { name: string, description: string }) => {
      const res = await apiClient.post('/settings/role', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success('Role created successfully');
      setIsCreating(false);
      form.reset();
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleToggle = (role: any, permissionId: string, checked: boolean) => {
    const currentPerms = role.permissionIds || [];
    const newPerms = checked 
      ? [...currentPerms, permissionId]
      : currentPerms.filter((id: string) => id !== permissionId);
    
    updateRoleMutation.mutate({ roleId: role.id, permissionIds: newPerms });
  };

  if (loadingRoles || loadingPerms) {
    return <GlobalLoader text="Loading Security Matrix..." className="min-h-[400px]" />;
  }

  // Group permissions by resource for better UI
  const groupedPerms = permissions.reduce((acc: any, p: any) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {});

  return (
    <PageShell>
      <PageShellHeader>
        <PageShellTitle>Roles & Permissions (RBAC)</PageShellTitle>
        <PageShellDescription>Manage system access matrix by assigning specific permissions to roles.</PageShellDescription>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Role
          </Button>
        </div>
      </PageShellHeader>

      <PageShellContent>
        <div className="rounded-md border bg-background overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px] sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e5e7eb]">Resource / Action</TableHead>
                {roles.map((r: any) => (
                  <TableHead key={r.id} className="text-center min-w-[120px] group relative">
                    <div className="font-semibold flex items-center justify-center gap-1">
                      {r.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-2"
                        onClick={() => setRoleToDelete(r)}
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                    <div className="text-xs font-normal text-muted-foreground">{r.scope === 'GLOBAL' ? 'Global' : 'Org'}</div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedPerms).map(([resource, perms]: [string, any]) => (
                <React.Fragment key={resource}>
                  {/* Group Header */}
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableCell colSpan={roles.length + 1} className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      {resource}
                    </TableCell>
                  </TableRow>
                  
                  {/* Permissions rows */}
                  {perms.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="sticky left-0 bg-background z-10 shadow-[1px_0_0_0_#e5e7eb]">
                        <div className="font-medium text-sm">{p.action}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </TableCell>
                      {roles.map((r: any) => {
                        const rolePermissionIds = (r.permissionIds || []).map((perm: any) => 
                          typeof perm === 'string' ? perm : (perm.id || perm._id?.toString())
                        );
                        const hasPerm = rolePermissionIds.includes(p.id);
                        return (
                          <TableCell key={r.id} className="text-center border-l">
                            <Checkbox 
                              checked={hasPerm}
                              disabled={updateRoleMutation.isPending} 
                              onCheckedChange={(checked) => handleToggle({ ...r, permissionIds: rolePermissionIds }, p.id, checked as boolean)}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </PageShellContent>

      <ConfirmDeleteDialog 
        open={!!roleToDelete}
        onOpenChange={(val) => { if (!val) setRoleToDelete(null); }}
        onConfirm={() => deleteRoleMutation.mutate(roleToDelete.id)}
        isDeleting={deleteRoleMutation.isPending}
        title={`Delete Role: ${roleToDelete?.name}?`}
        description="This action cannot be undone. Users assigned to this role will lose its permissions."
      />

      <DetailSheet open={isCreating} onOpenChange={(open) => { if (!open) setIsCreating(false); }}>
        <DetailSheetHeader 
          title="New Role" 
          description="Create a new role for your organization."
          onClose={() => setIsCreating(false)}
        />
        <DetailSheetBody>
          <form id="role-form" onSubmit={form.handleSubmit((data) => createRoleMutation.mutate(data))} className="flex flex-col flex-1">
            <DetailSheetMain>
              <DetailSheetSection>
                <DetailSheetProperties>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Role Name</Label>
                      <Input id="name" {...form.register('name', { required: true })} placeholder="e.g. Editor" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" {...form.register('description', { required: true })} placeholder="Describe what this role can do..." />
                    </div>
                  </div>
                </DetailSheetProperties>
              </DetailSheetSection>
            </DetailSheetMain>
            <div className="border-t bg-muted/30 p-4 flex justify-end gap-2 shrink-0">
              <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={createRoleMutation.isPending}>Create Role</Button>
            </div>
          </form>
        </DetailSheetBody>
      </DetailSheet>
    </PageShell>
  );
}
