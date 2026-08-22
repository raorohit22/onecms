import { MasterType, MasterValue, IMasterTypeDocument, IMasterValueDocument } from '@onecms/db';
import { Types } from 'mongoose';

export class MasterService {
  // --- Master Types ---
  
  async getMasterTypes(organizationId: string): Promise<IMasterTypeDocument[]> {
    return MasterType.find({
      $or: [
        { organizationId: new Types.ObjectId(organizationId) },
        { organizationId: null, isSystem: true } // Include global system types like Roles
      ]
    }).populate('createdBy', 'firstName lastName username').sort({ sortOrder: 1, name: 1 });
  }

  async getMasterTypeBySlug(organizationId: string, slug: string): Promise<IMasterTypeDocument | null> {
    return MasterType.findOne({
      slug,
      $or: [
        { organizationId: new Types.ObjectId(organizationId) },
        { organizationId: null, isSystem: true }
      ]
    });
  }

  async createMasterType(organizationId: string, data: { name: string; slug: string; description?: string; config?: any; createdBy?: string }): Promise<IMasterTypeDocument> {
    const existing = await MasterType.findOne({ 
      organizationId: new Types.ObjectId(organizationId), 
      slug: data.slug 
    });
    
    if (existing) {
      throw new Error(`Master Type with slug '${data.slug}' already exists`);
    }

    const maxSort = await MasterType.findOne({ organizationId: new Types.ObjectId(organizationId) })
      .sort('-sortOrder')
      .select('sortOrder');
    
    const sortOrder = maxSort ? (maxSort.sortOrder + 10) : 0;

    const masterType = new MasterType({
      organizationId: new Types.ObjectId(organizationId),
      name: data.name,
      slug: data.slug,
      description: data.description,
      config: data.config,
      isSystem: false,
      sortOrder,
      createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : undefined
    });
    
    return masterType.save();
  }

  async updateMasterType(organizationId: string, id: string, data: { name?: string; description?: string; isActive?: boolean; sortOrder?: number; config?: any }): Promise<IMasterTypeDocument> {
    const masterType = await MasterType.findOneAndUpdate(
      { _id: new Types.ObjectId(id), organizationId: new Types.ObjectId(organizationId) },
      { $set: data },
      { new: true }
    );
    if (!masterType) throw new Error('Master Type not found or cannot be modified');
    return masterType;
  }

  async deleteMasterType(organizationId: string, id: string): Promise<void> {
    const masterType = await MasterType.findOne({ _id: new Types.ObjectId(id), organizationId: new Types.ObjectId(organizationId) });
    if (!masterType) throw new Error('Master Type not found');

    await MasterValue.deleteMany({ masterTypeId: masterType._id });
    await MasterType.deleteOne({ _id: masterType._id });
  }

  // --- Master Data (Values) ---

  async getMasterValues(organizationId: string, masterTypeId: string, options: { skip?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}): Promise<{ data: IMasterValueDocument[], total: number }> {
    const filter = {
      masterTypeId: new Types.ObjectId(masterTypeId),
      $or: [
        { organizationId: new Types.ObjectId(organizationId) },
        { organizationId: null }
      ]
    };

    const query = MasterValue.find(filter)
      .populate('parentId')
      .populate('createdBy', 'firstName lastName username')
      .sort(options.sort || { sortOrder: 1, label: 1 });

    if (options.skip !== undefined) query.skip(options.skip);
    if (options.limit !== undefined) query.limit(options.limit);

    const [data, total] = await Promise.all([
      query.exec(),
      MasterValue.countDocuments(filter).exec()
    ]);

    return { data, total };
  }

