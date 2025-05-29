import { Router } from "express";
import {
  addFormula,
  deleteBlendFormula,
  getBlendFormulaById,
  listFormulas,
} from "./BlendFormula.controler.js";
import { upload } from "../../middlewares/FileUpload.middlwares.js";

const router = Router();
router.route("/add").post(
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  addFormula
);
router.get("/blend-formulas", listFormulas);
router.get("/blend-formula/:id", getBlendFormulaById);
router.delete("/delete", deleteBlendFormula);
export default router;
