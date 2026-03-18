// ─── Helpers ────────────────────────────────────────────────────────

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function isWhiteOrTransparent(r, g, b, a) {
  return a < 10 || (r >= 240 && g >= 240 && b >= 240);
}

function drawToCanvas(img, whiteBg = false) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (whiteBg) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  return { canvas, ctx };
}

function getTrimBounds(canvas, ctx) {
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);

  let top = height, bottom = 0, left = width, right = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!isWhiteOrTransparent(data[i], data[i + 1], data[i + 2], data[i + 3])) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }

  if (top > bottom || left > right) return { top: 0, left: 0, width, height };

  const padding = Math.max(2, Math.round(Math.min(right - left, bottom - top) * 0.02));
  top = Math.max(0, top - padding);
  left = Math.max(0, left - padding);
  bottom = Math.min(height - 1, bottom + padding);
  right = Math.min(width - 1, right + padding);

  return { top, left, width: right - left + 1, height: bottom - top + 1 };
}

function trimAndResize(srcCanvas, srcCtx, maxWidth, maxHeight, whiteBg = false) {
  const bounds = getTrimBounds(srcCanvas, srcCtx);
  const trimmed = srcCtx.getImageData(bounds.left, bounds.top, bounds.width, bounds.height);

  let outW = bounds.width;
  let outH = bounds.height;
  if (outW > maxWidth || outH > maxHeight) {
    const scale = Math.min(maxWidth / outW, maxHeight / outH);
    outW = Math.round(outW * scale);
    outH = Math.round(outH * scale);
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext('2d');

  if (whiteBg) {
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, outW, outH);
  }

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = bounds.width;
  tmpCanvas.height = bounds.height;
  tmpCanvas.getContext('2d').putImageData(trimmed, 0, 0);

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';
  outCtx.drawImage(tmpCanvas, 0, 0, outW, outH);

  return outCanvas.toDataURL('image/png');
}

// ─── Signature Background Validation ────────────────────────────────

const PURE_WHITE_THRESHOLD = 245;
const NEAR_WHITE_THRESHOLD = 225;
const EDGE_PASS_RATIO = 0.85;

/**
 * Validates signature background by sampling edge pixels.
 * Returns 'pass' (clean white), 'fixable' (slightly off-white), or 'reject' (non-white).
 */
export async function validateSignatureBackground(dataUrl) {
  const img = await loadImage(dataUrl);
  const { canvas, ctx } = drawToCanvas(img, true);
  const w = canvas.width;
  const h = canvas.height;
  const { data } = ctx.getImageData(0, 0, w, h);

  const margin = Math.max(3, Math.round(Math.min(w, h) * 0.05));
  let pureWhite = 0;
  let nearWhite = 0;
  let total = 0;

  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    const lum = luminance(data[i], data[i + 1], data[i + 2]);
    total++;
    if (lum > PURE_WHITE_THRESHOLD) pureWhite++;
    else if (lum > NEAR_WHITE_THRESHOLD) nearWhite++;
  };

  for (let x = 0; x < w; x += 2) {
    for (let y = 0; y < margin; y++) sample(x, y);
    for (let y = h - margin; y < h; y++) sample(x, y);
  }
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < margin; x++) sample(x, y);
    for (let x = w - margin; x < w; x++) sample(x, y);
  }

  if (total === 0) return { result: 'reject' };

  if (pureWhite / total >= EDGE_PASS_RATIO) return { result: 'pass' };
  if ((pureWhite + nearWhite) / total >= EDGE_PASS_RATIO) return { result: 'fixable' };
  return { result: 'reject' };
}

// ─── Signature Processing ───────────────────────────────────────────

/**
 * Processes a signature image:
 *  1. Converts ink to black, background to white (with anti-aliased edges)
 *  2. Trims whitespace
 *  3. Resizes to fit within maxWidth × maxHeight
 *
 * @param {string} dataUrl - Raw image data URL
 * @param {object} opts
 * @param {number} opts.maxWidth  - Max output width (default 400)
 * @param {number} opts.maxHeight - Max output height (default 120)
 * @param {boolean} opts.fix      - Use lower white threshold for slightly off-white backgrounds
 */
export async function processSignature(dataUrl, { maxWidth = 400, maxHeight = 120, fix = false } = {}) {
  const img = await loadImage(dataUrl);
  const { canvas, ctx } = drawToCanvas(img, true);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const whiteThreshold = fix ? NEAR_WHITE_THRESHOLD : PURE_WHITE_THRESHOLD;

  for (let i = 0; i < d.length; i += 4) {
    const lum = luminance(d[i], d[i + 1], d[i + 2]);
    if (lum > whiteThreshold) {
      d[i] = d[i + 1] = d[i + 2] = 255;
    } else {
      const gray = Math.round((lum / whiteThreshold) * 255);
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return trimAndResize(canvas, ctx, maxWidth, maxHeight, true);
}

// ─── Generic Image Processing (logos etc.) ──────────────────────────

/**
 * Trims and resizes a generic image (e.g. clinic logo).
 *
 * @param {string} dataUrl - Raw image data URL
 * @param {object} opts
 * @param {number} opts.maxWidth     - Max output width (default 300)
 * @param {number} opts.maxHeight    - Max output height (default 120)
 * @param {boolean} opts.transparentBg - Keep transparency (default true)
 */
export async function processImage(dataUrl, { maxWidth = 300, maxHeight = 120, transparentBg = true } = {}) {
  const img = await loadImage(dataUrl);
  const { canvas, ctx } = drawToCanvas(img, !transparentBg);
  return trimAndResize(canvas, ctx, maxWidth, maxHeight, !transparentBg);
}
