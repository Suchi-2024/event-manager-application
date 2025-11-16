export default async function handler(req, res) {
  try {
    const { tasks } = req.body;

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({ plan: "Gemini API key missing!" });
    }

    const prompt = `
You are an AI day-planning assistant.
Given these tasks with deadlines and priorities, generate a concise plan:

${tasks
  .map(
    (t, i) =>
      `${i + 1}. Task: ${t.text}
   Priority: ${t.priority}
   Due: ${t.due}`
  )
  .join("\n\n")}

Output a step-by-step plan for today including:
- what to do first
- estimated time blocks
- urgency indicators
- short productivity tips
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        key,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate plan";

    res.status(200).json({ plan: text });
  } catch (err) {
    console.error("Planner error:", err);
    res.status(500).json({ plan: "AI Planner failed." });
  }
}
