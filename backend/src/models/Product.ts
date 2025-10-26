import mongoose, { Document, Schema } from "mongoose";
import { productDB } from "../database/connection"; // Đường dẫn đúng đến nơi export productDB
export interface IProduct extends Document {
  name: string;
  type: string;
  price: number;
  discount: string;
  profit: string;
  source: string;
  way: string;
  image: {
    path: string;
    filename: string;
    originalname: string;
  };
  createdAt: Date;
}

const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true},
  price: { type: Number, required: true},
  discount: { type: String, required: true},
  profit: { type: String, required: true},
  source: { type: String, required: true},
  way: { type: String, required: true},
  image:  { 
      type: { 
        path: { type: String, required: true },
        filename: { type: String, required: true },
        originalname: { type: String, required: true }
      },
      required: true
    },
  createdAt: { type: Date, default: Date.now },
});

const Product = productDB.model<IProduct>("Product", ProductSchema, "products");
export default Product;
