// VISUELS
// -------
// Les images sont dessinées ici, en SVG, et intégrées directement dans la page.
// Aucune n'est chargée depuis un autre site : c'est ce qui garantit qu'elles
// s'affichent partout, y compris dans le navigateur intégré de Telegram.

const GLYPHES = {
  salade: `
    <g stroke="#14411A" stroke-width="2.5">
      <ellipse cx="50" cy="60" rx="36" ry="28" fill="#2E7D32"/>
      <ellipse cx="26" cy="50" rx="20" ry="21" fill="#388E3C"/>
      <ellipse cx="74" cy="50" rx="20" ry="21" fill="#388E3C"/>
      <ellipse cx="50" cy="40" rx="25" ry="22" fill="#4CAF50"/>
      <ellipse cx="34" cy="64" rx="15" ry="13" fill="#66BB6A"/>
      <ellipse cx="66" cy="64" rx="15" ry="13" fill="#66BB6A"/>
      <ellipse cx="50" cy="57" rx="16" ry="14" fill="#A5D6A7"/>
    </g>`,
  tomate: `
    <rect x="47.5" y="17" width="5" height="13" rx="2.5" fill="#33691E"/>
    <circle cx="50" cy="60" r="30" fill="#E53935"/>
    <ellipse cx="39" cy="50" rx="10" ry="8" fill="#EF5350"/>
    <ellipse cx="50" cy="28" rx="5" ry="9" fill="#2E7D32"/>
    <ellipse cx="37" cy="32" rx="10" ry="5" fill="#2E7D32" transform="rotate(-22 37 32)"/>
    <ellipse cx="63" cy="32" rx="10" ry="5" fill="#2E7D32" transform="rotate(22 63 32)"/>`,
  patate: `
    <ellipse cx="50" cy="55" rx="35" ry="25" fill="#C08B4E" transform="rotate(-12 50 55)"/>
    <ellipse cx="41" cy="45" rx="11" ry="7" fill="#D6A96E"/>
    <ellipse cx="37" cy="50" rx="4" ry="3" fill="#8D5A2B"/>
    <ellipse cx="59" cy="62" rx="3.5" ry="2.5" fill="#8D5A2B"/>
    <ellipse cx="65" cy="48" rx="3" ry="2" fill="#8D5A2B"/>
    <ellipse cx="45" cy="65" rx="3" ry="2" fill="#8D5A2B"/>`,
  // Formes neutres, pour une boutique qui ne vend pas de légumes.
  boite: `
    <path d="M50 22 L86 38 L50 54 L14 38 Z" fill="#FFFFFF" fill-opacity=".92"/>
    <path d="M14 38 L50 54 L50 84 L14 68 Z" fill="#FFFFFF" fill-opacity=".68"/>
    <path d="M86 38 L50 54 L50 84 L86 68 Z" fill="#FFFFFF" fill-opacity=".5"/>`,
  etoile: `
    <path d="M50 16 L61 41 L88 44 L68 62 L74 89 L50 75 L26 89 L32 62 L12 44 L39 41 Z"
      fill="#FFFFFF" fill-opacity=".92"/>`,
  sac: `
    <path d="M22 40 h56 l-5 46 a6 6 0 0 1-6 5 H33 a6 6 0 0 1-6-5 Z" fill="#FFFFFF" fill-opacity=".9"/>
    <path d="M36 40 v-8 a14 14 0 0 1 28 0 v8" fill="none" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="5"/>`,
  drapeau: `
    <rect x="20" y="14" width="5" height="74" rx="2.5" fill="#FFFFFF" fill-opacity=".92"/>
    <path d="M25 20 h56 a4 4 0 0 1 3 6 l-7 12 7 12 a4 4 0 0 1-3 6 H25 Z" fill="#FFFFFF" fill-opacity=".88"/>
    <rect x="34" y="30" width="38" height="4" rx="2" fill="#000" fill-opacity=".28"/>
    <rect x="34" y="42" width="26" height="4" rx="2" fill="#000" fill-opacity=".28"/>`,
  serviette: `
    <rect x="12" y="24" width="76" height="52" rx="8" fill="#FFFFFF" fill-opacity=".9"/>
    <rect x="12" y="34" width="76" height="5" fill="#000" fill-opacity=".2"/>
    <rect x="12" y="46" width="76" height="5" fill="#000" fill-opacity=".2"/>
    <rect x="12" y="58" width="76" height="5" fill="#000" fill-opacity=".2"/>
    <path d="M76 24 v52" stroke="#000" stroke-opacity=".18" stroke-width="3"/>`,
  housse: `
    <rect x="10" y="44" width="80" height="34" rx="7" fill="#FFFFFF" fill-opacity=".9"/>
    <rect x="18" y="30" width="30" height="18" rx="6" fill="#FFFFFF" fill-opacity=".7"/>
    <path d="M10 60 h80" stroke="#000" stroke-opacity=".2" stroke-width="3"/>
    <path d="M58 44 v34" stroke="#000" stroke-opacity=".16" stroke-width="3"/>`,
};

