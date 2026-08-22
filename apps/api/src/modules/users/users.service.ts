import { User, Membership, IUserDocument } from '@onecms/db';
import * as argon2 from 'argon2';
import { AppError } from '@api/core/errors/AppError';

export const usersService = {
  findAll: async (organizationId: string, options: { skip?: number, limit?: number, sort?: Record<string, 1|-1> } = {}) => {
    const query = Membership.find({ organizationId, status: { $ne: 'DELETED' } })
      .populate({
        path: 'userId',
        select: 'email username firstName lastName status createdAt createdBy',
        populate: {
          path: 'createdBy',
          select: 'firstName lastName username'
        }
      })
      .populate('roleIds', 'name code');
      
    if (options.sort) {
      query.sort(options.sort);
    } else {
      query.sort({ createdAt: -1 });
    }

    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);

    const [memberships, total] = await Promise.all([
      query.exec(),
      Membership.countDocuments({ organizationId, status: { $ne: 'DELETED' } }).exec()
    ]);
      
    const data = memberships.map(m => {
      const user = m.userId as any;
      if (!user) return null;
      return {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        createdAt: user.createdAt,
        createdBy: user.createdBy,
        membershipId: m._id,
        membershipStatus: m.status,
        roles: m.roleIds.map((r: any) => ({ id: r._id, name: r.name, code: r.code }))
      };
    }).filter(Boolean);

    return { data, total };
  },

  create: async (userData: any, organizationId: string) => {
    // 1. Check if user already exists (by email or username)
    const existing = await User.findOne({
      $or: [{ email: userData.email }, { username: userData.username }]
    });

    if (existing) {
      throw new AppError(400, 'VALIDATION_ERROR', 'User with this email or username already exists');
    }

    // 2. Hash default password
    const passwordHash = await argon2.hash('123456');

    // 3. Create User
    const user = await User.create({
      email: userData.email,
      username: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      status: userData.status || 'ACTIVE',
      passwordHash,
      createdBy: userData.createdBy || null
    });

    // 4. Create Membership
    const roleIds = userData.roleId ? [userData.roleId] : [];
    
    await Membership.create({
      userId: user._id,
      organizationId,
      roleIds,
      status: 'ACTIVE'
    });

    return user;
  },

  update: async (userId: string, updateData: any, organizationId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    if (updateData.email || updateData.username) {
       const existing = await User.findOne({
         _id: { $ne: userId },
         $or: [
           ...(updateData.email ? [{ email: updateData.email }] : []),
           ...(updateData.username ? [{ username: updateData.username }] : [])
         ]
       });
       if (existing) {
         throw new AppError(400, 'VALIDATION_ERROR', 'Email or username already in use');
       }
    }

    // Update user details
    if (updateData.firstName) user.firstName = updateData.firstName;
    if (updateData.lastName) user.lastName = updateData.lastName;
    if (updateData.email) user.email = updateData.email;
    if (updateData.username) user.username = updateData.username;
    if (updateData.status) user.status = updateData.status;

    await user.save();

    // Update membership role if provided
    if (updateData.roleId) {
      const membership = await Membership.findOne({ userId, organizationId });
      if (membership) {
        membership.roleIds = [updateData.roleId];
        await membership.save();
      }
    }

    return user;
  },

  delete: async (userId: string, organizationId: string) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found');
    }

    // Hard delete user and membership
    await Membership.deleteMany({ userId });
    await User.findByIdAndDelete(userId);
    
    return true;
  },

  deleteMany: async (organizationId: string, payload: { ids?: string[], selectAll?: boolean, excludedIds?: string[] }): Promise<number> => {
    const filter: Record<string, any> = { organizationId };
    
    if (payload.selectAll) {
      if (payload.excludedIds && payload.excludedIds.length > 0) {
        filter['userId'] = { $nin: payload.excludedIds };
      }
    } else if (payload.ids && payload.ids.length > 0) {
      filter['userId'] = { $in: payload.ids };
    } else {
      return 0;
    }

    const memberships = await Membership.find(filter).select('userId').exec();
    const userIds = memberships.map(m => m.userId);

    await Membership.deleteMany(filter).exec();
    await User.deleteMany({ _id: { $in: userIds } }).exec();

    return userIds.length;
  },

  exportUsers: async (organizationId: string): Promise<any[]> => {
    const { data } = await usersService.findAll(organizationId);
    return data.map((u: any) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      username: u.username,
      status: u.status,
    }));
  },

  importUsers: async (data: any[], organizationId: string): Promise<{ successCount: number; errors: any[] }> => {
    let successCount = 0;
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.email || !row.username || !row.firstName || !row.lastName) {
          throw new Error('Email, username, firstName, and lastName are required');
        }
        
        const existing = await User.findOne({
          $or: [{ email: row.email }, { username: row.username }]
        });
        
        if (existing) {
          await usersService.update(existing._id.toString(), {
            firstName: row.firstName,
            lastName: row.lastName,
            status: row.status || existing.status
          }, organizationId);
        } else {
          await usersService.create({
            email: row.email,
            username: row.username,
            firstName: row.firstName,
            lastName: row.lastName,
            status: row.status || 'ACTIVE'
          }, organizationId);
        }
        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, data: row, error: err.message });
      }
    }
    
    return { successCount, errors };
  }
};
