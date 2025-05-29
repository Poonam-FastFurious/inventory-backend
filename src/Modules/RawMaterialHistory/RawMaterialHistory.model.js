import mongoose from "mongoose";

const rawMaterialHistorySchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterialMaster",
      required: true,
    },
    type: {
      type: String,
      enum: ["IN", "OUT", "DELETE"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    batchCode: {
      type: String,
    },
    productionBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionBatch",
    },
    reason: {
      type: String,
      default: "",
    },
    relatedBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BatchStock",
    },
    currentStockAfterTransaction: Number,
  },

  {
    timestamps: true,
  }
);

const RawMaterialHistory = mongoose.model(
  "RawMaterialHistory",
  rawMaterialHistorySchema
);

export default RawMaterialHistory;
