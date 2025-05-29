import { Router } from "express";
import {
  createProductionBatch,
  getAllProductionBatch,
  getProductionBatchDetails,
  updateProductionBatchStatus,
} from "./Production.controler.js";
import { getAllReadyStock } from "../ReadyStock/readyStock.controler.js";
const router = Router();

router.route("/create").post(createProductionBatch);
router.route("/all").get(getAllProductionBatch);
router.route("/update").patch(updateProductionBatchStatus);
router.get("/details/:batchId", getProductionBatchDetails);
router.get("/readystock", getAllReadyStock); 

export default router;
