import express from "express";
import upload from "../middlewares/multer.js";

import {
  createDoctor,
  deleteDoctor,
  doctorLogin,
  getDoctorById,
  getDoctors,
  toggleAvailability,
  updateDoctor,
} from "../controllers/doctorController.js";

import doctorAuth from "../middlewares/doctorAuth.js";

const doctorRouter = express.Router();

// ================= PUBLIC =================
doctorRouter.get("/", getDoctors);
doctorRouter.get("/:id", getDoctorById);
doctorRouter.post("/login", doctorLogin);

// ================= CREATE =================
doctorRouter.post("/", upload.single("image"), createDoctor);

// ================= PROTECTED =================
doctorRouter.put(
  "/:id",
  upload.single("image"),
  updateDoctor
);

doctorRouter.post(
  "/:id/toggle-availability",
  toggleAvailability
);

doctorRouter.delete("/:id", deleteDoctor);

export default doctorRouter;
