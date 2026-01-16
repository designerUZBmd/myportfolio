import mongoose, { Schema, models, model } from "mongoose";

export interface IPortfolio {
  title: string;
  slug: string;

  category: mongoose.Types.ObjectId;

  coverMedia: {
    type: "image" | "video";
    url: string;
  };

  gallery: {
    type: "image" | "video";
    url: string;
  }[];

  excerpt: string;
  description: string;

  year: number;
  client?: string;
  role?: string;
  tools?: string[];

  sections: {
    title: string;
    content: string;
  }[];

  isFeatured: boolean;
  isPublished: boolean;

  createdAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>({
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

  category: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  coverMedia: {
    type: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },

  gallery: [
    {
      type: {
        type: String,
        enum: ["image", "video"],
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],

  excerpt: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  year: {
    type: Number,
    required: true,
  },

  client: {
    type: String,
  },

  role: {
    type: String,
  },

  tools: {
    type: [String],
  },

  sections: [
    {
      title: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],

  isFeatured: {
    type: Boolean,
    default: false,
  },

  isPublished: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hot reload muammosini oldini olish
const Portfolio =
  models.Portfolio || model<IPortfolio>("Portfolio", PortfolioSchema);

export default Portfolio;
