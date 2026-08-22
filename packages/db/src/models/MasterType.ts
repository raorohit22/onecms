import { Schema, model, Document } from 'mongoose';

export interface IMasterType {
  organizationId: Schema.Types.ObjectId | null;
  name: string; // e.g., "Languages", "Currency"
  slug: string; // e.g., "languages", "currency"
  description?: string;
  isActive: boolean;
  isSystem: boolean; // Cannot be deleted if true
  sortOrder: number;
  config: {
    allowImportExport: boolean;
  };
  createdBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMasterTypeDocument extends IMasterType, Document {}

const masterTypeSchema = new Schema<IMasterTypeDocument>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  isSystem: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
  config: {
    allowImportExport: { type: Boolean, default: false }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  collection: 'master_types',
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

masterTypeSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
masterTypeSchema.index({ organizationId: 1, name: 1 }, { unique: true });
masterTypeSchema.index({ sortOrder: 1 });

export const MasterType = model<IMasterTypeDocument>('MasterType', masterTypeSchema);
