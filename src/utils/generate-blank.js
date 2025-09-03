    import fs from "fs";
    import path from "path";
    import { Document, Packer, Paragraph } from "docx";

    const __dirname = path.resolve();
    const templatesDir = path.join(__dirname, "templates");

    if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
    }

    const doc = new Document({
    sections: [
        {   
        properties: {},
        children: [new Paragraph("")], // empty doc
        },
    ],
    });

    const blankPath = path.join(templatesDir, "blank.docx");

    Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(blankPath, buffer);
    console.log("✅ Blank docx created at:", blankPath);
    });
