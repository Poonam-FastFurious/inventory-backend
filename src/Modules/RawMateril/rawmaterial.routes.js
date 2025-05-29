import { Router } from "express";

import {
  addRawMaterial,
  deleteRawMaterial,
  getAllMasterMaterialsWithStockAndBatchCount,
  getAllRawMaterials,
  getRawMaterialByMasterId,
} from "./RawMaterial.controler.js";
const router = Router();
router.route("/add").post(addRawMaterial);
router.route("/all").get(getAllRawMaterials);
router.route("/stock").get(getAllMasterMaterialsWithStockAndBatchCount);
router.route("/raw-material").get(getRawMaterialByMasterId);
router.delete("/delete", deleteRawMaterial);

export default router;
