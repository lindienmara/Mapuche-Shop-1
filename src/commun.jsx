// LE TRONC COMMUN DU MOTEUR
// -------------------------
// Tout ce que les DEUX types de boutique partagent : les donnees lues, les
// couleurs, les photos, les prix, la commande, la fiche d'un produit.
// Une correction faite ici profite a TOUTES les boutiques, quel que soit
// leur type. C'est la « meme sauvegarde » qui s'applique partout.
//
// Ce qui distingue un type de l'autre ne vit PAS ici : voir type-familles.jsx
// et type-liste.jsx. Ces deux fichiers ne se lisent jamais l'un l'autre, et
// c'est exactement ce qui permet de corriger l'un sans abimer l'autre.

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Search, ShoppingCart, Plus, Minus, X,
  Home, Info, Link2, Star, MessageCircle, Maximize2, PlayCircle,
} from "lucide-react";
import { BOUTIQUE as BOUTIQUE_PUBLIEE, COULEURS as COULEURS_PUBLIEES } from "./config.js";
import { FAMILLES as FAMILLES_PUBLIEES } from "./catalogue.js";
import { visuelFamille, visuelProduit } from "./visuels.js";

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');`;

// APERÇU — l'éditeur ouvre la boutique avec le brouillon dans l'adresse, après
// le dièse : .../?apercu=1#<données>. La partie après le dièse ne quitte jamais
// le navigateur, et ce mécanisme fonctionne même quand l'éditeur est hébergé
// ailleurs que la boutique. Sans ce paramètre, rien ne change.
function brouillon() {
  try {
    if (new URLSearchParams(location.search).get("apercu") !== "1") return null;
    const charge = location.hash.replace(/^#/, "");
    if (!charge) return null;
    const binaire = atob(charge);
    const octets = Uint8Array.from(binaire, (c) => c.charCodeAt(0));
    const d = JSON.parse(new TextDecoder().decode(octets));
    if (!d || !d.BOUTIQUE || !d.COULEURS || !Array.isArray(d.FAMILLES)) return null;
    return d;
  } catch (e) {
    return null;
  }
}

export const APERCU = brouillon();
export const BOUTIQUE = APERCU ? { ...BOUTIQUE_PUBLIEE, ...APERCU.BOUTIQUE } : BOUTIQUE_PUBLIEE;
export const COULEURS = APERCU ? { ...COULEURS_PUBLIEES, ...APERCU.COULEURS } : COULEURS_PUBLIEES;
export const FAMILLES = APERCU ? APERCU.FAMILLES : FAMILLES_PUBLIEES;

// Une famille peut être une galerie de vidéos au lieu d'un rayon de produits.
// Elle se place où on veut dans la liste, et rien ne s'y achète : ni prix, ni
// panier. C'est le seul champ qui distingue les deux.
export const EST_VIDEOS = (f) => f.type === "videos";

// Un produit peut porter plusieurs photos. « images » est la liste complète,
// « image » la première — gardée pour les catalogues écrits avant la galerie.
export const GALERIE = (p) =>
  Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);

/* ★ POURQUOI UNE CLÉ, ET PAS LA RÉFÉRENCE DU PRODUIT
   React identifie chaque carte d'une liste par une « clé ». Deux cartes de même
   clé, et il les confond : en changeant de famille, il garde les anciennes
   cartes, en oublie de nouvelles, et mélange les deux. À l'écran, ça donne des
   articles qui manquent et des articles d'une autre famille qui s'ajoutent à la
   suite — sans la moindre erreur signalée.

   Or rien n'oblige une référence à être unique : REF-003 peut servir dans trois
   collections différentes, et c'est bien légitime. La clé est donc construite
   ici, à partir de l'endroit exact où le produit se trouve — famille, gamme,
   rang. Deux produits ne peuvent pas occuper la même place.

   Conséquence : les catalogues qui réutilisent leurs références s'affichent
   correctement, sans avoir à les renuméroter. */
export const CLE = (f, g, i, p) => `${f.id}|${g.id}|${i}|${p.ref || ""}`;

