import Service from "../models/Service.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// ================= HELPERS =================
const parseJsonArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
      return typeof parsed === "string" ? [parsed] : [];
    } catch {
      return field.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

function normalizeSlotsToMap(slotStrings = []) {
  const map = {};
  slotStrings.forEach((raw) => {
    const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s*•\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!m) {
      map["unspecified"] = map["unspecified"] || [];
      map["unspecified"].push(raw);
      return;
    }

    const [, day, monShort, year, hour, minute, ampm] = m;
    const monthIdx = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
      .findIndex(x => x.toLowerCase() === monShort.toLowerCase());

    const mm = String(monthIdx + 1).padStart(2, "0");
    const dd = String(Number(day)).padStart(2, "0");

    const dateKey = `${year}-${mm}-${dd}`;
    const timeStr = `${String(Number(hour)).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm.toUpperCase()}`;

    map[dateKey] = map[dateKey] || [];
    map[dateKey].push(timeStr);
  });
  return map;
}

const sanitizePrice = (v) => Number(String(v ?? "0").replace(/[^\d.-]/g, "")) || 0;
const parseAvailability = (v) => {
  const s = String(v ?? "available").toLowerCase();
  return s === "available" || s === "true";
};

// ================= GET =================
export async function getServices(req, res) {
  try {
    const list = await Service.find().sort({ createdAt: -1 }).lean();
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error("GetServices Error:", err);
    res.status(500).json({ success: false });
  }
}

// ================= CREATE =================
export async function createService(req, res) {
  try {
    const b = req.body || {};

    if (!b.name) {
      return res.status(400).json({
        success: false,
        message: "Service name required",
      });
    }

    const instructions = parseJsonArrayField(b.instructions);
    const slots = normalizeSlotsToMap(parseJsonArrayField(b.slots));

    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      const up = await uploadToCloudinary(req.file.path, "services");
      imageUrl = up?.secure_url || null;
      imagePublicId = up?.public_id || null;
    }

    const service = await Service.create({
      name: b.name,
      specialization: b.specialization || "", // ⭐ ADDED
      about: b.about || "",
      shortDescription: b.shortDescription || "",
      price: sanitizePrice(b.price),
      available: parseAvailability(b.availability),
      instructions,
      slots,
      imageUrl,
      imagePublicId,
    });

    res.status(201).json({ success: true, data: service });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}

// ================= GET BY ID =================
export async function getServiceById(req, res) {
  try {
    const service = await Service.findById(req.params.id).lean();
    if (!service) return res.status(404).json({ success: false });
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false });
  }
}

// ================= UPDATE =================
export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const b = req.body || {};

    const existing = await Service.findById(id);
    if (!existing) return res.status(404).json({ success: false });

    const updateData = {};

    if (b.name !== undefined) updateData.name = b.name;
    if (b.specialization !== undefined) updateData.specialization = b.specialization; // ⭐
    if (b.about !== undefined) updateData.about = b.about;
    if (b.shortDescription !== undefined) updateData.shortDescription = b.shortDescription;
    if (b.price !== undefined) updateData.price = sanitizePrice(b.price);
    if (b.availability !== undefined) updateData.available = parseAvailability(b.availability);
    if (b.instructions !== undefined) updateData.instructions = parseJsonArrayField(b.instructions);
    if (b.slots !== undefined) updateData.slots = normalizeSlotsToMap(parseJsonArrayField(b.slots));

    if (req.file) {
      const up = await uploadToCloudinary(req.file.path, "services");
      updateData.imageUrl = up?.secure_url;
      updateData.imagePublicId = up?.public_id;

      if (existing.imagePublicId) {
        await deleteFromCloudinary(existing.imagePublicId).catch(()=>{});
      }
    }

    const updated = await Service.findByIdAndUpdate(id, updateData, { new: true });

    res.json({ success: true, data: updated });

  } catch (err) {
    res.status(500).json({ success: false });
  }
}

// ================= DELETE =================
export async function deleteService(req, res) {
  try {
    const existing = await Service.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false });

    if (existing.imagePublicId) {
      await deleteFromCloudinary(existing.imagePublicId).catch(()=>{});
    }

    await existing.deleteOne();

    res.json({ success: true, message: "Deleted" });

  } catch (err) {
    res.status(500).json({ success: false });
  }
}