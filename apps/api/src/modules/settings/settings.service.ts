import { Role, Permission, Audit } from '@onecms/db';

class SettingsService {
  async getRoles(organizationId: string) {
    const roles = await Role.find({
      $or: [
        { organizationId },
        { scope: 'GLOBAL' }
      ]
    }).populate('permissionIds').lean();
    
    return roles.map((role: any) => ({
      ...role,
      id: role._id.toString()
    }));
  }

  async createRole(organizationId: string, data: any) {
    const role = new Role({
      organizationId,
      scope: 'ORGANIZATION',
      name: data.name,
      description: data.description,
      permissionIds: data.permissionIds || []
    });
    return await role.save();
  }

  async updateRole(id: string, organizationId: string, data: any) {
    const role = await Role.findOne({ _id: id, organizationId });
    if (!role) throw new Error('Role not found or is GLOBAL and cannot be modified here');

    if (data.name) role.name = data.name;
    if (data.description) role.description = data.description;
    if (data.permissionIds) role.permissionIds = data.permissionIds;
    
    return await role.save();
  }

  async deleteRole(id: string, organizationId: string) {
    const role = await Role.findOne({ _id: id, organizationId });
    if (!role) throw new Error('Role not found');
    
    await role.deleteOne();
  }

  async getPermissions() {
    const permissions = await Permission.find({}).lean();
    return permissions.map((perm: any) => ({
      ...perm,
      id: perm._id.toString()
    }));
  }
}

export const settingsService = new SettingsService();
