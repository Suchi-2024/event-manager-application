export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { tasks } = req.body;

  if (!tasks || tasks.length === 0) {
    return res.status(400).json({ error: "No tasks provided" });
  }

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
You are an AI personal productivity planner. Analyze the tasks:

${JSON.stringify(tasks, null, 2)}

Each task has:
- text
- status
- due date
- priority
- reminder (if any)

Create a clear, actionable daily plan:
1. Sorted by urgency (deadline)
2. Consider priority levels (HIGH, MEDIUM, LOW)
3. Split into Morning / Afternoon / Evening schedule
4. Add small motivational notes
5. Keep plan short and practical.

Provide response in markdown.
                `,
                },
              ],
            },
          ],
        }),
      }
    );

    const result = await response.json();
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    return res.status(200).json({ plan: aiText || "Couldn't generate plan" });
  } catch (error) {
    console.error("AI Planner Error:", error);
    return res.status(500).json({ error: "Failed to generate plan" });
  }
}