export const TOUS_PRODUITS = FAMILLES.filter((f) => !EST_VIDEOS(f)).flatMap((f) =>
  f.gammes.flatMap((g) => g.produits.map((p, i) => ({ ...p, famille: f, gamme: g, cle: CLE(f, g, i, p) })))
);
export const SELECTION_CHEF = TOUS_PRODUITS.filter((p) => p.chef);

// Les produits mis en vedette occupent le haut de l'accueil, en petits carrés
// noirs, quatre par ligne. Volontairement compacts : le catalogue doit rester
// visible juste dessous, sans faire défiler.
export const VEDETTES = TOUS_PRODUITS.filter((p) => p.vedette).slice(0, 8);

// Deux façons de présenter le même catalogue :
//   « familles » : on descend famille → gamme → produit
//   « liste »    : tout sur une page, avec recherche et pastilles de catégories
// C'est un réglage, pas un moteur séparé : les deux profitent des mêmes
// nouveautés, et une boutique peut changer d'avis sans rien perdre.
// Le dessin de secours d un produit : le meme visuel, sans sa photo.
export const SECOURS = (p, famille) => visuelProduit({ ...p, image: "", images: [] }, famille.couleurs, famille.glyphe);

export const PRESENTATION = ["liste", "luxe"].includes(BOUTIQUE.presentation)
  ? BOUTIQUE.presentation : "familles";

// Cadrage des photos. « carre » remplit le cadre quitte à couper les bords,
// « entier » montre toute l'image quitte à laisser des bandes. Jamais de
// déformation dans un cas comme dans l'autre.
export const AJUSTEMENT = (p) =>
  ((p && p.cadrage) || (BOUTIQUE.imageEntiere ? "entier" : "carre")) === "entier"
    ? "contain"
    : "cover";

// Forme du cadre réservé aux photos. Sans elle, une photo en hauteur resterait
// petite au milieu d'un carré : c'est la place disponible qu'il faut changer,
// pas seulement la façon de remplir.
const PROPORTIONS = { carre: "1 / 1", portrait: "3 / 4", paysage: "4 / 3", libre: "" };
export const PROPORTION_PHOTO = PROPORTIONS[BOUTIQUE.formatPhoto] ?? "1 / 1";

// « libre » : aucune proportion imposée, la carte prend la hauteur de l'image,
// qui s'affiche donc entière et sans bande. Sinon le cadre garde sa forme.
export const STYLE_PHOTO = (p) =>
  PROPORTION_PHOTO
    ? { aspectRatio: PROPORTION_PHOTO, objectFit: AJUSTEMENT(p), background: fondCarte }
    : { height: "auto", background: fondCarte };

/* ─────────────────────── LE CADRAGE EST UN AFFICHAGE ───────────────────────
   Les photos sont enregistrées entières. Ce qui est visible dans la boutique
   n'est pas un découpage du fichier mais un réglage : un point de visée et un
   grossissement, appliqués à l'affichage.

   Conséquence : changer de forme — carré, portrait, paysage — ou déplacer le
   cadre ne demande jamais de renvoyer une photo, et ne fait jamais perdre un
   morceau de l'original. */
export function Photo({ produit, source, alt, style, className, secours }) {
  const zoom = Number(produit && produit.cadrageZoom) || 1;
  const visee = (produit && produit.cadragePos) || "50% 50%";
  const cadre = style || STYLE_PHOTO(produit);

  // Un fichier absent — photo pas encore envoyée, boutique dupliquée sans ses
  // images — ne doit pas laisser un cadre vide : on retombe sur le dessin.
  const surEchec = (e) => {
    if (secours && e.target.src !== secours) e.target.src = secours;
  };

  // Sans grossissement, une simple image suffit : moins de couches, même rendu.
  if (zoom <= 1) {
    return <img src={source} alt={alt} className={className} onError={surEchec} style={{ ...cadre, objectPosition: visee }} />;
  }
  const { objectFit, ...boite } = cadre;
  return (
    <span className={className} style={{ ...boite, display: "block", overflow: "hidden" }}>
      <img
        src={source}
        alt={alt}
        onError={surEchec}
        className="block w-full h-full"
        style={{ objectFit, objectPosition: visee, transform: `scale(${zoom})`, transformOrigin: visee }}
      />
    </span>
  );
}

