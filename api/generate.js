// api/generate.js
// Serverless-функция для Vercel: принимает промпт, дёргает Hugging Face
// Inference API с токеном из переменных окружения, отдаёт готовую картинку.

export default async function handler(req, res) {
  const prompt = req.query.prompt;

  if (!prompt) {
    res.status(400).json({ error: "Укажи параметр ?prompt=..." });
    return;
  }

  const HF_TOKEN = process.env.HF_TOKEN;

  if (!HF_TOKEN) {
    res.status(500).json({ error: "HF_TOKEN не настроен на сервере" });
    return;
  }

  // FLUX.1-schnell — быстрая, бесплатная (в рамках лимитов HF) модель генерации картинок.
  // ВАЖНО: Hugging Face полностью отключили старый api-inference.huggingface.co,
  // теперь все запросы идут через router.huggingface.co
  const MODEL_URL =
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

  try {
    const hfResponse = await fetch(MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    if (!hfResponse.ok) {
      const errText = await hfResponse.text();
      res.status(hfResponse.status).json({ error: errText });
      return;
    }

    const contentType = hfResponse.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await hfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
