// Generate PWA icons (192, 512) from the SVG masthead design using sharp.
/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const { writeFileSync } = require("fs");
const { join } = require("path");

const pub = "/home/z/my-project/public";

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0b0d"/>
      <stop offset="1" stop-color="#1c1a16"/>
    </linearGradient>
    <clipPath id="r"><rect width="${size}" height="${size}" rx="${size * 0.22}"/></clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    <text x="${size/2}" y="${size*0.42}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${size*0.165}" font-weight="700" fill="#d9a441" letter-spacing="${size*0.012}" dominant-baseline="middle">ISSUE</text>
    <line x1="${size*0.22}" y1="${size*0.52}" x2="${size*0.78}" y2="${size*0.52}" stroke="#f5f3ee" stroke-width="${Math.max(1,size*0.004)}"/>
    <line x1="${size*0.22}" y1="${size*0.535}" x2="${size*0.78}" y2="${size*0.535}" stroke="#f5f3ee" stroke-width="${Math.max(1,size*0.003)}"/>
    <text x="${size/2}" y="${size*0.62}" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="${size*0.062}" fill="#f5f3ee" fill-opacity="0.85" dominant-baseline="middle">a quiet magazine</text>
    <text x="${size/2}" y="${size*0.74}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${size*0.027}" letter-spacing="${size*0.008}" fill="#f5f3ee" fill-opacity="0.55" dominant-baseline="middle">EVERY DAY A PAGE</text>
  </g>
</svg>
`;

(async () => {
  await sharp(Buffer.from(svg(192))).png().toFile(join(pub, "icon-192.png"));
  console.log("wrote icon-192.png");
  await sharp(Buffer.from(svg(512))).png().toFile(join(pub, "icon-512.png"));
  console.log("wrote icon-512.png");
  // Apple touch icon (180) — reuse 192
  await sharp(Buffer.from(svg(180))).png().toFile(join(pub, "apple-touch-icon.png"));
  console.log("wrote apple-touch-icon.png");
  // Maskable icon (512 with full-bleed padding)
  await sharp(Buffer.from(svg(512))).png().toFile(join(pub, "icon-maskable-512.png"));
  console.log("wrote icon-maskable-512.png");
})().catch(e => { console.error(e); process.exit(1); });
