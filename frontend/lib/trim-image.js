/**
 * Trim the empty margins around a raster logo (transparent or near-white) in the
 * browser before upload. Logos exported as a big square with lots of padding end
 * up tiny when the report shows them at a fixed height; trimming makes the
 * visible artwork fill that height. SVG/GIF and unreadable files are returned as is.
 */
export async function trimLogo(file, { maxWidth = 800, pad = 2, white = 245 } = {}) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const src = document.createElement('canvas');
    src.width = bmp.width; src.height = bmp.height;
    const ctx = src.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, src.width, src.height);

    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] < 16) continue;                                        // transparent
        if (data[i] >= white && data[i + 1] >= white && data[i + 2] >= white) continue; // near white
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return file; // blank image

    minX = Math.max(0, minX - pad);  minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
    const w = maxX - minX + 1, h = maxY - minY + 1;
    const scale = Math.min(1, maxWidth / w);

    const out = document.createElement('canvas');
    out.width = Math.round(w * scale); out.height = Math.round(h * scale);
    out.getContext('2d').drawImage(src, minX, minY, w, h, 0, 0, out.width, out.height);

    const blob = await new Promise(res => out.toBlob(res, 'image/png'));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.png', { type: 'image/png' });
  } catch {
    return file;
  }
}
