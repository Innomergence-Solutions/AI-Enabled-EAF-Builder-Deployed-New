import express from 'express';
import cors from 'cors';
import { word_editor } from './word_creator.js';

const app = express();

app.use(express.json());
app.use(cors()); // Enable CORS

app.post('/create_word_doc', async (req, res) => {
    try {
        console.log(req.body);
        const { response, incident, date, budget } = req.body; // Extract request data

        // Call word_editor with provided data
        const buffer = await word_editor(response, incident, date, budget);

        // Send the buffer as a downloadable file
        res.setHeader('Content-Disposition', 'attachment; filename=EAF.docx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);
    } catch (error) {
        console.error("Error processing the request", error);
        res.status(500).send("Error processing the request");
    }
});

export default app;
