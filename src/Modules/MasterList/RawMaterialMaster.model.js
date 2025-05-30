import mongoose from "mongoose";

const rawMaterialMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },

    unit: {
      type: String,
    },
    stockIn: {
      type: Number,
      default: 0,
    },
    stockOut: {
      type: Number,
      default: 0,
    },
    currentStock: {
      type: Number,
      default: 0, // Ideally: currentStock = stockIn - stockOut
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    batchCount: {
      type: Number,
      default: 0,
    },
    averagePrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const RawMaterialMaster = mongoose.model(
  "RawMaterialMaster",
  rawMaterialMasterSchema
);

export default RawMaterialMaster;
