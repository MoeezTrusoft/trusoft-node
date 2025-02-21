import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { uploadMulterFiles } from "./middleware/multer.middleware.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT;

const app = express();

const allowedDomains = process.env.ALLOWED_DOMAINS?.split(",").map((domain) =>
  domain.trim()
);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedDomains.includes(origin)) {
      callback(null, true);
    } else {
      console.error("CORS Error: Not allowed by CORS", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));

app.use("/media/assets", express.static(path.join(__dirname, "media/assets")));

app.get("/", (req, res) => {
  res.status(200).json({ message: "Chatbot API is running..." });
});

app.post("/resume", uploadMulterFiles, async (req, res) => {
  try {
    console.log("Received files:", req.files);
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const uploadDirectory = path.join(__dirname, "..", "media");

    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const attachments = req.files.files.map((file) => ({
      filename: file.originalname,
      path: file.path,
    }));

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // Use true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      subject: "New Resume Submission",
      text: "A new resume has been submitted.",
      attachments: attachments,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res
      .status(201)
      .json({ success: true, message: "Files uploaded and email sent!" });
  } catch (error) {
    return res.status(500).json({ error: "Upload failed: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log("Server is running on " + 5000);
});
