import { Router } from "express";
import { createSale, getAllSales, getSaleById } from "./sales.controler.js";

const router = Router();
router.route("/create").post(createSale);
router.route("/all").get(getAllSales);
router.route("/:id").get(getSaleById);

export default router;
