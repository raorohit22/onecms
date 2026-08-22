import { Schema, model, Document } from 'mongoose';

export interface IMasterValue {
  organizationId: Schema.Types.ObjectId | null;
  masterTypeId: Schema.Types.ObjectId; // Ref to MasterType
  label: string; // e.g., "English", "United States"
  value: string; // e.g., "en", "US"
  parentId?: Schema.Types.ObjectId; // Ref to another MasterValue for hierarchy (e.g. State -> Country)
  metadata?: any; // Flexible JSON for extra attributes
  isActive: boolean;
  sortOrder: number;
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMasterValueDocument extends IMasterValue, Document {}

const masterValueSchema = new Schema<IMasterValueDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  masterTypeId: { type: Schema.Types.ObjectId, ref: 'MasterType', required: true, index: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'MasterValue', default: null, index: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  collection: 'master_values',
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

masterValueSchema.index({ masterTypeId: 1, value: 1, organizationId: 1 }, { unique: true });
masterValueSchema.index({ sortOrder: 1 });

export const MasterValue = model<IMasterValueDocument>('MasterValue', masterValueSchema);
