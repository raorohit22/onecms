import { Model } from 'mongoose';
import { ITenantContext } from '@api/core/context/tenant-context';

export const tenantRepository = {
  /**
   * Safely fetches a resource by its ID ensuring it belongs to the tenant context.
   * Prevents cross-organization access if a user attempts to look up a resource
   * belonging to another organization.
   */
  async findById<T>(
    model: Model<T>,
    id: string,
    context: ITenantContext
  ): Promise<T | null> {
    return model.findOne({
      _id: id,
      organizationId: context.organizationId
    } as any).exec();
  },

  /**
   * Safely adds the organizationId constraint to any query filter.
   */
  withTenant<T>(filter: T, context: ITenantContext): T & { organizationId: string } {
    return {
      ...filter,
      organizationId: context.organizationId
    };
  }
};
