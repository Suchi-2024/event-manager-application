export default async function handler(req, res) {
  try {
    const { tasks } = req.body;

    const geminiKey = process.env.GEMINI_API_KEY;

    const prompt = `
      You are an AI productivity assistant. 
      The user has tasks for today. Create a detailed day plan.

      Tasks:
      ${tasks
        .map(
          (t) =>
            `• ${t.text} (priority: ${t.priority}, due: ${t.due}, status: ${t.status})`
        )
        .join("\n")}
    `;

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
        geminiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    const data = await r.json();
    const plan = data.candidates?.[0]?.content?.parts?.[0]?.text || "No output.";

    res.status(200).json({ plan });
  } catch (err) {
    res.status(500).json({ error: "AI planning failed" });
  }
}
