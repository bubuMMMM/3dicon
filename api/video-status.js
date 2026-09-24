const { get } = require("./_openrouter");

function json(res, status, payload) {
  res.status(status).json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed." });
  }

  const pollingUrl = String(req.query?.url || "");
  if (!pollingUrl.startsWith("https://openrouter.ai/api/v1/videos/")) {
    return json(res, 400, { error: "Invalid video job URL." });
  }

  try {
    const path = pollingUrl.replace("https://openrouter.ai/api/v1", "");
    const job = await get(path);
    const videoUrl = job.unsigned_urls?.[0] || job.video_url || job.output?.[0] || job.output;
    return json(res, 200, {
      status: job.status || "unknown",
      videoUrl: typeof videoUrl === "string" ? videoUrl : null,
      error: job.error?.message || job.error || null
    });
  } catch (error) {
    console.error("video status failed:", error.message);
    return json(res, 500, { error: error.message || "Could not read video status." });
  }
};
