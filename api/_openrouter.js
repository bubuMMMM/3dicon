const API = "https://openrouter.ai/api/v1";

function getKey() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not configured on Vercel.");
  }
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${getKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.APP_URL || "https://3dicon.vercel.app",
    "X-Title": "3D Icon Studio"
  };
}

async function readResponse(response) {
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { raw };
  }
  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      "OpenRouter returned an unexpected error.";
    throw new Error(message);
  }
  return data;
}

async function get(path) {
  return readResponse(await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${getKey()}` }
  }));
}

async function post(path, body) {
  return readResponse(await fetch(`${API}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body)
  }));
}

function imageFromResponse(data) {
  for (const item of data?.data || []) {
    if (item?.b64_json) {
      return `data:image/png;base64,${item.b64_json}`;
    }
    const url = item?.image_url?.url || item?.url;
    if (url) return url;
  }
  throw new Error("OpenRouter returned no image. Try another prompt or model.");
}

function chooseImageModel(data) {
  const configured = process.env.OPENROUTER_IMAGE_MODEL;
  if (configured) return configured;

  const entries = data?.data || data?.models || [];
  const ids = entries
    .map((item) => item?.id || item?.slug || "")
    .filter(Boolean);

  const gpt = ids.filter((id) => /^openai\/gpt-image-/.test(id));
  if (gpt.length) return gpt.sort().at(-1);

  const google = ids.filter((id) => /^google\//.test(id) && /image/i.test(id));
  if (google.length) return google.sort().at(-1);

  throw new Error(
    "No compatible image model is available. Set OPENROUTER_IMAGE_MODEL in Vercel."
  );
}

module.exports = { get, post, imageFromResponse, chooseImageModel };
