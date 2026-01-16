import mongoose from "mongoose";

export interface ICategory {
  title: string;
  slug: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
}

const CategorySchema = new mongoose.Schema<ICategory>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  description: String,
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
