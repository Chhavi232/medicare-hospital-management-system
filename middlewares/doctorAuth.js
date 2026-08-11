import jwt from "jsonwebtoken";
import Doctor from "../models/Doctor.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET not defined in environment");
}

export default async function doctorAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // ================= TOKEN CHECK =================
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    // ================= VERIFY =================
    const payload = jwt.verify(token, JWT_SECRET);

    // ================= ROLE CHECK =================
    if (payload.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Access denied: Not a doctor",
      });
    }

    // ================= FETCH DOCTOR =================
    const doctor = await Doctor.findById(payload.id).select("-password");

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // ================= ATTACH =================
    req.doctor = doctor.toObject();

    next();

  } catch (err) {
    console.error("DoctorAuth Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}