  async createMasterValue(organizationId: string, masterTypeId: string, data: { label: string; value: string; parentId?: string; metadata?: any; sortOrder?: number; createdBy?: string }): Promise<IMasterValueDocument> {
    const existing = await MasterValue.findOne({
      organizationId: new Types.ObjectId(organizationId),
      masterTypeId: new Types.ObjectId(masterTypeId),
      value: data.value
    });

    if (existing) {
      throw new Error(`Master Value with code/value '${data.value}' already exists in this list`);
    }

    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : 0;

    const masterValue = new MasterValue({
      organizationId: new Types.ObjectId(organizationId),
      masterTypeId: new Types.ObjectId(masterTypeId),
      label: data.label,
      value: data.value,
      parentId: data.parentId ? new Types.ObjectId(data.parentId) : null,
      metadata: data.metadata || {},
      sortOrder,
      createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : undefined
    });

    return masterValue.save();
  }

  async updateMasterValue(organizationId: string, masterTypeId: string, id: string, data: { label?: string; value?: string; parentId?: string; metadata?: any; isActive?: boolean; sortOrder?: number }): Promise<IMasterValueDocument> {
    const updateData: any = { ...data };
    if (data.parentId) updateData.parentId = new Types.ObjectId(data.parentId);
    
    const masterValue = await MasterValue.findOneAndUpdate(
      { _id: new Types.ObjectId(id), masterTypeId: new Types.ObjectId(masterTypeId), organizationId: new Types.ObjectId(organizationId) },
      { $set: updateData },
      { new: true }
    );
    if (!masterValue) throw new Error('Master Value not found');
    return masterValue;
  }

  async deleteMasterValue(organizationId: string, masterTypeId: string, id: string): Promise<void> {
    const result = await MasterValue.deleteOne({ 
      _id: new Types.ObjectId(id), 
      masterTypeId: new Types.ObjectId(masterTypeId),
      organizationId: new Types.ObjectId(organizationId)
    });
    
    if (result.deletedCount === 0) {
      throw new Error('Master Value not found');
    }
  }

  async deleteManyMasterValues(organizationId: string, masterTypeId: string, payload: { ids?: string[], selectAll?: boolean, excludedIds?: string[] }): Promise<number> {
    const baseFilter: any = {
      masterTypeId: new Types.ObjectId(masterTypeId),
      organizationId: new Types.ObjectId(organizationId)
    };

    if (payload.selectAll) {
      if (payload.excludedIds && payload.excludedIds.length > 0) {
        baseFilter['_id'] = { $nin: payload.excludedIds.map(id => new Types.ObjectId(id)) };
      }
      const result = await MasterValue.deleteMany(baseFilter).exec();
      return result.deletedCount || 0;
    } else if (payload.ids && payload.ids.length > 0) {
      baseFilter['_id'] = { $in: payload.ids.map(id => new Types.ObjectId(id)) };
      const result = await MasterValue.deleteMany(baseFilter).exec();
      return result.deletedCount || 0;
    }
    return 0;
  }

  async exportMasterValues(organizationId: string, masterTypeId: string): Promise<any[]> {
    const { data: values } = await this.getMasterValues(organizationId, masterTypeId);
    return values.map(v => ({
      label: v.label,
      value: v.value,
      sortOrder: v.sortOrder,
      metadata: v.metadata
    }));
  }

  async importMasterValues(organizationId: string, masterTypeId: string, data: any[], createdBy?: string): Promise<{ successCount: number; errors: any[] }> {
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.label || !row.value) {
          throw new Error('Label and value are required');
        }

        const existing = await MasterValue.findOne({
          organizationId: new Types.ObjectId(organizationId),
          masterTypeId: new Types.ObjectId(masterTypeId),
          value: row.value
        });

        if (existing) {
          await this.updateMasterValue(organizationId, masterTypeId, existing._id.toString(), { 
            label: row.label, 
            isActive: row.isActive !== undefined ? row.isActive : existing.isActive,
            sortOrder: row.sortOrder !== undefined ? row.sortOrder : existing.sortOrder
          });
        } else {
          await this.createMasterValue(organizationId, masterTypeId, { 
            label: row.label, 
            value: String(row.value),
            sortOrder: row.sortOrder !== undefined ? row.sortOrder : 0,
            createdBy
          });
        }
        successCount++;
      } catch (err: any) {
        errors.push({ row: i + 1, data: row, error: err.message });
      }
    }

    return { successCount, errors };
  }
}
