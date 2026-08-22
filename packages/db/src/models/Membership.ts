import { Schema, model, Document } from 'mongoose';

export type MembershipStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED';

export interface IMembership {
  userId: Schema.Types.ObjectId;
  organizationId: Schema.Types.ObjectId;
  roleIds: Schema.Types.ObjectId[];
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembershipDocument extends IMembership, Document {}

const membershipSchema = new Schema<IMembershipDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  roleIds: [{ type: Schema.Types.ObjectId, ref: 'Role' }],
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SUSPENDED', 'INVITED'], 
    default: 'ACTIVE' 
  }
}, {
  timestamps: true,
  collection: 'memberships',
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

// A user can only have one membership per organization
membershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });
// Optimize querying all members of an organization
membershipSchema.index({ organizationId: 1, userId: 1 });

export const Membership = model<IMembershipDocument>('Membership', membershipSchema);
