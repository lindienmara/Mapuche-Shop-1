// TYPE DE BOUTIQUE N° 3 — LA MAISON
// ---------------------------------
// Une vitrine de luxe ne montre pas plus de choses : elle en montre moins, et
// mieux. Tout part de là.
//
//   La photo occupe toute la largeur. C'est elle le produit, pas sa fiche.
//   Le texte s'efface : lettres fines, très espacées, en petites capitales.
//   Le vide n'est pas une perte de place, c'est ce qui donne de la valeur.
//   Une seule couleur d'accent, en filet, jamais en aplat.
//   Aucun dégradé criard, aucune ombre colorée, aucun badge tapageur.
//
// L'accent reprend la couleur « jaune » de la palette de la boutique : sur un
// fond sombre, c'est l'or. Chaque boutique garde donc sa teinte.
//
// ★ CE FICHIER N'APPARTIENT QU'A CE TYPE.
// Le modifier ne touche ni le type 1 ni le type 2.

import React from "react";
import { ChevronRight, PlayCircle } from "lucide-react";
import { visuelProduit } from "./visuels.js";
import {
  BOUTIQUE, FAMILLES, TOUS_PRODUITS, VEDETTES, SELECTION_CHEF, EST_VIDEOS, EN_RUPTURE,
  SECOURS, AJUSTEMENT, GALERIE, Photo, CORPS, euros, bordure, texte, texteDoux, jaune,
} from "./commun.jsx";

// Les lettres de cette boutique : fines, très espacées, en capitales. C'est ce
// qui distingue une enseigne d'une étiquette de prix.
const CAPITALES = {
  fontFamily: CORPS, fontWeight: 300, letterSpacing: ".22em",
  textTransform: "uppercase",
};
const FILET = `1px solid ${jaune}33`;

// Ce qu'on met en avant : les produits marqués vedette, sinon ceux marqués en
// avant, sinon les premiers du catalogue. Une vitrine n'est jamais vide.
//
// Et ceux QUI ONT UNE PHOTO passent devant. Dans cette présentation, l'image
// est le sujet : mettre en tête un produit sans photo, c'est ouvrir sa vitrine
// sur un cadre vide. L'ordre choisi par la boutique est respecté à l'intérieur
// de chaque groupe — on ne fait que remonter ceux qui ont de quoi se montrer.
const A_UNE_PHOTO = (p) => GALERIE(p).length > 0;

const MIS_EN_AVANT = (VEDETTES.length ? VEDETTES
  : SELECTION_CHEF.length ? SELECTION_CHEF
  : TOUS_PRODUITS)
  .slice()
  .sort((a, b) => (A_UNE_PHOTO(b) ? 1 : 0) - (A_UNE_PHOTO(a) ? 1 : 0))
  .slice(0, 9);

function Filet({ marge = 22 }) {
  return <div style={{ height: 1, background: `${jaune}2E`, margin: `${marge}px 20px` }} />;
}

// Le titre d'une section : deux mots, très espacés, encadrés de filets.
function Intertitre({ children }) {
  return (
    <div className="flex items-center gap-3 px-5" style={{ marginTop: 26, marginBottom: 16 }}>
      <span style={{ flex: 1, height: 1, background: `${jaune}2E` }} />
      <span style={{ ...CAPITALES, fontSize: 10.5, color: jaune }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: `${jaune}2E` }} />
    </div>
  );
}

/* ── LA PIÈCE MAÎTRESSE ──
   Une seule photo, pleine largeur, plus haute que large. Le nom se lit par
   dessus, en bas, sur un voile qui ne cache rien de l'image. */
/* Aucune photo dans toute la boutique ? Étirer un dessin de secours sur toute
   la largeur donnerait une affiche vide — l'inverse de l'effet recherché. On
   compose alors avec ce qu'on a : le nom, écrit grand, dans un cadre de filets.
   Une devanture sobre vaut mieux qu'une grande image qui n'en est pas une. */
function MaitresseSansPhoto({ produit, onProduit }) {
  return (
    <button
      onClick={() => onProduit(produit.famille, produit.gamme, produit)}
      className="block w-full text-left"
      style={{ padding: "44px 26px 40px", margin: "10px 20px 0",
               border: FILET, background: "#00000055" }}
    >
      <p style={{ ...CAPITALES, fontSize: 9.5, color: jaune, marginBottom: 14 }}>
        {produit.famille.nom}
      </p>
      <p style={{ ...CAPITALES, fontSize: 27, color: "#fff", lineHeight: 1.3, letterSpacing: ".1em" }}>
        {produit.nom}
      </p>
      <div style={{ height: 1, background: `${jaune}44`, margin: "18px 0", width: 54 }} />
      <p style={{ fontFamily: CORPS, fontWeight: 300, fontSize: 15, color: jaune, letterSpacing: ".08em" }}>
        {euros(produit.prix)}
      </p>
    </button>
  );
}

