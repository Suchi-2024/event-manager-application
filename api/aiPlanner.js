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
    You are an AI day planning assistant. 
    Generate a clear, simple, structured plan for the user's day.
    
    ### Requirements:
    - DO NOT use markdown headers like "## Afternoon".
    - Use plain text only.
    - Keep it concise (3–6 sentences per section).
    - Break the plan into 3 parts: Morning, Afternoon, Evening.
    - Sort tasks by priority and due time.
    - Suggest approximate time blocks.
    - Use bullet points like: • Task — explanation.
    
    User tasks for today:
    ${tasks.map(t => 
      `• ${t.text} (priority: ${t.priority}, due: ${t.due}, status: ${t.status})`
    ).join("\n")}
    `;


    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.status(200).json({ plan: text });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI could not generate a plan" });
  }
}
