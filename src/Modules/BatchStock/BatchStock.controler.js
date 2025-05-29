import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import RawMaterialMaster from "../MasterList/RawMaterialMaster.model.js";
import RawMaterialHistory from "../RawMaterialHistory/RawMaterialHistory.model.js";
import BatchStock from "./BatchStock.model.js";
export const addBatchStock = async (req, res) => {
  try {
    if (!req.body) {
      throw new ApiError(400, "Request body is missing or empty");
    }

    const {
      masterId,
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

    if (!masterId) throw new ApiError(400, "Master ID is required");

    const master = await RawMaterialMaster.findById(masterId);
    if (!master) throw new ApiError(404, "Master material not found");

    if (
      !category ||
      !unit ||
      !batchCode ||
      !quantity ||
      !purchasePrice ||
      !supplier ||
      !purchaseDate ||
      !expiryDate
    ) {
      throw new ApiError(400, "Required fields are missing");
    }

    const batchStock = new BatchStock({
      material: masterId,
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
      stockAdded: quantity,
      stockRemaining: quantity,
    });

    await batchStock.save();

    // Update master stock values
    master.stockIn += Number(quantity);
    master.currentStock += Number(quantity);

    // ✅ Correct total cost calculation
    const totalBatchCost =
      purchasePrice * quantity + (transportCharge || 0) * quantity;

    master.totalCost = (master.totalCost || 0) + totalBatchCost;
    master.batchCount = (master.batchCount || 0) + 1;

    // ✅ Average price = total cost / total quantity in stock
    master.averagePrice = master.totalCost / master.stockIn;

    await master.save();

    // Save raw material history
    await RawMaterialHistory.create({
      material: masterId,
      type: "IN",
      quantity,
      batchCode,
      relatedBatch: batchStock._id,
      reason: "Batch Added",
      currentStockAfterTransaction: master.currentStock,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        batchStock,
        "Batch stock added and master updated with average price"
      )
    );
  } catch (error) {
    console.error("❌ Error adding batch stock:", error);
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json({ success: false, message: errors.join(", ") });
    }
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const deleteBatchStock = async (req, res) => {
  try {
    const { id } = req.query;

    const batch = await BatchStock.findById(id);
    if (!batch) throw new ApiError(404, "Batch not found");

    const master = await RawMaterialMaster.findById(batch.material);
    if (!master) throw new ApiError(404, "Related master material not found");

    const quantity = Number(batch.quantity);
    master.stockIn = Math.max(0, master.stockIn - quantity);
    master.currentStock = Math.max(0, master.currentStock - quantity);
    await master.save();

    // ✅ Add history entry
    await RawMaterialHistory.create({
      material: master._id,
      type: "DELETE",
      quantity,
      batchCode: batch.batchCode,
      relatedBatch: batch._id,
      reason: "Batch Deleted",
      currentStockAfterTransaction: master.currentStock,
    });

    await batch.deleteOne();

    return res.status(200).json(new ApiResponse(200, null, "Batch stock deleted and master stock updated"));
  } catch (error) {
    console.error("❌ Error deleting batch stock:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getBatchStocks = async (req, res) => {
  try {
    // Fetch all batch stocks with populated material details
    const batches = await BatchStock.find().populate("material");

    // If no batches found
    if (batches.length === 0) {
      throw new ApiError(404, "No batch stocks found");
    }

    // Return success response
    return res
      .status(200)
      .json(new ApiResponse(200, batches, "Batch stocks fetched successfully"));
  } catch (error) {
    console.error("❌ Error fetching batch stocks:", error);

    // Handle custom ApiError
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle server errors
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getRawMaterialHistory = async (req, res) => {
  try {
    const { masterId } = req.query;
    const { type } = req.query; // type can be "IN", "OUT", "DELETE"

    if (!masterId) {
      throw new ApiError(400, "Master ID is required");
    }

    // Build filter object
    const filter = { material: masterId };
    if (type && ["IN", "OUT", "DELETE"].includes(type.toUpperCase())) {
      filter.type = type.toUpperCase();
    }

    const history = await RawMaterialHistory.find(filter)
      .sort({ createdAt: -1 })
      .populate("relatedBatch", "batchCode quantity purchaseDate expiryDate purchasePrice transportCharge description category unit supplier")
      .lean();

    return res
      .status(200)
      .json(new ApiResponse(200, history, "Filtered history fetched successfully"));
  } catch (error) {
    console.error("❌ Error fetching filtered history:", error);

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
