import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";

import {
  createAppointment,
  getAppointments,
  getAppointmentsByDoctor,
  getAppointmentsByPatient,
  cancelAppointment,
  updateAppointment,

  // ⭐ NEW FEATURES
  nextPatient,
  getDashboard,
  completeJuniorReview,
  completeAppointment,
  getPatientCount

} from "../controllers/appointmentController.js";

const appointmentRouter = express.Router();

// ================= PUBLIC =================
appointmentRouter.get("/", getAppointments);
appointmentRouter.get("/patients/count", getPatientCount);

// ================= AUTH =================
appointmentRouter.post(
  "/",
  createAppointment
);

appointmentRouter.get(
  "/me",
  clerkMiddleware(),
  requireAuth(),
  getAppointmentsByPatient
);

// ================= DOCTOR =================
appointmentRouter.get("/doctor/:doctorId", getAppointmentsByDoctor);

// ================= QUEUE SYSTEM =================
appointmentRouter.post("/next/:doctorId", nextPatient);

// ================= JUNIOR FLOW  =================
appointmentRouter.post("/junior/:id", completeJuniorReview);

// ================= COMPLETE  =================
appointmentRouter.post("/complete/:id", completeAppointment);

// ================= DASHBOARD  =================
appointmentRouter.get("/dashboard/:doctorId", getDashboard);

// ================= CANCEL =================
appointmentRouter.post("/:id/cancel", cancelAppointment);

// ================= UPDATE =================
appointmentRouter.put("/:id", updateAppointment);

export default appointmentRouter;
