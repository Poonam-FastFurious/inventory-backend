import mongoose from "mongoose";

const readyStockSchema = new mongoose.Schema(
  {
    formula: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Formula",
      unique: true, 
      required: true,
    },
    totalQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const ReadyStock = mongoose.model("ReadyStock", readyStockSchema);

export default ReadyStock;
