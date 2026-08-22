import { Document } from 'mongoose';
import { ITenantContext } from '@api/core/context/tenant-context';
import { BaseCmsRepository, ListOptions } from '../repositories/base-cms.repository';
import { NotFoundError, ConflictError } from '@api/core/errors/AppError';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export interface BulkDeletePayload {
  ids?: string[];
  selectAll?: boolean;
  excludedIds?: string[];
}

/**
 * Base Application Service for CMS domain entities.
 * 
 * Provides unified domain logic for CRUD operations, tenant isolation validation,
 * pagination coordination, conflict mapping, and error boundary enforcement.
 */
export abstract class BaseCmsService<
  TDoc extends Document,
  TCreate extends Record<string, any> = Record<string, any>,
  TUpdate extends Record<string, any> = Record<string, any>
> {
  protected constructor(
    protected readonly repository: BaseCmsRepository<TDoc, TCreate, TUpdate>,
    protected readonly entityDisplayName: string
  ) {}

  /**
   * Retrieves a single entity by ID, asserting it exists within tenant context.
   */
  async getById(id: string, context: ITenantContext): Promise<TDoc> {
    const doc = await this.repository.findById(id, context);
    if (!doc) {
      throw new NotFoundError(this.entityDisplayName);
    }
    return doc;
  }

  /**
   * Retrieves a single entity by unique slug within tenant context.
   */
  async getBySlug(slug: string, context: ITenantContext): Promise<TDoc> {
    const doc = await this.repository.findBySlug(slug, context);
    if (!doc) {
      throw new NotFoundError(this.entityDisplayName);
    }
    return doc;
  }

  /**
   * Lists entities matching filters with pagination and returns data + total count.
   */
  async list(
    filter: Record<string, any> = {},
    context: ITenantContext,
    options: ListOptions = {}
  ): Promise<PaginatedResult<TDoc>> {
    const [data, total] = await Promise.all([
      this.repository.list(filter, context, options),
      this.repository.count(filter, context),
    ]);
    return { data, total };
  }

  /**
   * Counts entities matching filter within tenant context.
   */
  async count(filter: Record<string, any> = {}, context: ITenantContext): Promise<number> {
    return this.repository.count(filter, context);
  }

  /**
   * Creates a new entity within tenant context with duplicate slug conflict handling.
   */
  async create(data: TCreate, context: ITenantContext): Promise<TDoc> {
    try {
      return await this.repository.create(data, context);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`${this.entityDisplayName} with this slug already exists in this organization`);
      }
      throw error;
    }
  }

  /**
   * Updates an existing entity within tenant context.
   */
  async update(id: string, data: TUpdate, context: ITenantContext): Promise<TDoc> {
    try {
      const updated = await this.repository.update(id, data, context);
      if (!updated) {
        throw new NotFoundError(this.entityDisplayName);
      }
      return updated;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`${this.entityDisplayName} with this slug already exists in this organization`);
      }
      throw error;
    }
  }

  /**
   * Deletes a single entity by ID within tenant context.
   */
  async delete(id: string, context: ITenantContext): Promise<void> {
    const success = await this.repository.delete(id, context);
    if (!success) {
      throw new NotFoundError(this.entityDisplayName);
    }
  }

  /**
   * Deletes multiple entities either by ID list or full selection minus exclusions.
   */
  async deleteMany(context: ITenantContext, payload: BulkDeletePayload): Promise<number> {
    if (payload.selectAll) {
      const filter: Record<string, any> = {};
      if (payload.excludedIds && payload.excludedIds.length > 0) {
        filter['_id'] = { $nin: payload.excludedIds };
      }
      return this.repository.deleteManyByFilter(filter, context);
    } else if (payload.ids && payload.ids.length > 0) {
      return this.repository.deleteMany(payload.ids, context);
    }
    return 0;
  }
}
