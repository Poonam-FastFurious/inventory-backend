import { Router } from "express";
import {
  addRawMaterialMaster,
  deleteRawMaterialMaster,
  listRawMaterialMasters,
} from "./RawMaterialMaster.controler.js";
import { upload } from "../../middlewares/FileUpload.middlwares.js";
const router = Router();
router.route("/add").post(
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addRawMaterialMaster
);
router.route("/all").get(listRawMaterialMasters);
router.delete("/delete", deleteRawMaterialMaster);

export default router;
