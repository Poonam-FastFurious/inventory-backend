import mongoose from "mongoose";

const batchStockSchema = new mongoose.Schema(
  {
    material: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterialMaster",
      required: true, // Reference to the raw material
    },
    category: {
      type: String,
      required: true, // Category of the material
    },
    unit: {
      type: String,
      required: true, // e.g., "kg", "gm", "liter", etc.
    },
    batchCode: {
      type: String,
      required: true, // Unique batch identifier
      trim: true,
    },
    quantity: {
      type: Number,
      required: true, // Quantity added in this batch
    },
    purchasePrice: {
      type: Number,
      required: true, // Purchase price per unit
    },
    transportCharge: {
      type: Number,
      required: true, // Transport charge per unit
    },
    supplier: {
      type: String,
      required: true, // Supplier name or company
    },
    purchaseDate: {
      type: Date,
      required: true, // Purchase date of the batch
    },
    expiryDate: {
      type: Date,
      required: true, // Expiry date of the batch
    },
    description: {
      type: String,
      default: "", // Description of the batch
    },
    stockAdded: {
      type: Number,
      required: true, // Total quantity added in this batch
    },
    stockUsed: {
      type: Number,
      default: 0, // Quantity used from this batch
    },
    stockRemaining: {
      type: Number,
      default: function () {
        return this.stockAdded - this.stockUsed;
      }, // Remaining stock in batch
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // Reference to the user who added the batch
    },
  },
  {
    timestamps: true,
  }
);

const BatchStock = mongoose.model("BatchStock", batchStockSchema);

export default BatchStock;
