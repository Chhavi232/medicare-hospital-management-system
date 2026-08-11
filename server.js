import express from "express";
import cors from "cors";
import "dotenv/config";
// import { clerkMiddleware } from "@clerk/express";
import { connectDB } from "./config/db.js";

import doctorRouter from "./routes/doctorRouter.js";
import serviceRouter from "./routes/serviceRouter.js";
import appointmentRouter from "./routes/appointmentRouter.js";
import serviceAppointmentRouter from "./routes/serviceAppointmentRouter.js";
import { getServiceAppointmentStats } from "./controllers/serviceAppointmentController.js";

const app = express();
const port = process.env.PORT || process.env.API_PORT || 4000;

app.get("/", (req, res) => {
  res.send("API WORKING 🚀");
});

app.get("/health-final", (req, res) => {
  res.json({ success: true, project: "MediCare final" });
});

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
];


app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ================= MIDDLEWARE =================
// app.use(clerkMiddleware());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// serve uploaded images
app.use("/uploads", express.static("uploads"));

// ================= DB =================
connectDB();

// ================= ROUTES =================
app.use("/api/doctors", doctorRouter);
app.use("/api/services", serviceRouter);
app.use("/api/appointments", appointmentRouter);
app.get("/api/service-appointments/stats/summary", getServiceAppointmentStats);
app.get("/api/service-appointment-stats", getServiceAppointmentStats);
app.use("/api/service-appointments", serviceAppointmentRouter);

// ================= HEALTH CHECK =================


// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("Global Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

// ================= SERVER =================
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
