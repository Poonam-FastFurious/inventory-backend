import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
// Routes import
import adminrouter from "../src/Modules/Admin/Admin.routes.js";
import userrouter from "../src/Modules/User/user.routes.js";
import customerrouter from "../src/Modules/Customer/customer.routes.js";
import category from "../src/Modules/Category/Category.routes.js";
import Product from "../src/Modules/Product/Product.routes.js";
import website from "../src/Modules/WebsiteSetting/website.routes.js";
import banner from "../src/Modules/Banner/Banner.Routes.js";
import rawmaterial from "../src/Modules/BatchStock/BatchStock.routes.js";
import rawmaterialmaster from "../src/Modules/MasterList/RawMaterialMaster.routes.js";
import blend from "../src/Modules/BlendFormula/BlendFormula.routes.js";
import production from "../src/Modules/Prodction/Production.routes.js";
import readystock from "../src/Modules/ReadyStock/readyStock.routes.js";
import packing from "../src/Modules/Packeging/packeging.routes.js";
import sales from "../src/Modules/Sales/sales.routes.js";
import supplier from "../src/Modules/Supliyer/Supplier.routes.js";

//routes declearetion
app.use("/api/v1/admin", adminrouter);
app.use("/api/v1/raw", rawmaterial);
app.use("/api/v1/rawmaterialmaster", rawmaterialmaster);
app.use("/api/v1/formula", blend);
app.use("/api/v1/production", production);
app.use("/api/v1/productionready", readystock);
app.use("/api/v1/packging", packing);
app.use("/api/v1/sales", sales);
app.use("/api/v1/user", userrouter);
app.use("/api/v1/customer", customerrouter);
app.use("/api/v1/supplier", supplier);
app.use("/api/v1/category", category);
app.use("/api/v1/Product", Product);
app.use("/api/v1/website", website);
app.use("/api/v1/banner", banner);

export { app };
