export default async function handler(req, res) {
  try {
    const { tasks } = req.body;

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return res.status(500).json({ error: "Gemini API key missing." });
    }

    const prompt = `
      You are an AI productivity assistant. 
      Create a detailed, time-ordered plan for the user's day.
      
      Tasks:
      ${tasks
        .map(
          (t) =>
            `• ${t.text} (priority: ${t.priority}, due: ${t.due}, status: ${t.status})`
        )
        .join("\n")}
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await response.json();
    console.log("GEMINI RAW:", JSON.stringify(data, null, 2));

    let plan = "AI could not generate a plan.";

    if (data?.candidates?.length > 0) {
      const parts = data.candidates[0].content.parts;
      plan = parts.map((p) => p.text).join("\n").trim();
    }

    res.status(200).json({ plan });
  } catch (err) {
    console.error("Planner error:", err);
    res.status(500).json({ error: "AI planning failed." });
  }
}
