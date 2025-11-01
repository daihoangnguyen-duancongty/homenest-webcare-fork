import { Schema, Document, Model } from 'mongoose';
import { userDB } from '../database/connection';
import bcrypt from 'bcryptjs';

// Instance interface
export interface IUser extends Document {
  username: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  avatar?: {
    path?: string;
    filename?: string;
    originalname?: string;
  };
  role: 'admin' | 'telesale';
  stringeeUserId?: string;
    lastInteraction?: Date;
  comparePassword: (plain: string) => Promise<boolean>;
}

// Static interface
export interface IUserModel extends Model<IUser> {
  hashPassword: (plain: string) => Promise<string>;
}

// Schema
const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: {
      type: {
        path: String,
        filename: String,
        originalname: String,
      },
      required: false,
      default: {},
    },
    role: { type: String, enum: ['admin', 'telesale'], default: 'telesale' },
      stringeeUserId: { type: String, default: null },
          // theo dõi telesale online
    lastInteraction: { type: Date, default: null },
  },
  { timestamps: true }
);

// Instance method
userSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

// Static method
userSchema.statics.hashPassword = async function (plain: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

// Optional: hash password before save (chỉ hash khi password mới hoặc modified)
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Export model
const User = userDB.model<IUser, IUserModel>('User', userSchema, 'users');
export default User;
