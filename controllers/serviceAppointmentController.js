import ServiceAppointment from "../models/serviceAppointment.js";
import Service from "../models/Service.js";
import Stripe from "stripe";
import { getAuth } from "@clerk/express";

const stripeKey = process.env.STRIPE_SECRET_KEY || null;

const stripe = stripeKey
  ? new Stripe(stripeKey, { apiVersion: "2022-11-15" })
  : null;

// ================= HELPERS =================
const safeNumber = (val) => {
  if (val === undefined || val === null || val === "") return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
};

function parseTimeString(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
  if (!m) return null;

  let hh = parseInt(m[1]);
  let mm = m[2] ? parseInt(m[2]) : 0;
  let ampm = (m[3] || "").toUpperCase();

  if (!ampm) ampm = hh >= 12 ? "PM" : "AM";
  if (hh > 12) hh -= 12;

  return { hour: hh, minute: mm, ampm };
}

function resolveClerkUserId(req) {
  try {
    const auth = getAuth(req);
    return auth?.userId || null;
  } catch {
    return null;
  }
}

// ================= CREATE =================
export const createServiceAppointment = async (req, res) => {
  try {
    const body = req.body;
    const clerkUserId = resolveClerkUserId(req);

    const {
      serviceId,
      patientName,
      mobile,
      date,
      time,
      paymentMethod = "Online",
      amount = 0,
    } = body;

    if (!serviceId || !patientName || !mobile || !date) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const parsed = parseTimeString(time);
    if (!parsed) return res.status(400).json({ success: false, message: "Invalid time" });

    const service = await Service.findById(serviceId);

    const base = {
      serviceId,
      serviceName: service?.name || "Service",
      serviceImage: {
        url: service?.imageUrl || "",
        publicId: service?.imagePublicId || "",
      },
      patientName,
      mobile,
      age: safeNumber(body.age),
      gender: body.gender || "",
      date,
      hour: parsed.hour,
      minute: parsed.minute,
      ampm: parsed.ampm,
      fees: Number(amount || service?.price || 0),
      createdBy: clerkUserId,
    };

    // FREE / CASH
    if (paymentMethod === "Cash" || amount === 0) {
      const created = await ServiceAppointment.create({
        ...base,
        status: "waiting",
        payment: { method: "Cash", status: "Pending", amount },
      });

      return res.json({ success: true, appointment: created });
    }

    // ONLINE PAYMENT
    if (!stripe) {
      return res.status(500).json({ success: false, message: "Stripe not configured" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: { name: service?.name || "Service" },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    const created = await ServiceAppointment.create({
      ...base,
      status: "waiting",
      payment: {
        method: "Online",
        status: "Pending",
        amount,
        sessionId: session.id,
      },
    });

    return res.json({
      success: true,
      appointment: created,
      checkoutUrl: session.url,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================= PAYMENT CONFIRM =================
export const confirmServicePayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ success: false });
    }

    const appt = await ServiceAppointment.findOneAndUpdate(
      { "payment.sessionId": session_id },
      {
        $set: {
          "payment.status": "Confirmed",
          status: "completed", // ⭐ FIXED
        },
      },
      { new: true }
    );

    res.json({ success: true, appointment: appt });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================= GET =================
export const getServiceAppointments = async (req, res) => {
  try {
    const list = await ServiceAppointment.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, appointments: list });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ================= UPDATE =================
export const updateServiceAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await ServiceAppointment.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ================= CANCEL =================
export const cancelServiceAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appt = await ServiceAppointment.findById(id);

    if (!appt) return res.status(404).json({ success: false });

    appt.status = "canceled"; // ⭐ FIXED
    await appt.save();

    res.json({ success: true, data: appt });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};
// ================= GET BY ID =================
export const getServiceAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await ServiceAppointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================= GET BY PATIENT =================
export const getServiceAppointmentsByPatient = async (req, res) => {
  try {
    const clerkUserId = getAuth(req)?.userId;

    const appointments = await ServiceAppointment.find({
      createdBy: clerkUserId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// ================= STATS =================
export const getServiceAppointmentStats = async (req, res) => {
  try {
    const stats = await Service.aggregate([
      {
        $lookup: {
          from: "serviceappointments",
          localField: "_id",
          foreignField: "serviceId",
          as: "appointments",
        },
      },
      {
        $addFields: {
          total: { $size: "$appointments" },
          completed: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "completed"] }, // ⭐ FIXED
              },
            },
          },
          canceled: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "a",
                cond: { $eq: ["$$a.status", "canceled"] }, // ⭐ FIXED
              },
            },
          },
        },
      },
    ]);

    res.json({ success: true, stats });

  } catch (err) {
    res.status(500).json({ success: false });
  }
};