function dataUri(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace(/\s+/g, " "));
}

// Fond bariolé commun à tous les visuels : halos colorés, rayures et confettis.
function fondBariole(l, h, c1, c2) {
  const confettis = [
    [0.12, 0.18, 7, "#FFE600"], [0.86, 0.22, 6, "#00E5FF"], [0.28, 0.82, 5, "#FF1B8D"],
    [0.72, 0.86, 8, "#7CFC00"], [0.52, 0.12, 5, "#FF7A00"], [0.06, 0.62, 6, "#7B2FF7"],
    [0.94, 0.66, 5, "#FFE600"], [0.40, 0.94, 6, "#00E5FF"],
  ]
    .map(([x, y, r, c]) => `<circle cx="${(x * l).toFixed(0)}" cy="${(y * h).toFixed(0)}" r="${r}" fill="${c}" fill-opacity=".55"/>`)
    .join("");

  return `
    <defs>
      <radialGradient id="g1" cx=".2" cy=".18" r=".85">
        <stop offset="0" stop-color="${c1}" stop-opacity=".95"/>
        <stop offset="1" stop-color="${c1}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx=".85" cy=".8" r=".9">
        <stop offset="0" stop-color="${c2}" stop-opacity=".95"/>
        <stop offset="1" stop-color="${c2}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g3" cx=".55" cy=".5" r=".6">
        <stop offset="0" stop-color="#7B2FF7" stop-opacity=".55"/>
        <stop offset="1" stop-color="#7B2FF7" stop-opacity="0"/>
      </radialGradient>
      <pattern id="ray" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
        <rect width="11" height="34" fill="#FFFFFF" fill-opacity=".07"/>
      </pattern>
    </defs>
    <rect width="${l}" height="${h}" fill="#160B22"/>
    <rect width="${l}" height="${h}" fill="url(#g3)"/>
    <rect width="${l}" height="${h}" fill="url(#g1)"/>
    <rect width="${l}" height="${h}" fill="url(#g2)"/>
    <rect width="${l}" height="${h}" fill="url(#ray)"/>
    ${confettis}`;
}

// Bannière d'une famille. Si une vraie photo est renseignée dans le
// catalogue, c'est elle qui est utilisée ; sinon on dessine un fond bariolé.
// Le nom de la famille est écrit par-dessus par App.jsx, pas dans l'image :
// comme ça il reste lisible quelle que soit la photo.
export function visuelFamille(famille) {
  if (famille.image) return famille.image;
  const [c1, c2] = famille.couleurs;
  const glyphe = GLYPHES[famille.glyphe] || GLYPHES.salade;

  return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 340" width="760" height="340">
    ${fondBariole(760, 340, c1, c2)}
    <g transform="translate(30 12) scale(2.4)">${glyphe}</g>
    <g transform="translate(490 12) scale(2.4)">${glyphe}</g>
  </svg>`);
}

// Vignette d'un produit : sa photo si elle existe, sinon un visuel dessiné.
export function visuelProduit(produit, couleurs, glypheFamille) {
  if (produit && produit.image) return produit.image;
  const [c1, c2] = couleurs;
  const glyphe = GLYPHES[glypheFamille] || GLYPHES[(produit || {}).glyphe] || GLYPHES.salade;
  return dataUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    ${fondBariole(500, 500, c1, c2)}
    <g transform="translate(100 100) scale(3)">${glyphe}</g>
  </svg>`);
}
