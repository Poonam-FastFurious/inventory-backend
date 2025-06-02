import { Router } from "express";
import {
  addStore,
  assignMasterMaterials,
  deleteStore,
  editStore,
  getAllStores,
  getStoreById,
  toggleStoreStatus,
} from "./Store.controler.js";
import { upload } from "../../middlewares/FileUpload.middlwares.js";
const router = Router();
router.route("/add").post(
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addStore
);
router.route("/all").get(getAllStores);
router.route("/single/:id").get(getStoreById);
router.route("/edit/:id").patch(
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  editStore
);
router.route("/delete/:id").delete(deleteStore);
router.route("/toggle-status/:id").patch(toggleStoreStatus);
router.post("/assign-master-materials", assignMasterMaterials);
export default router;
