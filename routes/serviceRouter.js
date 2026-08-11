import express from "express";
import upload from "../middlewares/multer.js";

import {
  createService,
  deleteService,
  getServiceById,
  getServices,
  updateService,
} from "../controllers/serviceController.js";

const serviceRouter = express.Router();

// ================= PUBLIC =================
serviceRouter.get("/", getServices);
serviceRouter.get("/:id", getServiceById);

// create
serviceRouter.post("/", upload.single("image"), createService);

// update
serviceRouter.put("/:id", upload.single("image"), updateService);

// delete
serviceRouter.delete("/:id", deleteService);

export default serviceRouter;
