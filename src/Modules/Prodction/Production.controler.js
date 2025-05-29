import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Formula from "../BlendFormula/BlendFormula.model.js";
import RawMaterialMaster from "../MasterList/RawMaterialMaster.model.js";
import RawMaterialHistory from "../RawMaterialHistory/RawMaterialHistory.model.js";
import ReadyStock from "../ReadyStock/readyStock.model.js";
import ProductionBatch from "./Production.modal.js";

export const createProductionBatch = async (req, res) => {
  try {
    const { formulaId, quantity } = req.body;

    if (!formulaId || !quantity) {
      throw new ApiError(400, "Formula ID and quantity (kg) are required");
    }

    const formula = await Formula.findById(formulaId);
    if (!formula) {
      throw new ApiError(404, "Formula not found");
    }

    const batch = new ProductionBatch({
      formula: formulaId,
      quantity,
      status: "pending",
      createdBy: req.user?._id || "Admin",
    });

    await batch.save();

    return res
      .status(201)
      .json(
        new ApiResponse(201, batch, "Production batch created successfully")
      );
  } catch (error) {
    console.error("❌ Error creating production batch:", error);
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


export const getAllProductionBatch = async (req, res) => {
  try {
    const { status } = req.query;

    // Create filter object
    const filter = {};
    if (status === "pending" || status === "complete") {
      filter.status = status;
    }

    // Fetch all production batches with optional status filter,
    // sorted by latest, and only formula name populated
    const batches = await ProductionBatch.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .populate("formula", "formulaName");

    if (!batches || batches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No production batches found",
      });
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          batches,
          "Production batches retrieved successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error fetching production batches:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const updateProductionBatchStatus = async (req, res) => {
  try {
    const { batchId, status } = req.body;

    const batch = await ProductionBatch.findById(batchId).populate("formula");
    if (!batch) return res.status(404).json({ message: "Batch not found" });

    if (batch.status === "complete" && status === "complete") {
      return res.status(400).json({ message: "Batch is already complete" });
    }

    if (batch.status === "cancel" && status === "cancel") {
      return res.status(400).json({ message: "Batch is already cancelled" });
    }

    // ✅ Handle cancel
    if (status === "cancel") {
      batch.status = "cancel";
      await batch.save();
      return res
        .status(200)
        .json({ message: "Batch cancelled successfully", batch });
    }

    // ✅ Handle invalid status
    if (status !== "complete") {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const formula = await Formula.findById(batch.formula._id);
    if (!formula || !Array.isArray(formula.composition)) {
      return res.status(400).json({ message: "Invalid formula composition" });
    }

    const productionQty = batch.quantity;
    const insufficientMaterials = [];
    const stockAdjustments = [];

    let totalCostPerKg = 0;

    // Check stock availability and calculate costPerKg
    for (const comp of formula.composition) {
      const rawMaterial = await RawMaterialMaster.findById(comp.material);
      if (!rawMaterial) {
        return res.status(404).json({
          message: `Raw material not found for ID: ${comp.material}`,
        });
      }

      const gramsPerKg = Number(comp.grams);
      if (isNaN(gramsPerKg) || gramsPerKg <= 0 || isNaN(productionQty)) {
        return res.status(400).json({
          message: "Invalid grams or production quantity",
        });
      }

      const requiredKg = (gramsPerKg / 1000) * productionQty;

      // Check stock
      if (rawMaterial.currentStock < requiredKg) {
        insufficientMaterials.push({
          name: rawMaterial.name,
          available: rawMaterial.currentStock,
          required: requiredKg,
        });
      } else {
        stockAdjustments.push({ rawMaterial, requiredKg });
      }

      // Calculate costPerKg (only when stock is enough)
      const materialCostPerKg = (rawMaterial.averagePrice * gramsPerKg) / 1000;
      totalCostPerKg += materialCostPerKg;
    }

    if (insufficientMaterials.length > 0) {
      const materialNames = insufficientMaterials.map((m) => m.name).join(", ");
      return res.status(400).json({
        message: `Insufficient stock for: ${materialNames}`,
        details: insufficientMaterials,
      });
    }

    // Deduct stock and log history
    for (const { rawMaterial, requiredKg } of stockAdjustments) {
      rawMaterial.stockOut = Number(rawMaterial.stockOut || 0) + requiredKg;
      rawMaterial.currentStock = Number(rawMaterial.currentStock || 0) - requiredKg;
      await rawMaterial.save();

      await RawMaterialHistory.create({
        material: rawMaterial._id,
        type: "OUT",
        quantity: requiredKg,
        reason: "Production Batch Completed",
        currentStockAfterTransaction: rawMaterial.currentStock,
        productionBatch: batch._id,
      });
    }

    // ✅ Safe upsert to avoid duplicate key error
    await ReadyStock.updateOne(
      { formula: formula._id },
      { $inc: { totalQuantity: productionQty } },
      { upsert: true }
    );

    // Update batch cost
    batch.status = "complete";
    batch.costPerKg = totalCostPerKg;
    batch.totalCost = totalCostPerKg * productionQty;

    await batch.save();

    return res
      .status(200)
      .json({ message: "Batch completed successfully", batch });
  } catch (error) {
    console.error("Error updating production batch status:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};


export const getProductionBatchDetails = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      throw new ApiError(400, "Batch ID is required");
    }

    const batch = await ProductionBatch.findById(batchId).populate({
      path: "formula",
      populate: {
        path: "composition.material", // ✅ correct field
        model: "RawMaterialMaster",
      },
    });

    if (!batch) {
      throw new ApiError(404, "Production batch not found");
    }

    const quantityInKg = batch.quantity;
    const compositionDetails = batch.formula.composition.map((item) => {
      const rawMaterial = item.material;
      const percentage = item.percentage;

      const quantityRequiredInGrams = (percentage / 100) * quantityInKg * 1000;

      return {
        rawMaterialId: rawMaterial._id,
        rawMaterialName: rawMaterial.name,
        percentageUsed: percentage,
        quantityRequiredInGrams,
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          batchId: batch._id,
          formulaName: batch.formula.name,
          quantityInKg,
          totalCost: batch.totalCost,
          compositionDetails,
        },
        "Production batch details fetched successfully"
      )
    );
  } catch (error) {
    console.error("❌ Error fetching batch details:", error);
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
