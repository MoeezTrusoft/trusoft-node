import multer from "multer";
import path from "path";
import fs from "fs-extra";

const uploadPath =
  process.env.UPLOAD_PATH || path.join(process.cwd(), "src/media/assets");

fs.ensureDirSync(uploadPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

export const uploadMulterFiles = upload.fields([{ name: "files", maxCount: 10 }]);
