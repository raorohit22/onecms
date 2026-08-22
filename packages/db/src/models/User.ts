import { Schema, model, Document } from 'mongoose';

export type UserStatus = 'ACTIVE' | 'DISABLED' | 'LOCKED' | 'SUSPENDED';

export interface IUser {
  email: string;
  username: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  
  managerId: Schema.Types.ObjectId | null;
  
  authVersion: number;
  securityVersion: number;
  
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Schema.Types.ObjectId | null;
}

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  
  status: { 
    type: String, 
    enum: ['ACTIVE', 'DISABLED', 'LOCKED', 'SUSPENDED'], 
    default: 'ACTIVE' 
  },
  
  managerId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  
  authVersion: { type: Number, default: 1 },
  securityVersion: { type: Number, default: 1 },
  
  lastLoginAt: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, {
  timestamps: true,
  collection: 'users',
  strict: true,
  toJSON: {
    transform: (_, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash; // NEVER LEAK PASSWORD HASH
      return ret;
    }
  }
});

export const User = model<IUserDocument>('User', userSchema);
