import { Router } from "express";
import {
  addBatchStock,
  deleteBatchStock,
  getBatchStocks,
  getRawMaterialHistory,
} from "./BatchStock.controler.js";
const router = Router();

router.route("/add").post(addBatchStock);
router.route("/all").get(getBatchStocks);
router.delete("/delete", deleteBatchStock);

router.get("/history", getRawMaterialHistory);

export default router;
