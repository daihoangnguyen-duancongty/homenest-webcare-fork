import { Schema, Document } from "mongoose";
import { userDB } from "../database/connection"; // sử dụng kết nối userDB
import bcrypt from "bcryptjs"; // <- đổi sang bcryptjs

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
  role: "admin" | "telesale";
  comparePassword?: (plain: string) => Promise<boolean>; // thêm method comparePassword
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    avatar: { 
      type: { 
        path: { type: String },
        filename: { type: String },
        originalname: { type: String }
      },
      required: false,
      default: {},
    },
    role: { type: String, enum: ["admin", "telesale"], default: "telesale" },
  },
  { timestamps: true }
);

// Middleware hash password trước khi save
userSchema.pre("save", async function(next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method so sánh password
userSchema.methods.comparePassword = function(plain: string) {
  return bcrypt.compare(plain, this.password);
};

const User = userDB.model<IUser>("User", userSchema, "users");

export default User;
