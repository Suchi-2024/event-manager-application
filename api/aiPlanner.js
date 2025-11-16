import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const { tasks } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing Gemini API Key" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
      You are an AI Day Planner.
      Create a well-structured, time-efficient daily plan using the user's tasks.

      Format it clearly with headings.
      Tasks:
      ${tasks
        .map(
          (t) =>
            `• ${t.text} (priority: ${t.priority}, due: ${t.due}, status: ${t.status})`
        )
        .join("\n")}
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ plan: text });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI could not generate a plan" });
  }
}
