// api/generate.js
// Serverless-функция для Vercel: принимает промпт, дёргает Hugging Face
// Inference Providers через официальный SDK @huggingface/inference —
// он сам выбирает провайдера (fal-ai/replicate/together) и разруливает
// очередь генерации внутри себя, отдаёт готовую картинку.

import { InferenceClient } from "@huggingface/inference";

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

  try {
    const client = new InferenceClient(HF_TOKEN);

    // provider: "fal-ai" — стабильный бесплатный (в рамках лимитов) провайдер
    // для FLUX.1-schnell на данный момент
    const imageBlob = await client.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
      provider: "fal-ai",
    });

    const arrayBuffer = await imageBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", imageBlob.type || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(buffer);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
