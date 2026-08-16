// This runs on the server, never in the browser — so your API key stays private.
// Vercel automatically turns this file into a live endpoint at /api/generate

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing its API key. Add GEMINI_API_KEY in Vercel project settings." });
  }

  const { images, prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Missing prompt." });
  }
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: "Add at least one photo." });
  }
  if (images.length > 7) {
    return res.status(400).json({ error: "Max 7 photos." });
  }

  try {
    const parts = [
      { text: prompt },
      ...images.map((dataUrl) => {
        const match = /^data:(image\/[a-zA-Z]+);base64,(.+)$/.exec(dataUrl);
        if (!match) throw new Error("One of the images was in an unexpected format.");
        return {
          inline_data: {
            mime_type: match[1],
            data: match[2],
          },
        };
      }),
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return res.status(502).json({ error: "Image generation failed. Try a simpler prompt or fewer photos." });
    }

    const data = await geminiRes.json();

    const imagePart = data?.candidates?.[0]?.content?.parts?.find((p) => p.inline_data || p.inlineData);
    const inline = imagePart?.inline_data || imagePart?.inlineData;

    if (!inline?.data) {
      return res.status(502).json({ error: "The model didn't return an image. Try rewording your prompt." });
    }

    const mimeType = inline.mime_type || inline.mimeType || "image/png";
    const resultDataUrl = `data:${mimeType};base64,${inline.data}`;

    return res.status(200).json({ image: resultDataUrl });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: "Something went wrong generating your poster." });
  }
}
