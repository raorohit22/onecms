import { Schema, model, Document } from 'mongoose';

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';

export interface IOrganization {
  name: string;
  slug: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrganizationDocument extends IOrganization, Document {}

const organizationSchema = new Schema<IOrganizationDocument>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED'], 
    default: 'ACTIVE' 
  }
}, {
  timestamps: true,
  collection: 'organizations',
  strict: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Avoid OverwriteModelError in serverless environments
export const Organization = model<IOrganizationDocument>('Organization', organizationSchema);
