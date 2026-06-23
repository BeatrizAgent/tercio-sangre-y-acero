import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { inflateSync } from "node:zlib";
import { DIEGO_SPRITE_SHEETS, getDiegoFrameWidth } from "../../src/lib/domain/combat/diego-sprite-sheets";

interface DecodedPng {
  width: number;
  height: number;
  data: Buffer;
}

function decodeRgbaPng(filePath: string): DecodedPng {
  const png = readFileSync(filePath);
  assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const chunks: Buffer[] = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString("ascii");
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    }
    if (type === "IDAT") chunks.push(data);
    if (type === "IEND") break;
    offset += length + 12;
  }

  assert.equal(colorType, 6, `${filePath} must be RGBA`);

  const inflated = inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const out = Buffer.alloc(width * height * 4);
  let src = 0;

  for (let y = 0; y < height; y++) {
    const filter = inflated[src++];
    for (let x = 0; x < stride; x++) {
      const raw = inflated[src++];
      const left = x >= 4 ? out[y * stride + x - 4] : 0;
      const up = y > 0 ? out[(y - 1) * stride + x] : 0;
      const upLeft = y > 0 && x >= 4 ? out[(y - 1) * stride + x - 4] : 0;
      let value = raw;
      if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
      }
      out[y * stride + x] = value & 0xff;
    }
  }

  return { width, height, data: out };
}

function pixelAlpha(image: DecodedPng, x: number, y: number) {
  return image.data[(y * image.width + x) * 4 + 3];
}

for (const [key, sheet] of Object.entries(DIEGO_SPRITE_SHEETS)) {
  assert.equal(sheet.frames, 6, `${key} uses six single-pose frames`);
  assert.ok(getDiegoFrameWidth(key as keyof typeof DIEGO_SPRITE_SHEETS) > 300);

  const filePath = path.resolve("public", sheet.path.replace(/^\//, ""));
  const image = decodeRgbaPng(filePath);
  assert.equal(image.width, sheet.width, `${key} width`);
  assert.equal(image.height, sheet.height, `${key} height`);
  assert.equal(pixelAlpha(image, Math.floor(image.width / 2), 8), 0, `${key} top background is transparent`);
  assert.equal(pixelAlpha(image, Math.floor(image.width / 2), Math.floor(image.height / 2)), 0, `${key} center background is transparent`);
}

console.log(JSON.stringify({ ok: true, checked: "sprite-assets" }, null, 2));
