import request from 'supertest';
import app from '../api-server/controller.js'; // Import the app
import doc from '../api-server/pdf_creator.js';

describe('API Endpoints', () => {
    it('GET from / to check if {api_connect: true}', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200); // Check HTTP status
    });

    it('GET /nonexistent should return 404', async () => {
        const response = await request(app).get('/nonexistent');
        expect(response.status).toBe(404); // Check for 404 status
    });

    // pdf api information
    it('Get from /create_pdf to check if pdf = doc', async () => {
        const response = await request(app).get('/create_pdf');

        const expectedBuffer = Buffer.from(doc.output('arraybuffer'));

        expect(Buffer.compare(response.body, expectedBuffer)).toBe(0);
    });
});
