export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { tasks } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY missing" });
    }

    const prompt = `
      You are an AI productivity assistant.
      Create an optimized day plan considering deadlines and priority.

      Tasks:
      ${tasks
        .map(
          (t) =>
            `• ${t.text} (priority: ${t.priority}, due: ${t.due}, status: ${t.status})`
        )
        .join("\n")}
    `;

    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await r.json();

    const plan =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI could not generate a plan.";

    res.status(200).json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI planning failed" });
  }
}
