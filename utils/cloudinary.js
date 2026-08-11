import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// ================= CONFIG =================
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error("Cloudinary environment variables missing");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ================= UPLOAD =================
export async function uploadToCloudinary(filePath, folder = "uploads") {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });

    // delete local file safely
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
    };

  } catch (err) {
    console.error("Cloudinary upload error:", err.message);
    throw err;
  }
}

// ================= DELETE =================
export async function deleteFromCloudinary(publicId) {
  try {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);

  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
    throw err;
  }
}

export default cloudinary;