export const { fond, fondCarte, bordure, texte, texteDoux, rose, violet, vert, jaune, cyan } = COULEURS;

// Image de fond facultative, posée derrière toute la boutique. Un voile sombre
// est ajouté par-dessus pour que les textes restent lisibles, et la colonne
// centrale devient légèrement transparente pour laisser voir l'image.
export const FOND_IMAGE = (BOUTIQUE.fondImage || "").trim();
// Quand une image de fond est posée, la colonne et les espaces deviennent
// transparents : seuls les blocs de contenu gardent un fond, légèrement
// translucide, pour que l'image se voie partout entre les éléments.
export const COLONNE = FOND_IMAGE ? "transparent" : COULEURS.fond;
export const CARTE = FOND_IMAGE ? COULEURS.fondCarte + "D9" : COULEURS.fondCarte;
export const VOILE = (couleur, alpha) => (FOND_IMAGE ? couleur + alpha : couleur);

export const FOND_PAGE = FOND_IMAGE
  ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.78)), url("${FOND_IMAGE}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }
  : { background: `radial-gradient(circle at 50% 0%, ${COULEURS.halo || "#17240F"} 0%, #060505 62%)` };
export const DEGRADE = `linear-gradient(90deg, ${rose}, ${violet})`;
export const TITRE = "'Anton', 'Arial Narrow', Impact, sans-serif";
export const CORPS = "'Inter', -apple-system, 'Segoe UI', sans-serif";

// Ouverture facultative, jouée une fois par visite. Une vidéo si elle est
// fournie, sinon un simple titre animé — qui ne coûte rien à charger.
export const INTRO = {
  active: BOUTIQUE.introActive === true,
  texte: (BOUTIQUE.introTexte || "").trim() || `BIENVENUE — ${(BOUTIQUE.nom || "").toUpperCase()}`,
  video: (BOUTIQUE.introVideo || "").trim(),
  duree: Math.min(15, Math.max(1, Number(BOUTIQUE.introDuree) || 3)),
};

export const ANIMATIONS = `
@keyframes atelier-apparition {
  from { opacity: 0; transform: scale(.86) translateY(14px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes atelier-lueur {
  0%, 100% { filter: brightness(1); }
  50%      { filter: brightness(1.35); }
}
@keyframes atelier-trait {
  from { width: 0; opacity: 0; }
  to   { width: 62%; opacity: 1; }
}
@keyframes atelier-sortie {
  to { opacity: 0; visibility: hidden; }
}
@media (prefers-reduced-motion: reduce) {
  .atelier-anime { animation: none !important; }
}`;

document.title = (APERCU ? "Aperçu — " : "") + BOUTIQUE.nom;

export const telegram = window.Telegram && window.Telegram.WebApp;
if (telegram) {
  telegram.ready();
  telegram.expand();
}

export const euros = (n) => n.toFixed(2).replace(".", ",") + " €";

export function cartTotal(items) {
  return items.reduce((s, i) => s + i.prix * i.qty, 0);
}

/* ─────────────────────── où arrivent les commandes ───────────────────────
   Le propriétaire choisit son application. Une seule accepte aujourd'hui un
   message déjà écrit dans le lien : WhatsApp. Pour les autres, la commande est
   copiée au moment du clic et le client n'a plus qu'à la coller — c'est la
   seule façon honnête de faire, aucune adresse ne permet de pré-remplir. */
export const MESSAGERIES = {
  whatsapp: {
    nom: "WhatsApp", couleur: "#25D366", encre: "#0B0A08", prerempli: true,
    lien: (contact, message) =>
      `https://wa.me/${contact.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`,
  },
  telegram: {
    nom: "Telegram", couleur: "#29A9EB", encre: "#04121C", prerempli: false,
    lien: (contact) => `https://t.me/${contact.replace(/^@/, "")}`,
  },
  signal: {
    nom: "Signal", couleur: "#3A76F0", encre: "#FFFFFF", prerempli: false,
    lien: (contact) => `https://signal.me/#p/+${contact.replace(/[^0-9]/g, "")}`,
  },
  snapchat: {
    nom: "Snapchat", couleur: "#FFFC00", encre: "#1A1A00", prerempli: false,
    lien: (contact) => `https://www.snapchat.com/add/${contact.replace(/^@/, "")}`,
  },
};

export const MESSAGERIE = MESSAGERIES[BOUTIQUE.messagerie] || MESSAGERIES.whatsapp;
// « contact » est le champ actuel ; « whatsapp » reste lu pour les boutiques
// écrites avant ce choix.
export const CONTACT = String(BOUTIQUE.contact || BOUTIQUE.whatsapp || "").trim();

export function texteCommande(items) {
  const lignes = items.map(
    (i) => `• ${i.nom} — ${i.unite} (réf. ${i.ref}) x${i.qty} — ${euros(i.prix * i.qty)}`
  );
  return `${BOUTIQUE.accroche}\n\n${lignes.join("\n")}\n\nTotal : ${euros(cartTotal(items))}`;
}

export function lienCommande(items) {
  return MESSAGERIE.lien(CONTACT, texteCommande(items));
}

// Copie déclenchée par le clic lui-même : la navigation continue normalement.
export function copierAvantDePartir(texte) {
  try {
    if (navigator.clipboard) navigator.clipboard.writeText(texte).catch(() => {});
  } catch (e) {}
}

/* ─────────────────────────── LECTURE DES VIDÉOS ───────────────────────────
   Une vidéo qui ne se charge pas ne doit pas laisser un rectangle noir muet :
   dans neuf cas sur dix le fichier n'a simplement pas été déposé dans
   public/videos, et personne ne peut le deviner. Le lecteur le dit. */
export function Video({ source, nom, className, style }) {
  const [erreur, setErreur] = useState(false);

  if (erreur) {
    return (
      <div
        className={"rounded-xl p-5 text-center " + (className || "")}
        style={{ background: CARTE, border: `1px solid ${bordure}`, maxWidth: 380, ...style }}
      >
        <p style={{ fontFamily: TITRE, fontSize: 17, color: texte }}>VIDÉO INDISPONIBLE</p>
        <p className="text-[12.5px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.55 }}>
          Le fichier <b style={{ color: texte, wordBreak: "break-all" }}>{source}</b> n'a pas pu être lu.
        </p>
        <p className="text-[11.5px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.5 }}>
          Vérifie qu'il se trouve bien dans <b style={{ color: texte }}>public/videos</b>, au format
          <b style={{ color: texte }}> MP4</b>, et que son nom s'écrit exactement pareil — sans accent ni espace.
        </p>
      </div>
    );
  }

  return (
    <video
      src={source}
      controls
      autoPlay
      playsInline
      preload="metadata"
      onError={() => setErreur(true)}
      title={nom}
      className={className}
      style={style}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

/* ─────────────────────────── petits éléments ─────────────────────────── */

export function Etiquette({ children, couleur = vert }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded"
      style={{ background: couleur, color: "#0B0B0B", fontFamily: CORPS }}
    >
      {children}
    </span>
  );
}

export function Prix({ valeur, taille = 18 }) {
  return (
    <span
      style={{
        fontFamily: TITRE, fontSize: taille, letterSpacing: ".5px",
        backgroundImage: `linear-gradient(90deg, ${jaune}, ${vert})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}
    >
      {euros(valeur)}
    </span>
  );
}

// Grande barre rose en haut de chaque écran : retour + nom de la section.
export function BarreSection({ titre, onRetour }) {
  return (
    <div
      className="mx-3 mt-3 rounded-2xl px-3 py-3 flex items-center gap-2"
      style={{ backgroundImage: DEGRADE, boxShadow: `0 6px 22px ${rose}44` }}
    >
      {onRetour ? (
        <button onClick={onRetour} aria-label="Revenir en arrière" className="active:scale-90 transition-transform">
          <ChevronLeft size={22} color="#fff" />
        </button>
      ) : (
        <span className="w-[22px]" />
      )}
      <p className="flex-1 text-right pr-1" style={{ fontFamily: TITRE, fontSize: 17, color: "#fff", letterSpacing: ".5px" }}>
        {titre}
      </p>
    </div>
  );
}

/* ─────────────────────────── écrans ─────────────────────────── */

// « vedettesSeules » sert à la présentation en liste : elle réutilise le haut
// de l'accueil — les carrés en vedette — puis affiche sa propre grille.

/* ══════════ REMONTER EN HAUT ══════════
   Une famille de cent articles fait une page très longue. Arrivé en bas, il
   faut pouvoir revenir d'un geste : sans ça, on fait défiler à l'envers pendant
   dix secondes, ou on abandonne.

   Le bouton n'apparaît qu'une fois qu'on a vraiment descendu — plus tôt, il ne
   servirait qu'à encombrer. Il se place au-dessus de la barre du bas, du côté
   du pouce. */
// ★ Pas d'écoute du défilement, volontairement.
// Une première version n'affichait le bouton qu'une fois descendu. Elle
// dépendait des événements de défilement — et il existe des navigateurs qui
// n'en émettent aucun alors que la page défile pour de bon. Le bouton restait
// alors introuvable, sans qu'on comprenne pourquoi.
//
// La condition est donc devenue une donnée, pas un événement : on affiche le
// bouton quand la liste est longue. C'est vérifiable, ça ne dépend d'aucun
// navigateur, et ça répond à la vraie question — « cette page est-elle longue
// au point qu'on veuille en remonter ? »
export function RemonterEnHaut({ articles = 0, seuil = 12 }) {
  if (articles < seuil) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Revenir en haut de la page"
      className="fixed z-40 rounded-full flex items-center justify-center active:scale-90 transition-transform"
      style={{
        right: 14, bottom: 92, width: 46, height: 46,
        background: VOILE("#141018", "E6"), border: `1.5px solid ${jaune}`,
        boxShadow: `0 6px 20px #000000AA`, color: jaune,
        fontFamily: CORPS, fontSize: 19, lineHeight: 1,
      }}
    >
      ↑
    </button>
  );
}

/* ══════════ LES VEDETTES ══════════
   De petits carres noirs, quatre par ligne. Compacts par principe : le
   catalogue doit rester visible juste en dessous, sans faire defiler.
   Communes aux deux types — c'est la meme promesse faite au visiteur. */
export function Vedettes({ onProduit }) {
  if (!VEDETTES.length) return null;
  return (
    <div className="mx-3 mt-3 grid grid-cols-4 gap-2">
            {VEDETTES.map((p) => (
              <button
                key={p.cle || p.ref}
                onClick={() => onProduit(p.famille, p.gamme, p)}
                className="relative rounded-xl overflow-hidden text-left active:scale-95 transition-transform"
                style={{ background: "#000", border: `1px solid ${jaune}55` }}
              >
                <Photo
                  produit={p}
                  secours={SECOURS(p, p.famille)}
                  source={visuelProduit(p, p.famille.couleurs, p.famille.glyphe)}
                  alt={p.nom}
                  className="w-full block"
                  style={{ aspectRatio: "1 / 1", objectFit: AJUSTEMENT(p), background: "#000" }}
                />
                <Star
                  size={10}
                  color={jaune}
                  fill={jaune}
                  className="absolute top-1 right-1"
                  style={{ filter: "drop-shadow(0 0 2px #000)" }}
                />
                <div className="px-1 pb-1 pt-0.5" style={{ background: "#000" }}>
                  <p className="truncate" style={{ fontFamily: CORPS, fontSize: 9.5, fontWeight: 700, color: texte }}>
                    {p.nom}
                  </p>
                  <p className="truncate" style={{ fontFamily: CORPS, fontSize: 9, color: jaune }}>
                    {euros(p.prix)}
                  </p>
                </div>
              </button>
            ))}
    </div>
  );
}
