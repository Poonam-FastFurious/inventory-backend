import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../../utils/Cloudinary.js";
import Store from "./Store.model.js";
import bcrypt from "bcrypt";

export const addStore = async (req, res) => {
  try {
    if (!req.body) {
      throw new ApiError(400, "Request body is missing or empty");
    }

    const { storeName, userName, password, phone, email } = req.body;

    // ✅ Validations
    if (!storeName?.trim()) throw new ApiError(400, "Store Name is required");
    if (!userName?.trim()) throw new ApiError(400, "Username is required");
    if (!password?.trim()) throw new ApiError(400, "Password is required");
    if (!phone?.trim()) throw new ApiError(400, "Phone number is required");
    if (!email?.trim()) throw new ApiError(400, "Email is required");

    // ✅ Validate image
    if (!req.files?.image) {
      throw new ApiError(400, "Store image is required");
    }

    // ✅ Upload Image to Cloudinary
    const imageLocalPath = req.files.image[0].path;
    const uploadedImage = await uploadOnCloudinary(imageLocalPath);
    if (!uploadedImage) {
      throw new ApiError(400, "Failed to upload store image");
    }

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create the store
    const newStore = await Store.create({
      storeName,
      userName,
      password: hashedPassword,
      phone,
      email,
      storeImage: uploadedImage.url,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newStore, "Store created successfully"));
  } catch (error) {
    console.error("❌ Error adding store:", error);

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
export const toggleStoreStatus = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res
        .status(404)
        .json({ success: false, message: "Store not found" });
    }

    store.active = !store.active;
    await store.save();

    return res.status(200).json({
      success: true,
      message: "Store status updated",
      active: store.active,
    });
  } catch (error) {
    console.error("Error toggling store status:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStore = await Store.findByIdAndDelete(id);

    if (!deletedStore) {
      throw new ApiError(404, "Store not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Store deleted successfully"));
  } catch (error) {
    console.error("❌ Error deleting store:", error);
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
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .select("-password")
      .populate({
        path: "assignedMasterMaterials",
        select: "name", // Only include the 'name' field of RawMaterialMaster
      })
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, stores, "All stores fetched successfully"));
  } catch (error) {
    console.error("❌ Error fetching stores:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id).select("-password"); // Exclude password

    if (!store) {
      throw new ApiError(404, "Store not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, store, "Store fetched successfully"));
  } catch (error) {
    console.error("❌ Error fetching store:", error);
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
export const editStore = async (req, res) => {
  try {
    const storeId = req.params.id;
    const { storeName, userName, password, phone, email } = req.body;

    const updateData = {};

    if (storeName) updateData.storeName = storeName;
    if (userName) updateData.userName = userName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (req.files?.image) {
      const imageLocalPath = req.files.image[0].path;
      const uploadedImage = await uploadOnCloudinary(imageLocalPath);
      if (!uploadedImage) {
        throw new ApiError(400, "Failed to upload store image");
      }
      updateData.storeImage = uploadedImage.url;
    }

    const updatedStore = await Store.findByIdAndUpdate(storeId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedStore) {
      throw new ApiError(404, "Store not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedStore, "Store updated successfully"));
  } catch (error) {
    console.error("❌ Error updating store:", error);

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

export const assignMasterMaterials = async (req, res) => {
  try {
    const { storeId, masterMaterialIds } = req.body;

    if (!storeId) throw new ApiError(400, "Store ID is required");
    if (!Array.isArray(masterMaterialIds) || masterMaterialIds.length === 0) {
      throw new ApiError(400, "masterMaterialIds must be a non-empty array");
    }

    const store = await Store.findById(storeId);
    if (!store) throw new ApiError(404, "Store not found");

    // Merge and remove duplicates using Set
    const existingIds = store.assignedMasterMaterials.map((id) =>
      id.toString()
    );
    const newIds = masterMaterialIds.map((id) => id.toString());

    const combinedIds = [...new Set([...existingIds, ...newIds])];
    store.assignedMasterMaterials = combinedIds;

    await store.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, store, "Master materials assigned successfully")
      );
  } catch (error) {
    console.error("❌ Error assigning master materials:", error);

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
