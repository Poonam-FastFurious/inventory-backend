import mongoose from "mongoose";

const productionBatchSchema = new mongoose.Schema(
  {
    formula: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Formula",
      required: true,
    },
    batchCode: {
      type: String,
      required: true,
      unique: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    costPerKg: {
      type: Number,
    },
    totalCost: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "complete", "cancel"],
      default: "pending",
    },
    createdBy: {
      type: String,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);
productionBatchSchema.pre("validate", function (next) {
  if (!this.batchCode) {
    const idPart = new mongoose.Types.ObjectId()
      .toString()
      .slice(-4)
      .toUpperCase();
    const datePart = new Date().toISOString().split("T")[0].replace(/-/g, "");
    this.batchCode = `BATCH-${datePart}-${idPart}`; // e.g., BATCH-20250517-3A7B
  }
  next();
});
const ProductionBatch = mongoose.model(
  "ProductionBatch",
  productionBatchSchema
);

export default ProductionBatch;
