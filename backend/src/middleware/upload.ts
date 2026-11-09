import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config";

if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
];

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, WEBP, SVG`));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
  },
  fileFilter,
});
