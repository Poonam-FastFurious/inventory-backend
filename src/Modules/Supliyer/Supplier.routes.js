import { Router } from "express";
import {
  createSupplier,
  deleteSupplier,
  getAllSuppliers,
  updateSupplier,
} from "./Supplier.controler.js";

const router = Router();

router.route("/add").post(createSupplier);
router.route("/all").get(getAllSuppliers);
router.route("/update/:id").patch(updateSupplier);
router.route("/delete/:id").delete(deleteSupplier);

export default router;
