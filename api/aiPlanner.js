export default async function handler(req, res) {
  try {
    const { tasks } = req.body;

    const formatted = tasks
      .map(
        (t) =>
          `• ${t.text} (priority: ${t.priority || "medium"}, due: ${
            t.due
          }, status: ${t.status})`
      )
      .join("\n");

    const prompt = `
You are an intelligent productivity planner.
Given today's tasks:

${formatted}

Create a structured day plan:
- Which task should be done first, second, etc
- Estimate time blocks
- Identify urgent vs important tasks
- Suggest breaks
- Provide a high-motivation message

Return in clean bullet points.
    `;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const result = await response.json();

    const aiText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Unable to generate a plan.";

    return res.json({ plan: aiText });
  } catch (e) {
    return res.json({ plan: "AI generation failed." });
  }
}