function Maitresse({ produit, onProduit }) {
  if (!produit) return null;
  if (!A_UNE_PHOTO(produit)) return <MaitresseSansPhoto produit={produit} onProduit={onProduit} />;
  return (
    <button
      onClick={() => onProduit(produit.famille, produit.gamme, produit)}
      className="relative block w-full text-left"
      style={{ marginTop: 6 }}
    >
      <Photo
        produit={produit}
        secours={SECOURS(produit, produit.famille)}
        source={visuelProduit(produit, produit.famille.couleurs, produit.famille.glyphe)}
        alt={produit.nom}
        className="w-full block"
        style={{ aspectRatio: "4 / 5", objectFit: AJUSTEMENT(produit), background: "#000" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 px-6 pb-7 pt-16"
        style={{ backgroundImage: "linear-gradient(0deg, #000000E8 22%, transparent 100%)" }}
      >
        <p style={{ ...CAPITALES, fontSize: 9.5, color: jaune, marginBottom: 7 }}>
          {produit.famille.nom}
        </p>
        <p style={{ ...CAPITALES, fontSize: 21, color: "#fff", lineHeight: 1.25, letterSpacing: ".13em" }}>
          {produit.nom}
        </p>
        <p style={{ fontFamily: CORPS, fontWeight: 300, fontSize: 14, color: jaune, marginTop: 7, letterSpacing: ".08em" }}>
          {euros(produit.prix)}
        </p>
      </div>
    </button>
  );
}

/* ── LA SÉLECTION ──
   Deux colonnes, des photos en hauteur, beaucoup d'air entre elles. Le nom et
   le prix se lisent sous l'image, jamais dessus : rien ne doit la salir. */
function Piece({ produit, onProduit }) {
  return (
    <button onClick={() => onProduit(produit.famille, produit.gamme, produit)} className="text-left block">
      <Photo
        produit={produit}
        secours={SECOURS(produit, produit.famille)}
        source={visuelProduit(produit, produit.famille.couleurs, produit.famille.glyphe)}
        alt={produit.nom}
        className="w-full block"
        style={{ aspectRatio: "3 / 4", objectFit: AJUSTEMENT(produit), background: "#000" }}
      />
      <p style={{ ...CAPITALES, fontSize: 10, color: texte, marginTop: 10, lineHeight: 1.5 }}>
        {produit.nom}
      </p>
      <p style={{ fontFamily: CORPS, fontWeight: 300, fontSize: 11.5, color: jaune, marginTop: 3, letterSpacing: ".07em" }}>
        {euros(produit.prix)}
      </p>
    </button>
  );
}

/* ── LES COLLECTIONS ──
   Les familles, en lignes sobres plutôt qu'en grandes affiches : dans une
   maison, on entre par un nom, pas par une vignette. */
function Collection({ famille, onFamille }) {
  return (
    <button
      onClick={() => onFamille(famille)}
      className="w-full flex items-center gap-4 px-5 text-left"
      style={{ paddingTop: 17, paddingBottom: 17, borderBottom: FILET }}
    >
      <span style={{ fontSize: 17, opacity: .85 }}>{famille.emoji}</span>
      <span style={{ ...CAPITALES, fontSize: 12, color: texte, flex: 1, minWidth: 0 }}>
        {famille.nom}
      </span>
      {EST_VIDEOS(famille) && <PlayCircle size={13} color={jaune} />}
      {/* Rayon fermé : on le dit sur la ligne, avant d'y entrer. */}
      {EN_RUPTURE(famille) && (
        <span style={{ fontFamily: CORPS, fontSize: 10, fontWeight: 700, color: texteDoux, letterSpacing: ".12em" }}>
          ÉPUISÉ
        </span>
      )}
      <ChevronRight size={15} color={texteDoux} />
    </button>
  );
}

export function EcranLuxe({ onFamille, onProduit }) {
  const maitresse = MIS_EN_AVANT[0];
  const selection = MIS_EN_AVANT.slice(1);

  return (
    <>
      {/* L'enseigne : le sous-titre de la boutique, seul, très espacé. */}
      {(BOUTIQUE.sousTitre || "").trim() && (
        <p className="px-6 text-center" style={{ ...CAPITALES, fontSize: 9.5, color: texteDoux, marginTop: 14 }}>
          {BOUTIQUE.sousTitre}
        </p>
      )}

      <Maitresse produit={maitresse} onProduit={onProduit} />

      {selection.length > 0 && (
        <>
          <Intertitre>{(BOUTIQUE.enAvant || "").trim() || "La sélection"}</Intertitre>
          <div className="grid grid-cols-2" style={{ gap: 18, padding: "0 20px" }}>
            {selection.map((p) => <Piece key={p.cle || p.ref} produit={p} onProduit={onProduit} />)}
          </div>
        </>
      )}

      <Intertitre>Les collections</Intertitre>
      <div style={{ borderTop: FILET }}>
        {FAMILLES.map((f) => <Collection key={f.id} famille={f} onFamille={onFamille} />)}
      </div>

      <Filet marge={26} />
      <p className="text-center px-6" style={{ ...CAPITALES, fontSize: 8.5, color: texteDoux, paddingBottom: 8 }}>
        {BOUTIQUE.nom}
      </p>
    </>
  );
}
