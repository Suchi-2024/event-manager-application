import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const { task, gratitude } = req.body;

    if (!task || !gratitude) {
      return res.status(400).json({ error: "Missing task or gratitude" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing Gemini API Key" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
You are a warm, friendly personal growth coach.
The user completed a task and wrote their gratitude/reflection.

Your job:
- Write 2 to 3 sentences.
- Use **plain text only** (not markdown).
- Keep it supportive, empathetic, and encouraging.
- Mention the task subtly.
- Reflect on the gratitude they expressed.
- Suggest one small next step.
- Include exactly **one uplifting emoji** at the end.
- DO NOT ask questions.
- DO NOT repeat their gratitude.

Task: ${task}
User Gratitude: ${gratitude}

Write the reflection now:
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ feedback: text });
  } catch (err) {
    console.error("Reflection AI Error:", err);
    res.status(500).json({ error: "AI could not generate reflection" });
  }
}
