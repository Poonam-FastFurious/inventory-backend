import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Packaging from "../Packeging/packeging.model.js";
import Sale from "./sales.model.js";

export const createSale = async (req, res) => {
  try {
    const {
      customer,
      date,
      supplier,
      items,
      orderTax = 0,
      discount = 0,
      shipping = 0,
      status,
    } = req.body;

    if (!customer || !date || !items || items.length === 0) {
      throw new ApiError(
        400,
        "Customer, date, and at least one item are required"
      );
    }

    let grandTotal = 0;
    const saleItems = [];

    for (const item of items) {
      const packaging = await Packaging.findById(item.batch); // Use batch as ID
      if (!packaging) {
        throw new ApiError(
          404,
          `Packaging batch not found for product ${item.product}`
        );
      }

      // Use price from Packaging
      const price = packaging.pricePerPack;

      // Validate stock if completed
      if (status?.toLowerCase() === "completed") {
        if (packaging.numberOfPackages < item.qty) {
          throw new ApiError(400, `Not enough stock in batch ${item.batch}`);
        }
      }

      const subtotal =
        price * item.qty - (item.discount || 0) + (item.tax || 0);
      grandTotal += subtotal;

      saleItems.push({
        product: item.product,
        batch: item.batch,
        qty: item.qty,
        price,
        discount: item.discount || 0,
        tax: item.tax || 0,
        subtotal,
      });
    }

    grandTotal += shipping + orderTax - discount;

    const sale = new Sale({
      customer,
      date,
      supplier,
      items: saleItems,
      orderTax,
      discount,
      shipping,
      status,
      grandTotal,
      createdBy: req.user?._id || "Admin",
    });

    await sale.save();

    // Reduce stock if sale is completed
    if (status?.toLowerCase() === "completed") {
      for (const item of saleItems) {
        await Packaging.findByIdAndUpdate(item.batch, {
          $inc: { numberOfPackages: -item.qty },
        });
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(201, sale, "Sale created successfully"));
  } catch (error) {
    console.error("❌ Error creating sale:", error);
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
export const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .populate("customer", "customerName")
      .populate("supplier", "supplierName"); // 👈 only populate name

    return res
      .status(200)
      .json(new ApiResponse(200, sales, "Sales retrieved successfully"));
  } catch (error) {
    console.error("❌ Error fetching sales:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid Sale ID");
    }

    const sale = await Sale.findById(id)
      .populate("customer") // Populate related customer data if needed
      .populate("items.product") // Populate product data in each item
      .populate("items.batch") // Populate batch details
      .populate("supplier"); // Populate supplier if necessary

    if (!sale) {
      throw new ApiError(404, "Sale not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, sale, "Sale retrieved successfully"));
  } catch (error) {
    console.error("❌ Error fetching sale by ID:", error);
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
