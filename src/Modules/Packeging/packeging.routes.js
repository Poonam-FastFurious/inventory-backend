import { Router } from "express";
import { createPackaging, getPackagings } from "./packeging.controler.js";
const router = Router();

router.route("/create").post(createPackaging);
router.route("/all").get(getPackagings);

export default router;
