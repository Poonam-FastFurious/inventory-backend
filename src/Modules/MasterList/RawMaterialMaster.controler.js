import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/Cloudinary.js";
import RawMaterialMaster from "./RawMaterialMaster.model.js";

export const addRawMaterialMaster = async (req, res) => {
  try {
    if (!req.body) {
      throw new ApiError(400, "Request body is missing or empty");
    }

    const { name, code, description } = req.body;

    // ✅ Validations
    if (!name || name.trim() === "") {
      throw new ApiError(400, "Name is required");
    }

    if (!code || code.trim() === "") {
      throw new ApiError(400, "Code is required");
    }

    // ✅ Create raw material master object (without image)
    const rawMaterialMaster = await RawMaterialMaster.create({
      name,
      code,
      description,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          rawMaterialMaster,
          "Raw Material Master created successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error adding raw material master:", error);

    // ✅ Handle Mongoose Validation Errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: errors.join(", "),
      });
    }

    // ✅ If error is already an instance of `ApiError`
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // ✅ Handle Unknown Errors
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const addbulkMaster = async (req, res) => {
  try {
    const materials = req.body;

    if (!Array.isArray(materials) || materials.length === 0) {
      throw new ApiError(400, "Request body should be a non-empty array");
    }

    const validMaterials = [];

    for (const item of materials) {
      if (!item.name || !item.code) {
        continue; // skip invalid
      }

      // Check if material already exists by code
      const exists = await RawMaterialMaster.findOne({ code: item.code });

      if (!exists) {
        validMaterials.push(item);
      }
    }

    if (validMaterials.length === 0) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            [],
            "No new raw materials to add (all duplicates)"
          )
        );
    }

    const inserted = await RawMaterialMaster.insertMany(validMaterials, {
      ordered: false, // continue on error
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          inserted,
          "New raw material masters added successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error adding raw material masters:", error);

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

// Edit Raw Material Master
export const editRawMaterialMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    // ✅ Validate ID
    if (!id) {
      throw new ApiError(400, "ID is required for editing");
    }

    // ✅ Find the existing raw material
    const existingRawMaterial = await RawMaterialMaster.findById(id);
    if (!existingRawMaterial) {
      throw new ApiError(404, "Raw Material Master not found");
    }

    // ✅ Update Fields
    if (name) existingRawMaterial.name = name;
    if (code) existingRawMaterial.code = code;
    if (description) existingRawMaterial.description = description;

    // ✅ Handle Image Update (if new image provided)
    if (req.files?.image) {
      const imageLocalPath = req.files.image[0].path;
      const uploadedImage = await uploadOnCloudinary(imageLocalPath);
      if (!uploadedImage) {
        throw new ApiError(400, "Failed to upload image");
      }
      existingRawMaterial.image = uploadedImage.url;
    }

    // ✅ Save Updated Raw Material
    const updatedRawMaterial = await existingRawMaterial.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedRawMaterial,
          "Raw Material Master updated successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error editing raw material master:", error);

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

// Delete Raw Material Master
export const deleteRawMaterialMaster = async (req, res) => {
  try {
    const { id } = req.query;

    // ✅ Validate ID
    if (!id) {
      throw new ApiError(400, "ID is required for deletion");
    }

    // ✅ Find and delete the raw material
    const deletedRawMaterial = await RawMaterialMaster.findByIdAndDelete(id);
    if (!deletedRawMaterial) {
      throw new ApiError(404, "Raw Material Master not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Raw Material Master deleted successfully")
      );
  } catch (error) {
    console.error("❌ Error deleting raw material master:", error);

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

// List All Raw Material Masters (with optional pagination)
export const listRawMaterialMasters = async (req, res) => {
  try {
    const { page, limit } = req.query;

    let rawMaterials;
    let totalCount;

    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (pageNum < 1 || limitNum < 1) {
        throw new ApiError(400, "Page and limit must be greater than 0");
      }

      rawMaterials = await RawMaterialMaster.find()
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      totalCount = await RawMaterialMaster.countDocuments();
    } else {
      // No pagination - return all
      rawMaterials = await RawMaterialMaster.find().sort({ createdAt: -1 });
      totalCount = rawMaterials.length;
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { rawMaterials, totalCount },
          "Raw Material Masters fetched successfully"
        )
      );
  } catch (error) {
    console.error("❌ Error listing raw material masters:", error);

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

export const getRawMaterialMasterById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ID
    if (!id) {
      throw new ApiError(400, "ID parameter is required");
    }

    // ✅ Find by ID
    const material = await RawMaterialMaster.findById(id);

    if (!material) {
      throw new ApiError(404, "Raw Material Master not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, material, "Raw Material Master retrieved"));
  } catch (error) {
    console.error("❌ Error getting raw material master by ID:", error);

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
