import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import Customer from "./customer.model.js";

// Create a new customer
export const createCustomer = asyncHandler(async (req, res, next) => {
  const {
    customerName,
    phone,
    email,
    gstNumber,
    street,
    city,
    state,
    postalCode,
    country,
    notes,
    isActive,
  } = req.body;

  // Check if the customer already exists by phone or email
  const existingCustomer = await Customer.findOne({
    $or: [{ phone }],
  });

  if (existingCustomer) {
    return next(new ApiError(400, "Customer already exists!"));
  }

  // Create a new customer
  const newCustomer = new Customer({
    customerName,
    phone,
    email,
    gstNumber,
    street,
    city,
    state,
    postalCode,
    country,
    notes,
    isActive,
  });

  await newCustomer.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newCustomer, "Customer created successfully"));
});

// Get all customers
export const getAllCustomers = asyncHandler(async (req, res, next) => {
  const customers = await Customer.find();

  if (!customers.length) {
    return next(new ApiError(404, "No customers found!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, customers, "Customers retrieved successfully"));
});

// Get a single customer by ID
export const getCustomerById = asyncHandler(async (req, res, next) => {
  const { id } = req.query;
  const customer = await Customer.findById(id);

  if (!customer) {
    return next(new ApiError(404, "Customer not found!"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer details"));
});

// Update a customer by ID
export const updateCustomer = asyncHandler(async (req, res, next) => {
  const {
    customerName,
    phone,
    email,
    gstNumber,
    street,
    city,
    state,
    postalCode,
    country,
    notes,
    isActive,
  } = req.body;

  // Find customer by ID
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    return next(new ApiError(404, "Customer not found!"));
  }

  // Optional: Prevent duplicate phone/email (if changed)
  if (email || phone) {
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }],
      _id: { $ne: req.params.id },
    });

    if (existingCustomer) {
      return next(
        new ApiError(
          400,
          "Another customer with this email or phone already exists!"
        )
      );
    }
  }

  // Only update fields that are provided (leave the rest unchanged)
  customer.customerName = customerName ?? customer.customerName;
  customer.phone = phone ?? customer.phone;
  customer.email = email ?? customer.email;
  customer.gstNumber = gstNumber ?? customer.gstNumber;
  customer.street = street ?? customer.street;
  customer.city = city ?? customer.city;
  customer.state = state ?? customer.state;
  customer.postalCode = postalCode ?? customer.postalCode;
  customer.country = country ?? customer.country;
  customer.notes = notes ?? customer.notes;
  customer.isActive = isActive ?? customer.isActive;

  await customer.save(); // Validates and saves

  return res
    .status(200)
    .json(new ApiResponse(200, customer, "Customer updated successfully"));
});

// Delete a customer by ID
export const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const customer = await Customer.findByIdAndDelete(id);

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Customer deleted successfully"));
});
