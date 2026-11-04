/* =========================================================
   Ilustrasi produk generatif
   Menghasilkan SVG (data-URI) yang konsisten untuk setiap
   produk, jadi toko tetap tampil rapi tanpa file gambar.
   ========================================================= */

const ART_PALETTES = {
  pakaian: {
    bgA: "#efe6d7",
    bgB: "#dccbb4",
    accent: "#b4522c",
    soft: "#f6efe2",
    ink: "#372d23",
  },
  "alas-kaki": {
    bgA: "#e6e7df",
    bgB: "#c9cbbd",
    accent: "#5f6b48",
    soft: "#f2f3ea",
    ink: "#2b2f24",
  },
  aksesori: {
    bgA: "#ede3df",
    bgB: "#d8c2b9",
    accent: "#a8594e",
    soft: "#f8efeb",
    ink: "#332523",
  },
  rumah: {
    bgA: "#e4e8ea",
    bgB: "#c3ccd2",
    accent: "#5b7382",
    soft: "#eef3f5",
    ink: "#20272b",
  },
  default: {
    bgA: "#efe8dc",
    bgB: "#d9cbb6",
    accent: "#b4522c",
    soft: "#f6efe4",
    ink: "#2c2620",
  },
};

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function artwork(seed, variant = 0, category = "default") {
  const pal = ART_PALETTES[category] || ART_PALETTES.default;
  const rand = makeRng(hashString(`${seed}:${variant}`));
  const kind = Math.abs(variant) % 4;
  const W = 800;
  const H = 1000;
  const pieces = [];

  if (kind === 0) {
    const aw = 300 + rand() * 190;
    const cx = 220 + rand() * 360;
    const top = 250 + rand() * 200;
    pieces.push(
      `<path d="M ${cx - aw / 2} ${H} L ${cx - aw / 2} ${top + aw / 2} A ${
        aw / 2
      } ${aw / 2} 0 0 1 ${cx + aw / 2} ${
        top + aw / 2
      } L ${cx + aw / 2} ${H} Z" fill="${pal.accent}" opacity="0.9"/>`
    );
    pieces.push(
      `<circle cx="${cx + 160 + rand() * 90}" cy="${200 + rand() * 90}" r="${
        34 + rand() * 46
      }" fill="${pal.soft}" opacity="0.85"/>`
    );
  } else if (kind === 1) {
    const r = 170 + rand() * 90;
    pieces.push(
      `<circle cx="${W / 2 + (rand() - 0.5) * 90}" cy="${
        370 + rand() * 60
      }" r="${r}" fill="${pal.accent}" opacity="0.88"/>`
    );
    for (let i = 0; i < 4; i++) {
      const y = 640 + i * (34 + rand() * 10);
      pieces.push(
        `<rect x="${90 + rand() * 120}" y="${y}" width="${
          W - 200 - rand() * 160
        }" height="6" rx="3" fill="${pal.ink}" opacity="${
          0.16 + i * 0.05
        }"/>`
      );
    }
    pieces.push(
      `<path d="M ${80} ${H - 120} C ${W * 0.35} ${H - 260}, ${
        W * 0.62
      } ${H - 40}, ${W - 70} ${H - 200}" stroke="${pal.ink}" stroke-opacity="0.25" stroke-width="3" fill="none"/>`
    );
  } else if (kind === 2) {
    const r1 = 150 + rand() * 70;
    const r2 = 90 + rand() * 60;
    pieces.push(
      `<circle cx="${W * 0.38}" cy="${H * 0.62}" r="${r1}" fill="${pal.accent}" opacity="0.9"/>`
    );
    pieces.push(
      `<circle cx="${W * 0.66}" cy="${H * 0.44}" r="${r2}" fill="${pal.ink}" opacity="0.14"/>`
    );
    pieces.push(
      `<circle cx="${W * 0.66}" cy="${H * 0.44}" r="${r2 + 24}" fill="none" stroke="${
        pal.ink
      }" stroke-opacity="0.3" stroke-width="2"/>`
    );
    pieces.push(
      `<rect x="${W * 0.2}" y="${H * 0.14}" width="2" height="${
        H * 0.7
      }" fill="${pal.ink}" opacity="0.18"/>`
    );
  } else {
    const aw = 420 + rand() * 160;
    pieces.push(
      `<path d="M ${-40} ${H} L ${-40} ${H - aw} A ${aw} ${aw} 0 0 1 ${
        aw - 40
      } ${H} Z" fill="${pal.accent}" opacity="0.85"/>`
    );
    pieces.push(
      `<circle cx="${W * 0.68}" cy="${H * 0.26}" r="${
        80 + rand() * 40
      }" fill="none" stroke="${pal.soft}" stroke-opacity="0.85" stroke-width="3"/>`
    );
    pieces.push(
      `<rect x="${W * 0.63}" y="${H * 0.38}" width="${110 + rand() * 60}" height="${
        16 + rand() * 10
      }" rx="8" fill="${pal.ink}" opacity="0.75"/>`
    );
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${pal.bgA}"/>
        <stop offset="1" stop-color="${pal.bgB}"/>
      </linearGradient>
      <radialGradient id="v" cx="0.5" cy="0.35" r="0.75">
        <stop offset="0.55" stop-color="${pal.soft}" stop-opacity="0"/>
        <stop offset="1" stop-color="${pal.ink}" stop-opacity="0.14"/>
      </radialGradient>
      <filter id="n">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    ${pieces.join("")}
    <rect width="${W}" height="${H}" fill="url(#v)"/>
    <rect width="${W}" height="${H}" filter="url(#n)" opacity="0.09" style="mix-blend-mode:multiply"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function productImage(product, variant = 0) {
  if (product.img) return product.img;
  return artwork(product.id, variant, product.category);
}
