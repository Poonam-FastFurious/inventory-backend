import express from "express";
import { getReadyStockByFormula } from "./readyStock.controler.js";

const router = express.Router();

router.get("/:formulaId", getReadyStockByFormula);

export default router;
