import mongoose from "mongoose";

// Define the raw material schema
const rawMaterialSchema = new mongoose.Schema(
  {
    master: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterialMaster",
      required: true,
    },
    category: {
      type: String,

      required: true,
    },
    unit: {
      type: String,

      required: true,
    },
    batchCode: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    transportCharge: {
      type: Number,
      default: 0, // Optional: Set a default value
    },
    supplier: {
      type: String,

      required: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Export the RawMaterial model using the same pattern as Product
export const RawMaterial = mongoose.model("RawMaterial", rawMaterialSchema);
