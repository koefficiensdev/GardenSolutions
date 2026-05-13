const REQUEST_IMAGES_KEY = "artgarden_request_images_v1";
const DRAFT_KEY = "artgarden_quote_draft_v1";

function safeParse(raw, fallback) {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readJson(key, fallback) {
  return safeParse(localStorage.getItem(key), fallback);
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function fileToDataUrl(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}

export function getRequestImages(requestId) {
  const map = readJson(REQUEST_IMAGES_KEY, {});
  return Array.isArray(map[requestId]) ? map[requestId] : [];
}

export function saveRequestImages(requestId, images) {
  const map = readJson(REQUEST_IMAGES_KEY, {});
  map[requestId] = images;
  writeJson(REQUEST_IMAGES_KEY, map);
}

export function deleteRequestImages(requestId) {
  const map = readJson(REQUEST_IMAGES_KEY, {});
  if (!(requestId in map)) {
    return;
  }
  delete map[requestId];
  writeJson(REQUEST_IMAGES_KEY, map);
}

export function getDraft() {
  return readJson(DRAFT_KEY, null);
}

export function saveDraft(draft) {
  writeJson(DRAFT_KEY, draft);
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}
