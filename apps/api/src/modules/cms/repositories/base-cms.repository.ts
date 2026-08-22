import { Model, Document } from 'mongoose';
import { ITenantContext } from '@api/core/context/tenant-context';
import { tenantRepository } from '@api/modules/tenant/tenant.repository';
import { CmsCache } from '@api/infrastructure/redis/cms-cache';

export interface ListOptions {
  skip?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  populate?: string | { path: string; select?: string }[];
  cursor?: string;
}

/**
 * Base Repository for CMS Entities.
 * 
 * Provides centralized, tenant-isolated CRUD data access and automatic Redis cache-aside management.
 * Guarantees that all queries:
 * 1. Strictly append `organizationId` from the verified `ITenantContext`.
 * 2. Invalidate cache on mutations (create, update, delete).
 * 3. Support pagination, sorting, and keyset cursor-based queries.
 */
export abstract class BaseCmsRepository<
  TDoc extends Document,
  TCreate extends Record<string, any> = Record<string, any>,
  TUpdate extends Record<string, any> = Record<string, any>
> {
  protected constructor(
    protected readonly model: Model<TDoc>,
    protected readonly entityName: string
  ) {}

  /**
   * Finds a document by its ID within the tenant organization context (cache-aside).
   */
  async findById(id: string, context: ITenantContext): Promise<TDoc | null> {
    const key = CmsCache.getKey(this.entityName, context, `id:${id}`);
    return CmsCache.getOrSet(key, async () => {
      return tenantRepository.findById(this.model, id, context) as Promise<TDoc | null>;
    });
  }

  /**
   * Finds a document by its unique slug within the tenant organization context.
   */
  async findBySlug(slug: string, context: ITenantContext): Promise<TDoc | null> {
    const key = CmsCache.getKey(this.entityName, context, `slug:${slug}`);
    return CmsCache.getOrSet(key, async () => {
      return this.model.findOne(tenantRepository.withTenant({ slug }, context)).exec() as Promise<TDoc | null>;
    });
  }

  /**
   * Lists documents matching filter within tenant context with pagination and sorting.
   */
  async list(
    filter: Record<string, any> = {},
    context: ITenantContext,
    options: ListOptions = {}
  ): Promise<TDoc[]> {
    const hash = Buffer.from(JSON.stringify({ filter, options })).toString('base64');
    const key = CmsCache.getKey(this.entityName, context, `list:${hash}`);

    return CmsCache.getOrSet(key, async () => {
      const baseFilter = { ...filter };
      if (options.cursor && (!options.sort || options.sort.createdAt === -1)) {
        baseFilter._id = { $lt: options.cursor };
      }

      const query = this.model.find(tenantRepository.withTenant(baseFilter, context));

      if (options.populate) {
        if (typeof options.populate === 'string') {
          query.populate(options.populate);
        } else if (Array.isArray(options.populate)) {
          options.populate.forEach(p => query.populate(p));
        }
      }

      query.sort(options.sort || { createdAt: -1 });

      if (options.skip !== undefined) query.skip(options.skip);
      if (options.limit !== undefined) query.limit(options.limit);

      return query.exec() as Promise<TDoc[]>;
    });
  }

  /**
   * Counts documents matching filter within tenant context.
   */
  async count(filter: Record<string, any> = {}, context: ITenantContext): Promise<number> {
    return this.model.countDocuments(tenantRepository.withTenant(filter, context)).exec();
  }

  /**
   * Creates a new document within tenant boundary and invalidates cache.
   */
  async create(data: TCreate, context: ITenantContext): Promise<TDoc> {
    const doc = new this.model({
      ...data,
      organizationId: context.organizationId
    });
    const saved = await doc.save();
    await CmsCache.invalidateEntity(this.entityName, context);
    return saved as TDoc;
  }

  /**
   * Updates an existing document within tenant boundary and invalidates cache.
   */
  async update(id: string, data: TUpdate, context: ITenantContext): Promise<TDoc | null> {
    const updated = await this.model.findOneAndUpdate(
      tenantRepository.withTenant({ _id: id }, context),
      { $set: data },
      { new: true }
    ).exec();

    if (updated) {
      await CmsCache.invalidateEntity(this.entityName, context);
    }
    return updated as TDoc | null;
  }

  /**
   * Deletes a single document by ID within tenant boundary and invalidates cache.
   */
  async delete(id: string, context: ITenantContext): Promise<boolean> {
    const result = await this.model.deleteOne(tenantRepository.withTenant({ _id: id }, context)).exec();
    if (result.deletedCount === 1) {
      await CmsCache.invalidateEntity(this.entityName, context);
    }
    return result.deletedCount === 1;
  }

  /**
   * Deletes multiple documents by ID list within tenant boundary and invalidates cache.
   */
  async deleteMany(ids: string[], context: ITenantContext): Promise<number> {
    const result = await this.model.deleteMany(
      tenantRepository.withTenant({ _id: { $in: ids } }, context)
    ).exec();

    if (result.deletedCount) {
      await CmsCache.invalidateEntity(this.entityName, context);
    }
    return result.deletedCount || 0;
  }

  /**
   * Deletes multiple documents matching filter within tenant boundary and invalidates cache.
   */
  async deleteManyByFilter(filter: Record<string, any>, context: ITenantContext): Promise<number> {
    const result = await this.model.deleteMany(tenantRepository.withTenant(filter, context)).exec();
    if (result.deletedCount) {
      await CmsCache.invalidateEntity(this.entityName, context);
    }
    return result.deletedCount || 0;
  }
}
