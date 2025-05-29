import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Supplier from "./Supplier.model.js";

export const createSupplier = asyncHandler(async (req, res, next) => {
  const { supplierName, phone, email, country, city, address, description } =
    req.body;

  // Check if the supplier already exists by phone or email
  const existingSupplier = await Supplier.findOne({
    $or: [{ email }, { phone }],
  });

  if (existingSupplier) {
    return next(new ApiError(400, "Supplier already exists!"));
  }

  // Create a new supplier
  const newSupplier = new Supplier({
    supplierName,
    phone,
    email,
    country,
    city,
    address,
    description,
  });

  await newSupplier.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newSupplier, "Supplier created successfully"));
});
export const getAllSuppliers = asyncHandler(async (req, res, next) => {
  const suppliers = await Supplier.find().sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, suppliers, "Suppliers retrieved successfully"));
});

export const deleteSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const deletedSupplier = await Supplier.findByIdAndDelete(id);

  if (!deletedSupplier) {
    return next(new ApiError(404, "Supplier not found"));
  }

  return res.status(200).json(
    new ApiResponse(200, deletedSupplier, "Supplier deleted successfully")
  );
});


export const updateSupplier = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { supplierName, phone, email, country, city, address, description } = req.body;

  const existingSupplier = await Supplier.findById(id);
  if (!existingSupplier) {
    return next(new ApiError(404, "Supplier not found"));
  }

  existingSupplier.supplierName = supplierName || existingSupplier.supplierName;
  existingSupplier.phone = phone || existingSupplier.phone;
  existingSupplier.email = email || existingSupplier.email;
  existingSupplier.country = country || existingSupplier.country;
  existingSupplier.city = city || existingSupplier.city;
  existingSupplier.address = address || existingSupplier.address;
  existingSupplier.description = description || existingSupplier.description;

  await existingSupplier.save();

  return res.status(200).json(
    new ApiResponse(200, existingSupplier, "Supplier updated successfully")
  );
});
