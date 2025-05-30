import { Router } from "express";
import {
  addbulkMaster,
  addRawMaterialMaster,
  deleteRawMaterialMaster,
  editRawMaterialMaster,
  getRawMaterialMasterById,
  listRawMaterialMasters,
} from "./RawMaterialMaster.controler.js";
const router = Router();
router.route("/add").post(addRawMaterialMaster);
router.route("/add/bulk").post(addbulkMaster);
router.route("/all").get(listRawMaterialMasters);
router.delete("/delete", deleteRawMaterialMaster);
router.patch("/:id", editRawMaterialMaster);
router.get("/single/:id", getRawMaterialMasterById);
export default router;
