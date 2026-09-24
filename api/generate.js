const {
  get,
  post,
  imageFromResponse,
  chooseImageModel
} = require("./_openrouter");

function json(res, status, payload) {
  res.status(status).json(payload);
}

function buildPrompt({ prompt, style, palette, material }) {
  return [
    "Create one premium animated-app 3D icon.",
    `Subject: ${prompt.trim()}.`,
    `Visual style: ${style}.`,
    `Color direction: ${palette}.`,
    `Material and lighting: ${material}.`,
    "Single object only, centered, fully visible, generous margin, front three-quarter view.",
    "Clean studio lighting, soft contact shadow, polished professional product render.",
    "Transparent background with true alpha if supported. No room, no floor, no scenery.",
    "No text, no letters, no logo, no watermark, no border, no extra objects.",
    "Designed to become a seamless short looping icon animation."
  ].join(" ");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
    const prompt = String(body.prompt || "").trim();
    if (!prompt) return json(res, 400, { error: "Describe the icon first." });
    if (prompt.length > 700) {
      return json(res, 400, { error: "Keep the description under 700 characters." });
    }

    let model = process.env.OPENROUTER_IMAGE_MODEL;
    if (!model) {
      const catalogue = await get("/images/models");
      model = chooseImageModel(catalogue);
    }

    const data = await post("/images", {
      model,
      prompt: buildPrompt({
        prompt,
        style: body.style || "soft, minimal, playful 3D",
        palette: body.palette || "warm ivory with one vivid accent",
        material: body.material || "matte ceramic with subtle glossy highlights"
      })
    });

    return json(res, 200, {
      image: imageFromResponse(data),
      model
    });
  } catch (error) {
    console.error("icon generation failed:", error.message);
    return json(res, 500, { error: error.message || "Generation failed." });
  }
};
