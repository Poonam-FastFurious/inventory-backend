import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import RawMaterialMaster from "../MasterList/RawMaterialMaster.model.js";

import { RawMaterial } from "./rawmaterial.model.js";

export const addRawMaterial = async (req, res) => {
  try {
    if (!req.body) {
      throw new ApiError(400, "Request body is missing or empty");
    }

    const {
      masterId, // 🆕 from frontend
      category,
      unit,
      batchCode,
      quantity,
      purchasePrice,
      transportCharge,
      supplier,
      purchaseDate,
      expiryDate,
      description,
    } = req.body;

    // ✅ Validate required fields
    if (!masterId) {
      throw new ApiError(400, "Master ID is required");
    }

    const master = await RawMaterialMaster.findById(masterId);
    if (!master) {
      throw new ApiError(404, "Master material not found");
    }

    if (!category || category.trim() === "") {
      throw new ApiError(400, "Category is required");
    }

    if (!unit || unit.trim() === "") {
      throw new ApiError(400, "Unit is required");
    }

    if (!batchCode || batchCode.trim() === "") {
      throw new ApiError(400, "Batch Code is required");
    }

    if (!quantity || quantity <= 0) {
      throw new ApiError(400, "Quantity must be greater than 0");
    }

    if (!purchasePrice || purchasePrice <= 0) {
      throw new ApiError(400, "Purchase Price must be greater than 0");
    }

    if (transportCharge && transportCharge < 0) {
      throw new ApiError(400, "Transport Charge must be a non-negative number");
    }

    if (!supplier || supplier.trim() === "") {
      throw new ApiError(400, "Supplier is required");
    }

    if (!purchaseDate) {
      throw new ApiError(400, "Purchase Date is required");
    }

    if (!expiryDate) {
      throw new ApiError(400, "Expiry Date is required");
    }

    // ✅ Create raw material entry with reference to master
    const rawMaterial = await RawMaterial.create({
      master: master._id,
      category,
      unit,
      batchCode,
      quantity,
      purchasePrice,
      transportCharge: transportCharge || 0,
      supplier,
      purchaseDate,
      expiryDate,
      description,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, rawMaterial, "Raw Material created successfully")
      );
  } catch (error) {
    console.error("❌ Error adding raw material:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getAllRawMaterials = async (req, res) => {
  try {
    // ✅ Populate 'master' to include both ID and name, and sort by latest
    const rawMaterials = await RawMaterial.find()
      .populate("master", "name")
      .sort({ createdAt: -1 }); // Sort by newest first

    if (!rawMaterials || rawMaterials.length === 0) {
      throw new ApiError(404, "No raw materials found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, rawMaterials, "Raw materials fetched successfully")
      );
  } catch (error) {
    console.error("❌ Error fetching raw materials:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.query;

    // ✅ Validate ID
    if (!id) {
      throw new ApiError(400, "Raw material ID is required in query");
    }

    // ✅ Find and delete the raw material
    const deletedRawMaterial = await RawMaterial.findByIdAndDelete(id);

    if (!deletedRawMaterial) {
      throw new ApiError(404, "Raw material not found");
    }

    // ✅ Success response
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          deletedRawMaterial,
          "Raw material deleted successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error deleting raw material:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRawMaterialByMasterId = async (req, res) => {
  try {
    const { masterId } = req.query;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(masterId)) {
      return res.status(400).json({ message: "Invalid master ID." });
    }

    // 1. Get all raw material entries for the given masterId
    const rawMaterials = await RawMaterial.find({ master: masterId }).populate("master", "name");

    // If no entries found
    if (rawMaterials.length === 0) {
      return res.status(404).json({ message: "No raw material batches found for this master ID." });
    }

    // 2. Calculate total quantity (stock)
    const stockResult = await RawMaterial.aggregate([
      {
        $match: {
          master: new mongoose.Types.ObjectId(masterId),
        },
      },
      {
        $group: {
          _id: "$master",
          totalQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const totalQuantity = stockResult[0]?.totalQuantity || 0;

    // 3. Send response
    return res.status(200).json({
      masterId,
      masterName: rawMaterials[0].master.name,
      totalQuantity,
      batches: rawMaterials,
    });
  } catch (error) {
    console.error("Error in getRawMaterialByMasterId:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllMasterMaterialsWithStockAndBatchCount = async (req, res) => {
  try {
    // Aggregate the raw materials by master material and calculate stock and batch count
    const result = await RawMaterial.aggregate([
      {
        $group: {
          _id: "$master",  // Group by master material
          totalQuantity: { $sum: "$quantity" },  // Sum the quantities for stock
          batchCount: { $sum: 1 },  // Count the batches
        },
      },
      {
        $lookup: {
          from: "rawmaterialmasters",  // Name of the RawMaterialMaster collection
          localField: "_id",  // Field in RawMaterial to join on
          foreignField: "_id",  // Field in RawMaterialMaster to join on
          as: "masterDetails",  // The result of the lookup will be added to "masterDetails"
        },
      },
      {
        $unwind: "$masterDetails",  // Unwind the master details array to access properties
      },
      {
        $project: {
          _id: 0,  // Exclude the default _id field
          masterId: "$_id",  // Include master ID
          masterName: "$masterDetails.name",  // Include master material name
          totalQuantity: 1,  // Include the total quantity (stock)
          batchCount: 1,  // Include the batch count
        },
      },
    ]);

    if (!result || result.length === 0) {
      throw new ApiError(404, "No master materials found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Master materials with stock and batch count fetched successfully"));
  } catch (error) {
    console.error("❌ Error fetching master materials with stock and batch count:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

