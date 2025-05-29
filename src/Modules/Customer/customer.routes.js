import { Router } from "express";

import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
} from "./customer.controler.js";

const router = Router();
router.route("/add").post(createCustomer);
router.route("/all").get(getAllCustomers);
router.delete("/delete", deleteCustomer);
router.get("/", getCustomerById);
router.patch("/update/:id", updateCustomer);

export default router;
