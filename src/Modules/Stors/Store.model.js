// models/Store.js

import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    storeImage: {
      type: String, // Cloudinary URL or image path
      default: null,
    },
    assignedMasterMaterials: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RawMaterialMaster",
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model("Store", storeSchema);
export default Store;
