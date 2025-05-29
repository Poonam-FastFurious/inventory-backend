import mongoose from "mongoose";

const formulaSchema = new mongoose.Schema(
  {
    formulaName: {
      type: String,
      required: true,
      trim: true,
    },
    formulaCode: {
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
    composition: [
      {
        material: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RawMaterialMaster",
          required: true, // Reference to the master material
        },
        grams: {
          type: Number,
          required: true, // Amount of material in grams
          min: 1,
        },
        percentage: {
          type: Number,
          required: true, // Percentage of material in the blend
          min: 0,
          max: 100,
        },
      },
    ],
    totalWeight: {
      type: Number,
      default: 1000, // Total weight in grams (1kg = 1000 grams)
    },

    createdBy: {
      type: String,
      default: "Admin", // Reference to the user who created the blend formula
    },
  },
  {
    timestamps: true,
  }
);

const Formula = mongoose.model("Formula", formulaSchema);

export default Formula;
