import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import multer from "multer";
import { uploadMulterFiles } from "./middleware/multer.middleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

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

app.post("/publishing-form", async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      genre,
      manuscript,
      message,
    } = req.body;

    if (!full_name || !email || !phone || !genre || !manuscript || !message) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled" });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.BOOK_CRAFT_USER,
        pass: process.env.BOOK_CRAFT_PASS,
      },
    });

    // Email to your company
    const companyMailOptions = {
      from: process.env.BOOK_CRAFT_FROM,
      to: process.env.BOOK_CRAFT_FROM,
      subject: "New Publishing Form Submission",
      text: `New Publishing Form Submission:

- Full Name: ${full_name}
- Email: ${email}
- Phone: ${phone}
- Genre: ${genre}
- Manuscript: ${manuscript}
- Message: ${message}
`,
    };

    // Confirmation email to user
    const userMailOptions = {
      from: process.env.BOOK_CRAFT_FROM,
      to: email,
      subject: "Thank you for submitting your publishing form!",
      text: `Dear ${full_name},

Thank you for reaching out to Book Craft Publishers with your publishing interest.

We have received your submission and will review it shortly.

Your Submitted Details:
- Full Name: ${full_name}
- Email: ${email}
- Phone: ${phone}
- Genre: ${genre}
- Manuscript: ${manuscript}
- Message: ${message}

Best regards,  
Book Craft Publishers Team`,
    };

    // Send both emails
    await transporter.sendMail(companyMailOptions);
    // await transporter.sendMail(userMailOptions);

    return res.status(201).json({
      message: "Form submitted successfully and emails sent!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Submission failed: " + error.message });
  }
});



app.post("/formsubmission", async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      service,
      other,
      message,
      check,
    } = req.body;

    if (!first_name || !last_name || !email || !phone || !service || !message) {
      return res
        .status(400)
        .json({ error: "All required fields must be filled" });
    }

    // const formSubmission = await prisma.formSubmission.create({
    //   data: {
    //     first_name,
    //     last_name,
    //     email,
    //     phone,
    //     service,
    //     other: other || "",
    //     message,
    //     check: check === "true",
    //   },
    // });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.BOOK_CRAFT_USER,
        pass: process.env.BOOK_CRAFT_PASS,
      },
    });

    const mailOptions = {
      from: process.env.BOOK_CRAFT_FROM,
      to: process.env.BOOK_CRAFT_FROM,
      subject: "Form Submission Confirmation",
      text: `Form Submission Details:
    
      - First Name: ${first_name}
      - Last Name: ${last_name}
      - Email: ${email}
      - Phone: ${phone}
      - Service: ${service}
      - Other: ${other || "N/A"}
      - Message: ${message}
      - Check: ${check === "true" ? "Yes" : "No"}
    
      Best regards,
      Book Craft Publishers
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Form submitted successfully and confirmation email sent!",
      data: mailOptions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Submission failed: " + error.message });
  }
});


app.get("/", (req, res) => res.send("Career API Is working on PORT: " + PORT));

app.listen(PORT, () => {
  console.log("Server is running on " + PORT);
});

app.post("/generic-form", async (req, res) => {
  try {
    const formData = req.body;

    if (!formData || Object.keys(formData).length === 0) {
      return res.status(400).json({ error: "Form data is empty" });
    }

    // Format all fields into a readable string
    const formText = Object.entries(formData)
      .map(([key, value]) => `- ${key.replace(/_/g, " ")}: ${value}`)
      .join("\n");

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.BOOK_CRAFT_USER,
        pass: process.env.BOOK_CRAFT_PASS,
      },
    });

    // Email to your company
    const companyMailOptions = {
      from: process.env.BOOK_CRAFT_FROM,
      to: process.env.BOOK_CRAFT_FROM,
      subject: "New Form Submission",
      text: `New Form Submission:\n\n${formText}`,
    };

    await transporter.sendMail(companyMailOptions);

    // Optional: Send confirmation to user if email field exists
    if (formData.email) {
      const userMailOptions = {
        from: process.env.BOOK_CRAFT_FROM,
        to: formData.email,
        subject: "Thank you for your submission!",
        text: `Dear ${formData.full_name || "Valued User"},

Thank you for contacting us. We have received your message:

${formText}

We’ll get back to you soon.

Best regards,  
Book Craft Publishers Team`,
      };

      // await transporter.sendMail(userMailOptions);
    }

    return res.status(201).json({
      message: "Form submitted successfully and emails sent!",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Submission failed: " + error.message });
  }
});