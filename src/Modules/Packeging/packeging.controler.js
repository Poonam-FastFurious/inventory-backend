import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import ProductionBatch from "../Prodction/Production.modal.js";
import Packaging from "./packeging.model.js";

export const createPackaging = async (req, res) => {
  try {
    const {
      productionBatchId,
      packageSizeInGrams,
      numberOfPackages,
      notes,
      packagingDate, // <-- from frontend
      expiryDate, // <-- from frontend
    } = req.body;

    if (
      !productionBatchId ||
      !packageSizeInGrams ||
      !numberOfPackages ||
      !packagingDate ||
      !expiryDate
    ) {
      throw new ApiError(400, "Required fields missing");
    }

    const productionBatch = await ProductionBatch.findById(
      productionBatchId
    ).populate("formula");

    if (!productionBatch || productionBatch.status !== "complete") {
      throw new ApiError(400, "Invalid or incomplete production batch");
    }

    const totalWeight = (packageSizeInGrams * numberOfPackages) / 1000; // in KG

    if (totalWeight > productionBatch.quantity) {
      throw new ApiError(
        400,
        `Only ${productionBatch.quantity}kg available in batch`
      );
    }

    // Calculate price per pack: (costPerKg / 1000 * packSize) + ₹10
    const costPerGram = productionBatch.costPerKg / 1000;
    const pricePerPack = costPerGram * packageSizeInGrams + 10;

    // Reduce quantity from batch
    productionBatch.quantity -= totalWeight;
    await productionBatch.save();

    const packaging = new Packaging({
      productionBatch: productionBatchId,

      packageSizeInGrams,
      numberOfPackages,
      totalWeight,
      pricePerPack: parseFloat(pricePerPack.toFixed(2)),
      notes,
      packagedBy: req.user?._id || "Admin",
      packagingDate,
      expiryDate,
    });

    await packaging.save();

    const responseData = {
      ...packaging.toObject(),
      batchCode: productionBatch.batchCode,
    };

    return res
      .status(201)
      .json(
        new ApiResponse(201, responseData, "Packaging created successfully")
      );
  } catch (error) {
    console.error("❌ Error creating packaging:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const getPackagings = async (req, res) => {
  try {
    // Extract filters from query params (e.g., ?formulaName=MASALE&batchCode=BATCH-20250519-C359)
    const { formulaName, batchCode, packagingDate } = req.query;

    // Build mongoose query object
    const query = {};

    // We need to filter by fields inside productionBatch.formula.formulaName or productionBatch.batchCode,
    // so use aggregation or populate + manual filtering below.

    // Step 1: Fetch packaging with populated productionBatch & formula
    let packagings = await Packaging.find()
      .populate({
        path: "productionBatch",
        select: "batchCode formula ",
        populate: {
          path: "formula",
          select: "formulaName",
        },
      })
      .sort({ createdAt: -1 });

    // Step 2: Apply filters manually on populated data
    if (formulaName) {
      packagings = packagings.filter((p) =>
        p.productionBatch?.formula?.formulaName
          .toLowerCase()
          .includes(formulaName.toLowerCase())
      );
    }

    if (batchCode) {
      packagings = packagings.filter((p) =>
        p.productionBatch?.batchCode
          .toLowerCase()
          .includes(batchCode.toLowerCase())
      );
    }

    if (packagingDate) {
      const filterDate = new Date(packagingDate);
      packagings = packagings.filter(
        (p) =>
          new Date(p.packagingDate).toDateString() === filterDate.toDateString()
      );
    }

    // Step 3: Map to response format
    const responseData = packagings.map((pkg) => ({
      _id: pkg._id,
      productionBatch: pkg.productionBatch?._id,
      batchCode: pkg.productionBatch?.batchCode,
      formulaId: pkg.productionBatch?.formula?._id || null,
      formulaName:
        pkg.productionBatch?.formula?.formulaName || "Unknown Formula",
      packageSizeInGrams: pkg.packageSizeInGrams,
      numberOfPackages: pkg.numberOfPackages,
      totalWeight: pkg.totalWeight,
      pricePerPack: pkg.pricePerPack,
      notes: pkg.notes,
      packagedBy: pkg.packagedBy,
      packagingDate: pkg.packagingDate,
      expiryDate: pkg.expiryDate,
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt,
    }));

    return res.status(200).json({
      statusCode: 200,
      data: responseData,
      message: "Packaging list fetched successfully",
      success: true,
    });
  } catch (error) {
    console.error("❌ Error fetching packaging list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
