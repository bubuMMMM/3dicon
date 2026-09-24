const { post } = require("./_openrouter");

function json(res, status, payload) {
  res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
    const image = String(body.image || "");
    const prompt = String(body.prompt || "A gentle, satisfying loop with subtle object motion.");
    if (!image.startsWith("data:image/")) {
      return json(res, 400, { error: "The generated image is missing or invalid." });
    }
    if (image.length > 6_000_000) {
      return json(res, 413, { error: "The image is too large to animate. Generate it again." });
    }

    const model = body.model || process.env.OPENROUTER_VIDEO_MODEL || "bytedance/seedance-2.0";
    const frame = (frameType) => ({
      type: "image_url",
      image_url: { url: image },
      frame_type: frameType
    });

    const job = await post("/videos", {
      model,
      prompt: [
        prompt,
        "Locked camera. Flat empty background. The same object returns naturally to its starting pose.",
        "Keep the complete object inside the frame. No text, hands, props, captions or watermark."
      ].join(" "),
      frame_images: [frame("first_frame"), frame("last_frame")],
      duration: Number(body.duration) || 5
    });

    const pollingUrl = job.polling_url || (job.id ? `https://openrouter.ai/api/v1/videos/${job.id}` : null);
    if (job.unsigned_urls?.[0] || job.video_url) {
      return json(res, 200, {
        status: "completed",
        videoUrl: job.unsigned_urls?.[0] || job.video_url,
        model
      });
    }
    if (!pollingUrl) throw new Error("OpenRouter did not return a video job URL.");

    return json(res, 202, { status: job.status || "queued", pollingUrl, model });
  } catch (error) {
    console.error("icon animation failed:", error.message);
    return json(res, 500, { error: error.message || "Animation failed." });
  }
};
