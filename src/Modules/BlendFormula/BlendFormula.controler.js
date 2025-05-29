import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import RawMaterialMaster from "../MasterList/RawMaterialMaster.model.js";
import Formula from "./BlendFormula.model.js"; // Path to the Formula model

export const addFormula = async (req, res) => {
  try {
    if (!req.body) {
      throw new ApiError(400, "Request body is missing or empty");
    }

    const { formulaName, formulaCode, description, composition, totalWeight } =
      req.body;

    if (!formulaName || !formulaCode || !composition || composition.length === 0) {
      throw new ApiError(400, "Formula name, code, and composition are required");
    }

    // Optional: Validate each material ID exists (without calculating cost)
    for (const item of composition) {
      const materialExists = await RawMaterialMaster.findById(item.material);
      if (!materialExists) {
        throw new ApiError(404, `Material with ID ${item.material} not found`);
      }
    }

    const newFormula = new Formula({
      formulaName,
      formulaCode,
      description: description || "",
      composition,
      totalWeight: totalWeight || 1000, // Default 1 kg
      createdBy: "Admin",
    });

    await newFormula.save();

    return res
      .status(201)
      .json(new ApiResponse(201, newFormula, "Blend formula created successfully"));
  } catch (error) {
    console.error("❌ Error adding blend formula:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get all blend formulas
export const listFormulas = async (req, res) => {
  try {
    // Optional: You can implement pagination and sorting using query parameters
    const { page = 1, limit = 10, search = "" } = req.query;

    // Build query based on search if provided
    const query = search
      ? {
          $or: [
            { formulaName: { $regex: search, $options: "i" } },
            { formulaCode: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Get total count for pagination
    const total = await Formula.countDocuments(query);

    // Fetch formulas with pagination
    const formulas = await Formula.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate("composition.material", "name");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { formulas, total },
          "Formulas fetched successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error fetching blend formulas:", error);

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

// Get a single blend formula by ID
export const getBlendFormulaById = async (req, res) => {
  try {
    const { id } = req.params;
    const blend = await BlendFormula.findById(id);

    if (!blend) {
      throw new ApiError(404, "Blend formula not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, blend, "Blend formula fetched"));
  } catch (error) {
    console.error("❌ Error fetching blend formula:", error);
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
// Delete a blend formula
export const deleteBlendFormula = async (req, res) => {
  try {
    const { id } = req.query;
    const blend = await Formula.findByIdAndDelete(id);

    if (!blend) {
      throw new ApiError(404, "Blend formula not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Blend formula deleted successfully"));
  } catch (error) {
    console.error("❌ Error deleting blend formula:", error);
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
