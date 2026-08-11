import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import dotenv from "dotenv";
import Stripe from "stripe";
import { getAuth } from "@clerk/express";

dotenv.config();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY ? new Stripe(STRIPE_KEY) : null;
const ACTIVE_STATUSES = ["waiting", "junior_done", "in-progress"];

const canUseClerk = (req) => {
  try {
    return getAuth(req)?.userId || null;
  } catch {
    return null;
  }
};

// ================== CREATE APPOINTMENT ==================
export const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      mobile,
      date,
      time,
      isEmergency = false,
    } = req.body;

    const clerkUserId = canUseClerk(req);

    if (!doctorId || !patientName || !mobile || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // ================== QUEUE LOGIC ==================
    let queueNumber;

    if (isEmergency) {
      await Appointment.updateMany(
        {
          doctorId,
          status: { $in: ACTIVE_STATUSES },
        },
        { $inc: { queueNumber: 1 } }
      );
      queueNumber = 1;
    } else {
      const count = await Appointment.countDocuments({
        doctorId,
        status: { $in: ACTIVE_STATUSES },
      });
      queueNumber = count + 1;
    }

    // ================== CREATE ==================
    const appointment = await Appointment.create({
      doctorId,
      patientName,
      mobile,
      date,
      time,
      queueNumber,
      isEmergency,
      status: "waiting",
      createdBy: clerkUserId,
      owner: clerkUserId || mobile,
      age: req.body.age ?? null,
      gender: req.body.gender || "",
      doctorName: doctor.name,
      specialization: doctor.specialization,
      doctorImage: {
        url: doctor.imageUrl || "",
        publicId: doctor.imagePublicId || "",
      },
      fees: doctor.fee || 0,
    });

    return res.status(201).json({
      success: true,
      appointment,
      queueNumber,
      waitTime: queueNumber * 10,
    });
  } catch (err) {
    console.error("CreateAppointment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ================== GET APPOINTMENTS ==================
export const getAppointments = async (req, res) => {
  try {
    const { doctorId, status } = req.query;
    const filter = {};
    if (doctorId) filter.doctorId = doctorId;
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter)
      .sort({ isEmergency: -1, queueNumber: 1, createdAt: -1 })
      .populate("doctorId", "name specialization");

    return res.json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await Appointment.find({ doctorId })
      .sort({ isEmergency: -1, queueNumber: 1 })
      .populate("doctorId", "name specialization");

    res.json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.error("Error fetching doctor appointments:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getAppointmentsByPatient = async (req, res) => {
  try {
    const clerkUserId = canUseClerk(req);

    const appointments = await Appointment.find({
      createdBy: clerkUserId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.error("Error fetching patient appointments:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment: updated,
    });

  } catch (err) {
    console.error("Error updating appointment:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ================== NEXT PATIENT ==================
export const nextPatient = async (req, res) => {
  try {
    const { doctorId } = req.params;

    // complete current
    await Appointment.findOneAndUpdate(
      { doctorId, status: "in-progress" },
      { status: "completed" }
    );

    // get next
    const next = await Appointment.findOneAndUpdate(
      {
        doctorId,
        status: "junior_done",
      },
      { status: "in-progress" },
      {
        sort: { isEmergency: -1, queueNumber: 1 },
        new: true,
      }
    );

    if (!next) {
      return res.json({
        success: true,
        next: null,
        message: "No junior-reviewed patient is waiting for this senior doctor.",
      });
    }

    res.json({ success: true, next });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================== JUNIOR REVIEW ==================
export const completeJuniorReview = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, status: "waiting" },
      { status: "junior_done" },
      { new: true }
    );

    if (!appointment) {
      return res.status(400).json({
        success: false,
        message: "Only waiting appointments can be marked as junior done.",
      });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================== COMPLETE ==================
export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, status: { $in: ["junior_done", "in-progress"] } },
      { status: "completed" },
      { new: true }
    );

    if (!appointment) {
      return res.status(400).json({
        success: false,
        message: "Only junior-reviewed or in-progress appointments can be completed.",
      });
    }

    res.json({ success: true, appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================== CANCEL ==================
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: "canceled" },
      { new: true }
    );

    res.json({ success: true, appointment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================== DASHBOARD ==================
export const getDashboard = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const filter = doctorId === "all" ? {} : { doctorId };

    const current = await Appointment.findOne({
      ...filter,
      status: "in-progress",
    });

    const waiting = await Appointment.countDocuments({
      ...filter,
      status: { $in: ACTIVE_STATUSES },
    });

    const completed = await Appointment.countDocuments({
      ...filter,
      status: "completed",
    });

    const canceled = await Appointment.countDocuments({
      ...filter,
      status: "canceled",
    });

    const totalPatients = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      current,
      totalPatients,
      waiting,
      completed,
      canceled,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const getPatientCount = async (req, res) => {
  try {
    const count = await Appointment.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
