import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import { fileURLToPath } from 'url';

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const word_editor = async (description, incident, date, budget) => {
    try {
        const docxPath = path.join(__dirname, 'EAF.docx');
        const content = fs.readFileSync(docxPath, 'binary');

        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip);

        // Compile template
        doc.compile();

        // Set and resolve data
        await doc.resolveData({ description, incident, date, budget });

        // Render the document with the data
        doc.render();

        // Get the resulting buffer (this avoids saving it locally)
        const buf = doc.getZip().generate({ type: 'nodebuffer' });

        return buf; // Return buffer instead of file path
    } catch (error) {
        console.error("Error creating Word document:", error);
        throw error; // Rethrow to be caught in the route
    }
};
