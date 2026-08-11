import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  cancelServiceAppointment,
  confirmServicePayment,
  createServiceAppointment,
  getServiceAppointments,
  getServiceAppointmentById,
  getServiceAppointmentsByPatient,
  getServiceAppointmentStats,
  updateServiceAppointment,
} from "../controllers/serviceAppointmentController.js";

const serviceAppointmentRouter = express.Router();

// ================= PUBLIC =================
serviceAppointmentRouter.get("/", getServiceAppointments);
serviceAppointmentRouter.get("/confirm", confirmServicePayment);
serviceAppointmentRouter.get("/stats/summary", getServiceAppointmentStats);

// ================= AUTH =================
serviceAppointmentRouter.post(
  "/",
  createServiceAppointment
);

serviceAppointmentRouter.get(
  "/me",
  clerkMiddleware(),
  requireAuth(),
  getServiceAppointmentsByPatient
);

// ================= BASIC =================
serviceAppointmentRouter.get("/:id", getServiceAppointmentById);

// ================= UPDATE =================
serviceAppointmentRouter.put(
  "/:id",
  updateServiceAppointment
);

// ================= CANCEL =================
serviceAppointmentRouter.post(
  "/:id/cancel",
  cancelServiceAppointment
);

export default serviceAppointmentRouter;
