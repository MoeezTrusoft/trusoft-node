import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import { uploadMulterFiles } from "./middleware/multer.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

const upload = multer({ storage: multer.memoryStorage() }).fields([
  { name: "portfolioFile", maxCount: 1 },
  { name: "coverLetterFile", maxCount: 1 },
]);

app.post("/cover-letter", upload, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      linkedIn,
      position,
      expectedSalary,
      availability,
      academics,
      certifications,
      skills,
      employmentHistory,
    } = req.body;

    const employmentHistoryArray =
      typeof employmentHistory === "string"
        ? JSON.parse(employmentHistory)
        : Array.isArray(employmentHistory)
        ? employmentHistory
        : [];

    const formattedEmploymentHistory = employmentHistoryArray
      .map(
        (job, index) => `
      Job ${index + 1}:
      - Title: ${job.title || "N/A"}
      - Employer: ${job.employer || "N/A"}
      - Duration: ${job.duration || "N/A"}`
      )
      .join("\n");

    const attachments = [];
    if (req.files?.portfolioFile) {
      attachments.push({
        filename: req.files.portfolioFile[0].originalname,
        content: req.files.portfolioFile[0].buffer,
      });
    }
    if (req.files?.coverLetterFile) {
      attachments.push({
        filename: req.files.coverLetterFile[0].originalname,
        content: req.files.coverLetterFile[0].buffer,
      });
    }

    const emailMessage = `
      New Cover Letter Submission:

      - Full Name: ${fullName}
      - Email: ${email}
      - Phone: ${phone}
      - LinkedIn: ${linkedIn}
      - Position: ${position}
      - Expected Salary: ${expectedSalary}
      - Availability: ${availability}
      - Academics: ${academics}
      - Certifications: ${certifications}
      - Skills: ${skills}
      - Employment History:
      ${formattedEmploymentHistory || "No employment history provided."}
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.SMTP_TO,
      subject: "New Cover Letter Submission",
      text: emailMessage,
      attachments,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      success: true,
      message: "Cover letter submitted and email sent successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Cover letter submission failed: " + error.message,
    });
  }
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
  console.log("Server is running on " + PORT);
});
