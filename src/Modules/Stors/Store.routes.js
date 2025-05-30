import { Router } from "express";
import {
  addStore,
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
router.route("/edit/:id").patch(editStore);
router.route("/delete/:id").delete(deleteStore);
router.route("/toggle-status/:id").patch(toggleStoreStatus);
export default router;
