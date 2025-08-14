// --- Imports: Bring in the required tools ---
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Loads your secret keys
const { GoogleGenerativeAI } = require('@google/generative-ai');
const sgMail = require('@sendgrid/mail');

// --- Initializations: Set up the tools ---
const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// --- Middleware: Basic setup for the server ---
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json()); // Allows the server to understand JSON data

// --- API Endpoints ---

// Handles the book summary requests
app.post('/summarize', async (req, res) => {
    const { bookName } = req.body;

    if (!bookName) {
        return res.status(400).json({ error: 'Book name is required.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        const prompt = `
You are a professional literary summarizer. Create a well-structured, easy-to-read summary of the book titled "${bookName}" using the exact format below. 

Follow these rules:
- Use clear section headings in bold (Markdown format).
- Use separate paragraphs for each key point or takeaway to improve readability.
- Maintain a consistent, engaging tone: ${tonePreference || "neutral and informative"}.
- Summary length: ${summaryLength || "detailed"}.
- Spoilers: ${spoilerPreference || "avoid spoilers unless they are essential"}.

**Title & Author:** [Insert the book's title and author's name.]

**Genre:** [Specify the genre, e.g., Fiction, Mystery, Self-Help.]

**Main Summary:**  
[Write a cohesive summary of the book's main plot, events, and important characters. For non-fiction, summarize the key ideas and arguments. Use multiple short paragraphs for flow.]

**Core Themes:**  
[List and explain the central themes of the book. Each theme should be its own paragraph, explaining its significance.]

**Key Lessons & Takeaways:**  
[Write each lesson as a short paragraph rather than bullet points. Focus on practical insights, moral messages, or actionable advice derived from the book.]

**Notable Quotes (Optional):**  
[Include 1–3 memorable quotes if available, each on a new line.]
`;


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summaryText = response.text();

        res.json({ summary: summaryText });

    } catch (error) {
        console.error('Error with Gemini API:', error);
        res.status(500).json({ error: 'Failed to generate summary.' });
    }
});

// Handles the contact form feedback
app.post('/send-feedback', async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const emailData = {
        to: process.env.MY_PERSONAL_EMAIL,
        from: process.env.VERIFIED_SENDER_EMAIL,
        subject: `New Feedback from Autobrief Contact Form`,
        html: `<p><strong>From:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message}</p>`,
    };

    try {
        await sgMail.send(emailData);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send feedback.' });
    }
});

//... all your other code ...

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;

