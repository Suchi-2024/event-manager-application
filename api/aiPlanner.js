import { GoogleGenerativeAI } from "@langchain/google-genai";

export default async function handler(req, res) {
  try {
    const { tasks } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ plan: "API KEY missing." });
    }

    const model = new GoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are an AI day planning assistant. Create a realistic plan for the user's day.

Here are the tasks:
${tasks
  .map(
    (t) =>
      `• Task: ${t.text}
         Priority: ${t.priority}
         Due: ${t.due}
         Status: ${t.status}`
  )
  .join("\n")}
`;

    const response = await model.generateContent(prompt);
    const output = response?.response?.text() || "No output.";

    res.status(200).json({ plan: output });
  } catch (e) {
    console.error("AI ERROR:", e);
    res.status(500).json({ plan: "AI could not generate a plan." });
  }
}
