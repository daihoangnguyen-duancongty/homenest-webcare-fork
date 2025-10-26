import { Schema, Document } from 'mongoose';
import { userDB } from '../database/connection';
import bcrypt from 'bcryptjs';

// Interface IUser mở rộng Document của Mongoose
export interface IUser extends Document {
  username: string;
  phone: string;
  address: string;
  email: string;
  password: string;
  role: 'admin' | 'telesale';
  avatar?: {
    path: string;
    filename: string;
    originalname: string;
  };
  comparePassword: (plain: string) => Promise<boolean>;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'telesale'], default: 'telesale' },
    avatar: {
      path: String,
      filename: String,
      originalname: String,
    },
  },
  { timestamps: true }
);

// Middleware hash password trước khi save
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method so sánh password
userSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.password);
};

const User = userDB.model<IUser>('User', userSchema, 'users');

export default User;
