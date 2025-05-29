import mongoose from "mongoose";

const packagingSchema = new mongoose.Schema(
  {
    productionBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductionBatch",
      required: true,
    },
    packageSizeInGrams: {
      type: Number,
      required: true,
    },
    numberOfPackages: {
      type: Number,
      required: true,
    },
    totalWeight: {
      type: Number,
      required: true,
    },
    pricePerPack: {
      type: Number,
      required: true,
    },
    packagedBy: {
      type: String,
      ref: "Admin",
    },
    packagingDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
      required: true, // Optional: You can make it false and calculate dynamically
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Packaging = mongoose.model("Packaging", packagingSchema);
export default Packaging;
