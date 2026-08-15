import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Search, ShoppingCart, Plus, Minus, X,
  Home, Info, Link2, Star, MessageCircle, Maximize2, PlayCircle,
} from "lucide-react";
import { BOUTIQUE as BOUTIQUE_PUBLIEE, COULEURS as COULEURS_PUBLIEES } from "./config.js";
import { FAMILLES as FAMILLES_PUBLIEES } from "./catalogue.js";
import { visuelFamille, visuelProduit } from "./visuels.js";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');`;

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

const APERCU = brouillon();
const BOUTIQUE = APERCU ? { ...BOUTIQUE_PUBLIEE, ...APERCU.BOUTIQUE } : BOUTIQUE_PUBLIEE;
const COULEURS = APERCU ? { ...COULEURS_PUBLIEES, ...APERCU.COULEURS } : COULEURS_PUBLIEES;
const FAMILLES = APERCU ? APERCU.FAMILLES : FAMILLES_PUBLIEES;

// Une famille peut être une galerie de vidéos au lieu d'un rayon de produits.
// Elle se place où on veut dans la liste, et rien ne s'y achète : ni prix, ni
// panier. C'est le seul champ qui distingue les deux.
const EST_VIDEOS = (f) => f.type === "videos";

// Un produit peut porter plusieurs photos. « images » est la liste complète,
// « image » la première — gardée pour les catalogues écrits avant la galerie.
const GALERIE = (p) =>
  Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);

const TOUS_PRODUITS = FAMILLES.filter((f) => !EST_VIDEOS(f)).flatMap((f) =>
  f.gammes.flatMap((g) => g.produits.map((p) => ({ ...p, famille: f, gamme: g })))
);
const SELECTION_CHEF = TOUS_PRODUITS.filter((p) => p.chef);

// Les produits mis en vedette occupent le haut de l'accueil, en petits carrés
// noirs, quatre par ligne. Volontairement compacts : le catalogue doit rester
// visible juste dessous, sans faire défiler.
const VEDETTES = TOUS_PRODUITS.filter((p) => p.vedette).slice(0, 8);

// Deux façons de présenter le même catalogue :
//   « familles » : on descend famille → gamme → produit
//   « liste »    : tout sur une page, avec recherche et pastilles de catégories
// C'est un réglage, pas un moteur séparé : les deux profitent des mêmes
// nouveautés, et une boutique peut changer d'avis sans rien perdre.
// Le dessin de secours d un produit : le meme visuel, sans sa photo.
const SECOURS = (p, famille) => visuelProduit({ ...p, image: "", images: [] }, famille.couleurs, famille.glyphe);

const PRESENTATION = BOUTIQUE.presentation === "liste" ? "liste" : "familles";

// Cadrage des photos. « carre » remplit le cadre quitte à couper les bords,
// « entier » montre toute l'image quitte à laisser des bandes. Jamais de
// déformation dans un cas comme dans l'autre.
const AJUSTEMENT = (p) =>
  ((p && p.cadrage) || (BOUTIQUE.imageEntiere ? "entier" : "carre")) === "entier"
    ? "contain"
    : "cover";

// Forme du cadre réservé aux photos. Sans elle, une photo en hauteur resterait
// petite au milieu d'un carré : c'est la place disponible qu'il faut changer,
// pas seulement la façon de remplir.
const PROPORTIONS = { carre: "1 / 1", portrait: "3 / 4", paysage: "4 / 3", libre: "" };
const PROPORTION_PHOTO = PROPORTIONS[BOUTIQUE.formatPhoto] ?? "1 / 1";

// « libre » : aucune proportion imposée, la carte prend la hauteur de l'image,
// qui s'affiche donc entière et sans bande. Sinon le cadre garde sa forme.
const STYLE_PHOTO = (p) =>
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
function Photo({ produit, source, alt, style, className, secours }) {
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

const { fond, fondCarte, bordure, texte, texteDoux, rose, violet, vert, jaune, cyan } = COULEURS;

// Image de fond facultative, posée derrière toute la boutique. Un voile sombre
// est ajouté par-dessus pour que les textes restent lisibles, et la colonne
// centrale devient légèrement transparente pour laisser voir l'image.
const FOND_IMAGE = (BOUTIQUE.fondImage || "").trim();
// Quand une image de fond est posée, la colonne et les espaces deviennent
// transparents : seuls les blocs de contenu gardent un fond, légèrement
// translucide, pour que l'image se voie partout entre les éléments.
const COLONNE = FOND_IMAGE ? "transparent" : COULEURS.fond;
const CARTE = FOND_IMAGE ? COULEURS.fondCarte + "D9" : COULEURS.fondCarte;
const VOILE = (couleur, alpha) => (FOND_IMAGE ? couleur + alpha : couleur);

const FOND_PAGE = FOND_IMAGE
  ? {
      backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.78)), url("${FOND_IMAGE}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }
  : { background: `radial-gradient(circle at 50% 0%, ${COULEURS.halo || "#17240F"} 0%, #060505 62%)` };
const DEGRADE = `linear-gradient(90deg, ${rose}, ${violet})`;
const TITRE = "'Anton', 'Arial Narrow', Impact, sans-serif";
const CORPS = "'Inter', -apple-system, 'Segoe UI', sans-serif";

// Ouverture facultative, jouée une fois par visite. Une vidéo si elle est
// fournie, sinon un simple titre animé — qui ne coûte rien à charger.
const INTRO = {
  active: BOUTIQUE.introActive === true,
  texte: (BOUTIQUE.introTexte || "").trim() || `BIENVENUE — ${(BOUTIQUE.nom || "").toUpperCase()}`,
  video: (BOUTIQUE.introVideo || "").trim(),
  duree: Math.min(15, Math.max(1, Number(BOUTIQUE.introDuree) || 3)),
};

const ANIMATIONS = `
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

const telegram = window.Telegram && window.Telegram.WebApp;
if (telegram) {
  telegram.ready();
  telegram.expand();
}

const euros = (n) => n.toFixed(2).replace(".", ",") + " €";

function cartTotal(items) {
  return items.reduce((s, i) => s + i.prix * i.qty, 0);
}

/* ─────────────────────── où arrivent les commandes ───────────────────────
   Le propriétaire choisit son application. Une seule accepte aujourd'hui un
   message déjà écrit dans le lien : WhatsApp. Pour les autres, la commande est
   copiée au moment du clic et le client n'a plus qu'à la coller — c'est la
   seule façon honnête de faire, aucune adresse ne permet de pré-remplir. */
const MESSAGERIES = {
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

const MESSAGERIE = MESSAGERIES[BOUTIQUE.messagerie] || MESSAGERIES.whatsapp;
// « contact » est le champ actuel ; « whatsapp » reste lu pour les boutiques
// écrites avant ce choix.
const CONTACT = String(BOUTIQUE.contact || BOUTIQUE.whatsapp || "").trim();

function texteCommande(items) {
  const lignes = items.map(
    (i) => `• ${i.nom} — ${i.unite} (réf. ${i.ref}) x${i.qty} — ${euros(i.prix * i.qty)}`
  );
  return `${BOUTIQUE.accroche}\n\n${lignes.join("\n")}\n\nTotal : ${euros(cartTotal(items))}`;
}

function lienCommande(items) {
  return MESSAGERIE.lien(CONTACT, texteCommande(items));
}

// Copie déclenchée par le clic lui-même : la navigation continue normalement.
function copierAvantDePartir(texte) {
  try {
    if (navigator.clipboard) navigator.clipboard.writeText(texte).catch(() => {});
  } catch (e) {}
}

/* ─────────────────────────── LECTURE DES VIDÉOS ───────────────────────────
   Une vidéo qui ne se charge pas ne doit pas laisser un rectangle noir muet :
   dans neuf cas sur dix le fichier n'a simplement pas été déposé dans
   public/videos, et personne ne peut le deviner. Le lecteur le dit. */
function Video({ source, nom, className, style }) {
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

function Etiquette({ children, couleur = vert }) {
  return (
    <span
      className="inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded"
      style={{ background: couleur, color: "#0B0B0B", fontFamily: CORPS }}
    >
      {children}
    </span>
  );
}

function Prix({ valeur, taille = 18 }) {
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
function BarreSection({ titre, onRetour }) {
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
function EcranAccueil({ onFamille, onProduit, vedettesSeules }) {
  // Le bloc « mis en avant » disparaît complètement si son titre est vide dans
  // config.js, ou si aucun produit n'est marqué en avant.
  const montrerEnAvant = !vedettesSeules && !!(BOUTIQUE.enAvant || "").trim() && SELECTION_CHEF.length > 0;

  return (
    <>
      {/* Les vedettes : de petits carrés noirs, quatre par ligne. Compacts par
          principe — le catalogue doit rester visible juste en dessous. */}
      {VEDETTES.length > 0 && (
        <div className="mx-3 mt-3 grid grid-cols-4 gap-2">
          {VEDETTES.map((p) => (
            <button
              key={p.ref}
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
      )}
      {montrerEnAvant && (
        <div className="mx-3 mt-3">
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: VOILE("#0E0E0E", "D9"), border: `1px solid ${bordure}` }}
          >
            <Star size={18} color={jaune} />
            <p className="flex-1 text-center" style={{ fontFamily: TITRE, fontSize: 15, color: texte, letterSpacing: "1px" }}>
              {BOUTIQUE.enAvant}
            </p>
            <span style={{ color: texteDoux, fontSize: 12 }}>▾</span>
          </div>

          <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {SELECTION_CHEF.map((p) => (
              <button
                key={p.ref}
                onClick={() => onProduit(p.famille, p.gamme, p)}
                className="flex-shrink-0 rounded-xl px-3 py-2 text-left active:scale-95 transition-transform"
                style={{ background: CARTE, border: `1px solid ${bordure}`, minWidth: 148 }}
              >
                <p className="text-[12px] font-bold truncate" style={{ color: texte, fontFamily: CORPS }}>{p.nom}</p>
                <Prix valeur={p.prix} taille={15} />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 px-3 mt-4" hidden={vedettesSeules}>
        {(vedettesSeules ? [] : FAMILLES).map((f) => (
          <button
            key={f.id}
            onClick={() => onFamille(f)}
            className="relative rounded-2xl overflow-hidden active:scale-[0.98] transition-transform"
            style={{ border: `2px solid ${f.couleurs[0]}`, boxShadow: `0 0 24px ${f.couleurs[0]}33` }}
          >
            <img src={visuelFamille(f)} alt={f.nom} className="w-full aspect-[760/340] object-cover block" />
            <span className="absolute top-2 right-2 text-[22px]">{f.emoji}</span>
            {EST_VIDEOS(f) && (
              <span
                className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg"
                style={{ background: "#000000A8", border: `1px solid ${cyan}` }}
              >
                <PlayCircle size={13} color={cyan} />
                <span style={{ fontFamily: CORPS, fontSize: 9.5, fontWeight: 800, color: cyan, letterSpacing: ".1em" }}>
                  VIDÉOS
                </span>
              </span>
            )}
            {/* Le titre est écrit ici, pas dans l'image : il reste lisible même
                si la photo change. */}
            <span
              className="absolute inset-x-0 bottom-0 pb-4 pt-10 px-3 flex items-end justify-center"
              style={{ backgroundImage: "linear-gradient(0deg, #000000B0 15%, transparent 100%)" }}
            >
              <span
                style={{
                  fontFamily: TITRE, color: jaune, letterSpacing: "1px", lineHeight: 1,
                  fontSize: f.nom.length > 13 ? 26 : f.nom.length > 9 ? 32 : 38,
                  WebkitTextStroke: "3px #160B22", paintOrder: "stroke",
                }}
              >
                {f.nom}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ══════════ PRÉSENTATION « LISTE » ══════════
   Le même catalogue, montré autrement : tout sur une page, avec une barre de
   recherche et des pastilles de catégories. Rien à redescendre, rien à ouvrir.
   Convient aux boutiques dont le stock se parcourt d'un coup d'œil.

   C'est un réglage, pas un autre moteur : les deux présentations lisent les
   mêmes données et profitent des mêmes nouveautés. */
function EcranListe({ onProduit, onFamille }) {
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState("tous");

  const galeries = FAMILLES.filter(EST_VIDEOS);
  const rayons = FAMILLES.filter((f) => !EST_VIDEOS(f));

  const produits = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return TOUS_PRODUITS
      .filter((p) => filtre === "tous" || p.famille.id === filtre)
      .filter((p) => !q || p.nom.toLowerCase().includes(q) || (p.gamme.nom || "").toLowerCase().includes(q));
  }, [filtre, recherche]);

  const pastille = (actif, cle, contenu, couleur) => (
    <button
      key={cle}
      onClick={() => setFiltre(cle)}
      className="flex-shrink-0 px-3 py-2 rounded-xl active:scale-95 transition-transform"
      style={{
        background: actif ? undefined : CARTE,
        backgroundImage: actif ? DEGRADE : undefined,
        border: `1.5px solid ${actif ? "transparent" : couleur || bordure}`,
        boxShadow: actif ? `0 4px 16px ${rose}44` : "none",
        fontFamily: CORPS, fontSize: 12, fontWeight: 700,
        color: actif ? "#fff" : texte, whiteSpace: "nowrap",
      }}
    >
      {contenu}
    </button>
  );

  return (
    <>
      <div className="px-3 mt-3">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{ background: VOILE("#1C1C1C", "D9"), border: `1px solid ${bordure}` }}>
          <Search size={16} color={texteDoux} />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Chercher un produit…"
            className="flex-1 bg-transparent outline-none"
            style={{ color: texte, fontFamily: CORPS, fontSize: 14 }}
          />
          {recherche && (
            <button onClick={() => setRecherche("")} aria-label="Effacer">
              <X size={15} color={texteDoux} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 mt-3 pb-1" style={{ scrollbarWidth: "none" }}>
        {pastille(filtre === "tous", "tous", `TOUT · ${TOUS_PRODUITS.length}`)}
        {rayons.map((f) => pastille(filtre === f.id, f.id,
          <span>{f.emoji} {f.nom}</span>, f.couleurs[0]))}
        {galeries.map((f) => (
          <button
            key={f.id}
            onClick={() => onFamille(f)}
            className="flex-shrink-0 px-3 py-2 rounded-xl active:scale-95 transition-transform flex items-center gap-1.5"
            style={{ background: CARTE, border: `1.5px solid ${cyan}`, fontFamily: CORPS, fontSize: 12, fontWeight: 700, color: cyan, whiteSpace: "nowrap" }}
          >
            <PlayCircle size={13} color={cyan} /> {f.nom}
          </button>
        ))}
      </div>

      {produits.length === 0 ? (
        <p className="text-center px-6 mt-8 text-[13px]" style={{ color: texteDoux, fontFamily: CORPS }}>
          Rien ne correspond à cette recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3 mt-3">
          {produits.map((p) => (
            <button
              key={p.ref}
              onClick={() => onProduit(p.famille, p.gamme, p)}
              className="relative rounded-xl overflow-hidden text-left active:scale-[0.97] transition-transform"
              style={{ background: CARTE, border: `2px solid ${p.famille.couleurs[0]}` }}
            >
              <div className="relative">
                <Photo
                  produit={p}
                  secours={SECOURS(p, p.famille)}
                  source={visuelProduit(p, p.famille.couleurs, p.famille.glyphe)}
                  alt={p.nom}
                  className="w-full block"
                  style={{ ...STYLE_PHOTO(p), opacity: p.dispo ? 1 : 0.4 }}
                />
                <span className="absolute top-1.5 right-1.5">
                  {p.dispo ? <Etiquette couleur={cyan}>{p.gamme.etiquette}</Etiquette> : <Etiquette couleur="#888">Épuisé</Etiquette>}
                </span>
              </div>
              <div className="p-2.5">
                <p className="text-[12.5px] font-bold leading-tight" style={{ color: texte, fontFamily: CORPS }}>{p.nom}</p>
                <p className="text-[10px] mt-0.5" style={{ color: texteDoux, fontFamily: CORPS }}>{p.unite}</p>
                <div className="mt-1"><Prix valeur={p.prix} taille={16} /></div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function EcranGammes({ famille, onGamme, onRetour }) {
  return (
    <>
      <BarreSection titre={`${famille.emoji} ${famille.nom}`} onRetour={onRetour} />
      <div className="flex flex-col gap-3 px-3 mt-4">
        {famille.gammes.map((g) => (
          <button
            key={g.id}
            onClick={() => onGamme(g)}
            className="rounded-2xl px-4 py-4 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            style={{ backgroundImage: `linear-gradient(100deg, ${violet}, ${rose})`, boxShadow: `0 6px 22px ${violet}44` }}
          >
            <div className="flex-1 min-w-0">
              <p style={{ fontFamily: TITRE, fontSize: 21, color: "#fff", letterSpacing: ".5px" }}>
                {g.nom} <span style={{ fontSize: 13, color: cyan }}>{g.etiquette}</span>
              </p>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: "#FFFFFFCC", fontFamily: CORPS }}>
                {g.sousTitre}
              </p>
            </div>
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "#2E5BFF" }}
            >
              <ChevronRight size={18} color="#fff" />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

function EcranProduits({ famille, gamme, onProduit, onRetour }) {
  const [recherche, setRecherche] = useState("");
  const [gammeFiltre, setGammeFiltre] = useState(gamme.id);

  const produits = useMemo(() => {
    const source =
      gammeFiltre === "toutes"
        ? famille.gammes.flatMap((g) => g.produits.map((p) => ({ ...p, gamme: g })))
        : famille.gammes.find((g) => g.id === gammeFiltre).produits.map((p) => ({ ...p, gamme: famille.gammes.find((g) => g.id === gammeFiltre) }));
    const q = recherche.trim().toLowerCase();
    return q ? source.filter((p) => p.nom.toLowerCase().includes(q)) : source;
  }, [famille, gammeFiltre, recherche]);

  return (
    <>
      <BarreSection titre={gammeFiltre === "toutes" ? famille.nom : famille.gammes.find((g) => g.id === gammeFiltre).nom} onRetour={onRetour} />

      <div className="mx-3 mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: "#1C1C1C", border: `1px solid ${bordure}` }}>
        <Search size={16} color={texteDoux} />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un produit..."
          className="flex-1 bg-transparent outline-none text-[13px]"
          style={{ color: texte, fontFamily: CORPS }}
        />
        {recherche && (
          <button onClick={() => setRecherche("")} aria-label="Effacer">
            <X size={14} color={texteDoux} />
          </button>
        )}
      </div>

      <div className="mx-3 mt-2">
        <select
          value={gammeFiltre}
          onChange={(e) => setGammeFiltre(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none appearance-none"
          style={{ background: VOILE("#1C1C1C", "D9"), border: `1px solid ${bordure}`, color: texte, fontFamily: CORPS }}
        >
          <option value="toutes">🧑‍🌾 — Toutes les gammes</option>
          {famille.gammes.map((g) => (
            <option key={g.id} value={g.id}>{g.nom}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 mt-4">
        {produits.map((p) => (
          <button
            key={p.ref}
            onClick={() => onProduit(famille, p.gamme, p)}
            className="relative rounded-xl overflow-hidden text-left active:scale-[0.97] transition-transform"
            style={{ background: CARTE, border: `2px solid ${violet}` }}
          >
            <div className="relative">
              <Photo
                produit={p}
                secours={SECOURS(p, famille)}
                source={visuelProduit(p, famille.couleurs, famille.glyphe)}
                alt={p.nom}
                className="w-full block"
                style={{ ...STYLE_PHOTO(p), opacity: p.dispo ? 1 : 0.4 }}
              />
              <span className="absolute top-1.5 right-1.5">
                {p.dispo ? <Etiquette couleur={cyan}>{p.gamme.etiquette}</Etiquette> : <Etiquette couleur="#888">Épuisé</Etiquette>}
              </span>
            </div>
            <div className="p-2.5">
              <p className="text-[12.5px] font-bold leading-tight" style={{ color: texte, fontFamily: CORPS }}>{p.nom}</p>
              <p className="text-[10px] mt-0.5" style={{ color: texteDoux, fontFamily: CORPS }}>{p.unite}</p>
              <div className="mt-1"><Prix valeur={p.prix} taille={16} /></div>
            </div>
          </button>
        ))}
      </div>

      {produits.length === 0 && (
        <p className="text-center text-[13px] mt-8 px-6" style={{ color: texteDoux }}>
          Aucun produit ne correspond à ta recherche.
        </p>
      )}
    </>
  );
}

function EcranFiche({ famille, gamme, produit, onRetour, onAjouter, onOuvrir, onVideo }) {
  const [qte, setQte] = useState(1);
  const image = visuelProduit(produit, famille.couleurs, famille.glyphe);
  const photos = GALERIE(produit);
  const aPlus = photos.length > 1 || !!(produit.description || "").trim() || !!(produit.video || "").trim();

  return (
    <>
      <BarreSection titre={produit.nom} onRetour={onRetour} />

      <div className="px-3 mt-3">
        <button
          onClick={() => onOuvrir(produit)}
          className="relative w-full rounded-2xl overflow-hidden block"
          style={{ border: `2px solid ${famille.couleurs[0]}`, boxShadow: `0 0 24px ${famille.couleurs[0]}33` }}
        >
          <Photo produit={produit} secours={SECOURS(produit, famille)} source={image} alt={produit.nom} className="w-full block" />
          <span
            className="absolute bottom-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{ background: "#000000AA", color: texte, border: `1px solid ${bordure}` }}
          >
            <Maximize2 size={12} /> {aPlus ? "Tout voir" : "Agrandir"}
          </span>
          {photos.length > 1 && (
            <span
              className="absolute bottom-3 left-3 px-2.5 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ background: "#000000AA", color: cyan, border: `1px solid ${cyan}`, fontFamily: CORPS }}
            >
              {photos.length} photos
            </span>
          )}
          {!produit.dispo && (
            <span className="absolute top-3 left-3"><Etiquette couleur="#888">Épuisé</Etiquette></span>
          )}
        </button>

        {photos.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {photos.map((src, n) => (
              <button
                key={n}
                onClick={() => onOuvrir(produit, n)}
                className="flex-shrink-0 rounded-lg overflow-hidden active:scale-95 transition-transform"
                style={{ border: `1px solid ${bordure}` }}
                aria-label={`Photo ${n + 1}`}
              >
                <img src={src} alt="" className="w-16 h-16 object-cover block" />
              </button>
            ))}
          </div>
        )}

        {produit.video && (
          <button
            onClick={() => onVideo(produit)}
            className="w-full mt-3 py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: CARTE, border: `2px solid ${cyan}`, boxShadow: `0 0 16px ${cyan}33` }}
          >
            <PlayCircle size={20} color={cyan} />
            <span style={{ fontFamily: TITRE, fontSize: 16, color: cyan, letterSpacing: ".5px" }}>
              VOIR LA VIDÉO
            </span>
          </button>
        )}
      </div>

      <div className="px-4 mt-4">
        <p style={{ fontFamily: TITRE, fontSize: 28, color: texte, lineHeight: 1.1 }}>{produit.nom}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Etiquette couleur={vert}>{famille.nom}</Etiquette>
          <Etiquette couleur={cyan}>{gamme.nom}</Etiquette>
        </div>

        <p className="text-[14px] mt-4" style={{ color: "#D6E8CC", fontFamily: CORPS, lineHeight: 1.6 }}>
          {produit.description}
        </p>

        <div className="mt-5 rounded-2xl p-4" style={{ background: CARTE, border: `1px solid ${bordure}` }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: texteDoux, fontFamily: CORPS }}>Prix</p>
              <Prix valeur={produit.prix} taille={32} />
              <p className="text-[12px]" style={{ color: texteDoux, fontFamily: CORPS }}>{produit.unite}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider mb-1 text-right" style={{ color: texteDoux, fontFamily: CORPS }}>Quantité</p>
              <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: VOILE(fond, "CC"), border: `1px solid ${bordure}` }}>
                <button onClick={() => setQte((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90" aria-label="Moins">
                  <Minus size={14} color={texte} />
                </button>
                <span className="w-7 text-center font-bold" style={{ color: texte, fontFamily: CORPS }}>{qte}</span>
                <button onClick={() => setQte((q) => q + 1)} className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90" aria-label="Plus">
                  <Plus size={14} color={texte} />
                </button>
              </div>
            </div>
          </div>

          {produit.dispo ? (
            <button
              onClick={() => onAjouter(produit, qte)}
              className="w-full mt-4 py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ backgroundImage: DEGRADE, color: "#fff", fontFamily: TITRE, fontSize: 17, letterSpacing: ".5px" }}
            >
              <Plus size={18} /> AJOUTER AU PANIER · {euros(produit.prix * qte)}
            </button>
          ) : (
            <p className="w-full mt-4 py-3.5 rounded-xl text-center text-[13px] font-bold"
              style={{ background: VOILE("#262626", "D9"), color: texteDoux, border: `1px solid ${bordure}` }}>
              Bientôt de retour
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function EcranInfo() {
  return (
    <>
      <BarreSection titre="INFOS PRATIQUES" />
      <div className="px-3 mt-4 flex flex-col gap-3">
        {BOUTIQUE.info.map((bloc) => (
          <div key={bloc.titre} className="rounded-2xl p-4" style={{ background: CARTE, border: `1px solid ${bordure}` }}>
            <p style={{ fontFamily: TITRE, fontSize: 17, color: jaune }}>{bloc.titre.toUpperCase()}</p>
            <p className="text-[14px] mt-1" style={{ color: "#D6E8CC", fontFamily: CORPS }}>{bloc.texte}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function EcranLiens() {
  const liens = BOUTIQUE.liens.filter((l) => l.url);
  return (
    <>
      <BarreSection titre="LIENS" />
      <div className="px-3 mt-4 flex flex-col gap-3">
        {liens.length === 0 ? (
          <p className="text-center text-[13px] px-6 mt-4" style={{ color: texteDoux, fontFamily: CORPS }}>
            Aucun lien pour le moment. Ajoute-les dans <span style={{ color: jaune }}>src/config.js</span>.
          </p>
        ) : (
          liens.map((l) => (
            <a
              key={l.titre}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl px-4 py-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
              style={{ backgroundImage: `linear-gradient(100deg, ${violet}, ${rose})` }}
            >
              <Link2 size={18} color="#fff" />
              <span className="flex-1" style={{ fontFamily: TITRE, fontSize: 17, color: "#fff" }}>{l.titre}</span>
              <ChevronRight size={18} color="#fff" />
            </a>
          ))
        )}
      </div>
    </>
  );
}

function EcranAvis() {
  return (
    <>
      <BarreSection titre="AVIS" />
      <div className="px-3 mt-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: CARTE, border: `1px solid ${bordure}` }}>
          <Star size={28} color={jaune} className="mx-auto" />
          <p className="mt-3" style={{ fontFamily: TITRE, fontSize: 19, color: texte }}>PAS ENCORE D'AVIS</p>
          <p className="text-[13px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.6 }}>
            Les avis affichés ici seront de vrais avis de clients. Rien n'est inventé.
          </p>
          <a
            href={MESSAGERIE.lien(CONTACT, "Bonjour, je souhaite laisser un avis sur ma commande :")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (!MESSAGERIE.prerempli) copierAvantDePartir("Bonjour, je souhaite laisser un avis sur ma commande :"); }}
            className="inline-flex items-center gap-2 mt-5 px-5 py-3 rounded-xl active:scale-95 transition-transform"
            style={{ background: MESSAGERIE.couleur, color: MESSAGERIE.encre, fontFamily: TITRE, fontSize: 15 }}
          >
            <MessageCircle size={16} /> DONNER MON AVIS
          </a>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────── application ─────────────────────────── */

// ══════════ OUVERTURE DE LA BOUTIQUE ══════════
// Jouée une fois par visite. La vidéo est muette : tous les navigateurs
// refusent de démarrer un son tout seul, sans quoi rien ne se lancerait.
function Intro({ onFini }) {
  const [sort, setSort] = useState(false);
  const dejaFait = useRef(false);

  const fermer = () => {
    if (dejaFait.current) return;
    dejaFait.current = true;
    setSort(true);
    setTimeout(onFini, 420);
  };

  // Filet de sécurité : même si la vidéo ne démarre pas, l'intro s'efface.
  useEffect(() => {
    const t = setTimeout(fermer, INTRO.duree * 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 cursor-pointer"
      style={{ background: "#050505", animation: sort ? "atelier-sortie .4s ease forwards" : "none" }}
      onClick={fermer}
    >
      {INTRO.video ? (
        <video
          src={INTRO.video}
          autoPlay
          muted
          playsInline
          onEnded={fermer}
          onError={fermer}
          className="max-w-full max-h-[76vh] rounded-2xl"
          style={{ border: `2px solid ${rose}`, boxShadow: `0 0 40px ${rose}55` }}
        />
      ) : (
        <>
          <p
            className="atelier-anime text-center"
            style={{
              fontFamily: TITRE, fontSize: "clamp(30px, 11vw, 62px)", lineHeight: 1.02,
              backgroundImage: DEGRADE, WebkitBackgroundClip: "text", backgroundClip: "text",
              color: "transparent",
              animation: "atelier-apparition .8s cubic-bezier(.2,.9,.2,1) both, atelier-lueur 2.4s ease-in-out .8s infinite",
            }}
          >
            {INTRO.texte}
          </p>
          <span
            className="atelier-anime block mt-5 rounded-full"
            style={{ height: 4, backgroundImage: DEGRADE, animation: "atelier-trait 1.1s ease .35s both" }}
          />
        </>
      )}
      <p
        className="absolute bottom-7 text-[11px] uppercase tracking-[.2em]"
        style={{ color: texteDoux, fontFamily: CORPS }}
      >
        Tape pour entrer
      </p>
    </div>
  );
}

// ══════════ VISIONNEUSE DU PRODUIT ══════════
// Un appui sur la photo ouvre tout ce que le produit contient : ses photos,
// l'une après l'autre, son descriptif, et sa vidéo s'il en a une. Chaque partie
// n'apparaît que si elle existe.
function Visionneuse({ produit, famille, depart = 0, onFermer }) {
  const [i, setI] = useState(depart);
  const [surVideo, setSurVideo] = useState(false);
  const doigtX = useRef(null);

  const photos = GALERIE(produit);
  const affichees = photos.length ? photos : [visuelProduit(produit, famille.couleurs, famille.glyphe)];
  const plusieurs = affichees.length > 1;
  const aVideo = !!(produit.video || "").trim();

  const suivante = () => setI((n) => (n + 1) % affichees.length);
  const precedente = () => setI((n) => (n - 1 + affichees.length) % affichees.length);

  // Clavier sur ordinateur, glissement du doigt sur téléphone.
  useEffect(() => {
    const touche = (e) => {
      if (e.key === "Escape") onFermer();
      else if (e.key === "ArrowRight" && plusieurs) suivante();
      else if (e.key === "ArrowLeft" && plusieurs) precedente();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [plusieurs, affichees.length]);

  const debutGlisse = (e) => { doigtX.current = e.touches[0].clientX; };
  const finGlisse = (e) => {
    if (doigtX.current === null || !plusieurs || surVideo) return;
    const ecart = e.changedTouches[0].clientX - doigtX.current;
    if (Math.abs(ecart) > 45) (ecart < 0 ? suivante : precedente)();
    doigtX.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,.97)" }}>
      {/* barre du haut */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
        <p className="flex-1 truncate" style={{ fontFamily: TITRE, fontSize: 18, color: texte }}>
          {produit.nom}
        </p>
        {plusieurs && !surVideo && (
          <span className="px-2 py-1 rounded-lg text-[11px] font-bold flex-shrink-0"
            style={{ background: "#1A1A1A", color: texteDoux, border: `1px solid ${bordure}`, fontFamily: CORPS }}>
            {i + 1} / {affichees.length}
          </span>
        )}
        <button onClick={onFermer} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "#1A1A1ACC", border: `1px solid ${bordure}` }} aria-label="Fermer">
          <X size={17} color={texte} />
        </button>
      </div>

      {/* la photo, ou la vidéo */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-3"
        onTouchStart={debutGlisse} onTouchEnd={finGlisse}>
        {surVideo ? (
          <Video source={produit.video} nom={produit.nom} className="max-w-full max-h-full rounded-xl" />
        ) : (
          <>
            <img src={affichees[i]} alt={produit.nom} className="max-w-full max-h-full object-contain rounded-xl" />
            {plusieurs && (
              <>
                <button onClick={precedente} aria-label="Photo précédente"
                  className="absolute left-4 w-11 h-11 rounded-full flex items-center justify-center active:scale-90"
                  style={{ background: "#000000B8", border: `1px solid ${bordure}` }}>
                  <ChevronLeft size={22} color={texte} />
                </button>
                <button onClick={suivante} aria-label="Photo suivante"
                  className="absolute right-4 w-11 h-11 rounded-full flex items-center justify-center active:scale-90"
                  style={{ background: "#000000B8", border: `1px solid ${bordure}` }}>
                  <ChevronRight size={22} color={texte} />
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* pastilles des photos */}
      {plusieurs && !surVideo && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-3 flex-shrink-0" style={{ scrollbarWidth: "none" }}>
          {affichees.map((src, n) => (
            <button key={n} onClick={() => setI(n)} className="flex-shrink-0 rounded-lg overflow-hidden"
              style={{ border: `2px solid ${n === i ? famille.couleurs[0] : bordure}`, opacity: n === i ? 1 : 0.6 }}>
              <img src={src} alt="" className="w-14 h-14 object-cover block" />
            </button>
          ))}
        </div>
      )}

      {/* descriptif et vidéo */}
      <div className="px-4 pt-3 pb-5 flex-shrink-0" style={{ maxHeight: "34vh", overflowY: "auto" }}>
        {aVideo && (
          <button onClick={() => setSurVideo((v) => !v)}
            className="w-full mb-3 py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: CARTE, border: `2px solid ${cyan}` }}>
            <PlayCircle size={18} color={cyan} />
            <span style={{ fontFamily: TITRE, fontSize: 15, color: cyan, letterSpacing: ".5px" }}>
              {surVideo ? "REVENIR AUX PHOTOS" : "VOIR LA VIDÉO"}
            </span>
          </button>
        )}
        {(produit.description || "").trim() ? (
          <p className="text-[13.5px]" style={{ color: "#D6E8CC", fontFamily: CORPS, lineHeight: 1.6 }}>
            {produit.description}
          </p>
        ) : (
          <p className="text-[12px] text-center" style={{ color: texteDoux, fontFamily: CORPS }}>
            {plusieurs ? "Fais glisser pour voir les autres photos." : "Tape sur la croix pour revenir."}
          </p>
        )}
      </div>
    </div>
  );
}

// ══════════ FAMILLE DE VIDÉOS ══════════
// Une galerie, pas un rayon : aucun prix, aucun panier. Un appui ouvre la
// vidéo en plein écran, exactement comme depuis une fiche produit.
function EcranVideos({ famille, onRetour, onVideo }) {
  return (
    <>
      <BarreSection titre={`${famille.emoji} ${famille.nom}`} onRetour={onRetour} />
      <div className="flex flex-col gap-5 px-3 mt-4">
        {famille.gammes.map((g) => (
          <div key={g.id}>
            {famille.gammes.length > 1 && (
              <p className="mb-2 px-1" style={{ fontFamily: TITRE, fontSize: 19, color: jaune, letterSpacing: ".5px" }}>
                {g.nom} {g.etiquette && <span style={{ fontSize: 12, color: cyan }}>{g.etiquette}</span>}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {g.produits.map((p) => {
                const affiche = visuelProduit(p, famille.couleurs, famille.glyphe);
                const jouable = !!(p.video || "").trim();
                return (
                  <button
                    key={p.ref}
                    onClick={() => jouable && onVideo(p)}
                    className="relative rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform"
                    style={{
                      border: `2px solid ${jouable ? famille.couleurs[0] : bordure}`,
                      boxShadow: jouable ? `0 0 18px ${famille.couleurs[0]}33` : "none",
                      opacity: jouable ? 1 : 0.55,
                    }}
                  >
                    <Photo produit={p} secours={SECOURS(p, famille)} source={affiche} alt={p.nom} className="w-full block" />
                    {jouable && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ background: "#000000A8", border: `2px solid ${cyan}`, boxShadow: `0 0 18px ${cyan}66` }}
                        >
                          <PlayCircle size={28} color={cyan} />
                        </span>
                      </span>
                    )}
                    <span
                      className="absolute inset-x-0 bottom-0 px-2.5 pb-2.5 pt-8"
                      style={{ backgroundImage: "linear-gradient(0deg, #000000C8 20%, transparent 100%)" }}
                    >
                      <span className="block text-[12px] font-bold leading-tight" style={{ color: texte, fontFamily: CORPS }}>
                        {p.nom}
                      </span>
                      {!jouable && (
                        <span className="block text-[10px] mt-0.5" style={{ color: texteDoux, fontFamily: CORPS }}>
                          vidéo à venir
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Boutique() {
  const [onglet, setOnglet] = useState("accueil");
  const [famille, setFamille] = useState(null);
  const [gamme, setGamme] = useState(null);
  const [produit, setProduit] = useState(null);
  const [panier, setPanier] = useState([]);
  const [panierOuvert, setPanierOuvert] = useState(false);
  const [vue, setVue] = useState(null);   // { produit, depart } : la visionneuse
  const [video, setVideo] = useState(null);

  // L'intro ne se rejoue pas à chaque page, seulement à chaque visite. En mode
  // aperçu elle se rejoue toujours, pour pouvoir la régler tranquillement.
  const [intro, setIntro] = useState(() => {
    if (!INTRO.active) return false;
    if (APERCU) return true;
    try {
      return !sessionStorage.getItem("intro-vue");
    } catch (e) {
      return true;
    }
  });

  const finirIntro = () => {
    setIntro(false);
    try { sessionStorage.setItem("intro-vue", "1"); } catch (e) {}
  };

  const nbArticles = panier.reduce((s, i) => s + i.qty, 0);

  const ajouter = (p, qte) => {
    setPanier((actuel) => {
      const existe = actuel.find((i) => i.ref === p.ref);
      if (existe) return actuel.map((i) => (i.ref === p.ref ? { ...i, qty: i.qty + qte } : i));
      return [...actuel, { ref: p.ref, nom: p.nom, unite: p.unite, prix: p.prix, qty: qte }];
    });
    setPanierOuvert(true);
  };

  const changerQte = (ref, delta) => {
    setPanier((actuel) =>
      actuel.map((i) => (i.ref === ref ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  };

  const allerProduit = (f, g, p) => {
    setOnglet("accueil"); setFamille(f); setGamme(g); setProduit(p);
  };

  const retour = () => {
    if (produit) setProduit(null);
    else if (gamme) setGamme(null);
    else if (famille) setFamille(null);
  };

  const accueil = () => {
    setOnglet("accueil"); setProduit(null); setGamme(null); setFamille(null);
  };

  // Chaque onglet peut être masqué depuis config.js. Accueil reste toujours là.
  const onglets = [
    { id: "accueil", nom: "ACCUEIL", Icone: Home, visible: true },
    { id: "info", nom: "INFOS", Icone: Info, visible: BOUTIQUE.afficherInfos !== false },
    { id: "liens", nom: "LIENS", Icone: Link2, visible: BOUTIQUE.afficherLiens !== false },
    { id: "avis", nom: "AVIS", Icone: Star, visible: BOUTIQUE.afficherAvis !== false },
  ].filter((o) => o.visible);

  return (
    <div className="min-h-screen w-full" style={FOND_PAGE}>
      <style>{FONTS}</style>
      <style>{ANIMATIONS}</style>
      {intro && <Intro onFini={finirIntro} />}

      <div
        className="relative w-full max-w-[560px] mx-auto min-h-screen"
        style={{ background: COLONNE }}
      >

        {/* bandeau et entête */}
        <div className="sticky top-0 z-20">
          {APERCU && (
            <div className="text-center py-1.5 px-3" style={{ background: "#FFC93C" }}>
              <p style={{ fontFamily: CORPS, fontSize: 11, fontWeight: 800, color: "#1A1200", letterSpacing: ".3px" }}>
                APERÇU — brouillon non publié, tes clients ne voient pas ceci
              </p>
            </div>
          )}
          <div className="text-center py-1.5" style={{ backgroundImage: DEGRADE }}>
            <p style={{ fontFamily: CORPS, fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: ".5px" }}>
              {BOUTIQUE.bandeau}
            </p>
          </div>
          <div
            className="flex items-center justify-between px-3 py-2"
            style={{ background: FOND_IMAGE ? "#0B0B0BB3" : "#0B0B0BEE", backdropFilter: "blur(8px)", borderBottom: `1px solid ${bordure}` }}
          >
            <span className="w-11" />
            <button onClick={accueil} className="flex flex-col items-center active:scale-95 transition-transform">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden"
                style={{ backgroundImage: DEGRADE, boxShadow: `0 0 18px ${rose}66` }}
              >
                {BOUTIQUE.logo ? (
                  <img
                    src={BOUTIQUE.logo}
                    alt={BOUTIQUE.nom}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : (
                  <span style={{ fontSize: 22 }}>{BOUTIQUE.emoji}</span>
                )}
              </div>
              <p style={{ fontFamily: TITRE, fontSize: 11, color: texteDoux, letterSpacing: ".5px", marginTop: 2 }}>
                {BOUTIQUE.nom}
              </p>
            </button>
            <button
              onClick={() => setPanierOuvert(true)}
              className="relative w-11 h-11 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: CARTE, border: `1px solid ${bordure}` }}
              aria-label="Ouvrir le panier"
            >
              <ShoppingCart size={19} color={texte} />
              {nbArticles > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                  style={{ background: vert, color: "#0B0B0B", border: `2px solid ${fond}` }}
                >
                  {nbArticles}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="pb-28">
          {onglet === "info" && <EcranInfo />}
          {onglet === "liens" && <EcranLiens />}
          {onglet === "avis" && <EcranAvis />}
          {onglet === "accueil" && (
            famille && EST_VIDEOS(famille) ? (
              <EcranVideos famille={famille} onRetour={retour} onVideo={setVideo} />
            ) : produit ? (
              <EcranFiche famille={famille} gamme={gamme} produit={produit} onRetour={retour} onAjouter={ajouter} onOuvrir={(p, n) => setVue({ produit: p, depart: n || 0 })} onVideo={setVideo} />
            ) : gamme ? (
              <EcranProduits famille={famille} gamme={gamme} onProduit={allerProduit} onRetour={retour} />
            ) : famille ? (
              <EcranGammes famille={famille} onGamme={setGamme} onRetour={retour} />
            ) : PRESENTATION === "liste" ? (
              <>
                {VEDETTES.length > 0 && <EcranAccueil onFamille={setFamille} onProduit={allerProduit} vedettesSeules />}
                <EcranListe onProduit={allerProduit} onFamille={setFamille} />
              </>
            ) : (
              <EcranAccueil onFamille={setFamille} onProduit={allerProduit} />
            )
          )}
        </div>

        {/* barre de navigation du bas */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 flex justify-center gap-2 px-3 py-2.5"
          style={{ background: FOND_IMAGE ? "#0B0B0BB3" : "#0B0B0BF2", backdropFilter: "blur(10px)", borderTop: `1px solid ${bordure}` }}
        >
          <div className="w-full max-w-[560px] flex justify-around gap-2">
            {onglets.map(({ id, nom, Icone }) => {
              const actif = onglet === id;
              return (
                <button
                  key={id}
                  onClick={() => (id === "accueil" ? accueil() : setOnglet(id))}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl active:scale-95 transition-transform"
                  style={{
                    background: actif ? VOILE("#1A0A14", "D9") : "transparent",
                    border: `2px solid ${actif ? rose : "#3A2130"}`,
                    boxShadow: actif ? `0 0 16px ${rose}55` : "none",
                  }}
                >
                  <Icone size={17} color={actif ? rose : texteDoux} />
                  <span style={{ fontFamily: CORPS, fontSize: 9.5, fontWeight: 700, color: actif ? rose : texteDoux, letterSpacing: ".5px" }}>
                    {nom}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* panier */}
        {panierOuvert && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center"
            style={{ background: "rgba(0,0,0,.8)" }}
            onClick={() => setPanierOuvert(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[560px] rounded-t-3xl p-5 max-h-[92vh] overflow-y-auto"
              style={{ background: VOILE("#101010", "F2"), border: `1px solid ${bordure}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontFamily: TITRE, fontSize: 22, color: texte }}>MON PANIER</p>
                <button onClick={() => setPanierOuvert(false)} aria-label="Fermer"><X size={18} color={texteDoux} /></button>
              </div>

              {panier.length === 0 ? (
                <p className="text-center text-[13px] py-8" style={{ color: texteDoux, fontFamily: CORPS }}>
                  Ton panier est vide.
                </p>
              ) : (
                <>
                  <p className="text-[11px] mb-1" style={{ color: texteDoux, fontFamily: CORPS }}>
                    {nbArticles} article{nbArticles > 1 ? "s" : ""}
                  </p>
                  {panier.map((i) => (
                    <div key={i.ref} className="flex items-center gap-3 py-3" style={{ borderTop: `1px solid #232323` }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-bold leading-tight" style={{ color: texte, fontFamily: CORPS }}>{i.nom}</p>
                        <p className="text-[11px]" style={{ color: texteDoux, fontFamily: CORPS }}>{i.unite} · réf. {i.ref}</p>
                        <div className="mt-0.5"><Prix valeur={i.prix * i.qty} taille={16} /></div>
                      </div>
                      <div className="flex items-center gap-1 rounded-xl p-1 flex-shrink-0" style={{ background: VOILE(fond, "CC"), border: `1px solid ${bordure}` }}>
                        <button onClick={() => changerQte(i.ref, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" aria-label="Retirer">
                          <Minus size={13} color={texte} />
                        </button>
                        <span className="w-6 text-center text-[13px] font-bold" style={{ color: texte }}>{i.qty}</span>
                        <button onClick={() => changerQte(i.ref, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" aria-label="Ajouter">
                          <Plus size={13} color={texte} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between py-4" style={{ borderTop: `1px solid #232323` }}>
                    <span className="text-[12px] uppercase tracking-wider" style={{ color: texteDoux, fontFamily: CORPS }}>Total</span>
                    <Prix valeur={cartTotal(panier)} taille={30} />
                  </div>

                  <a
                    href={lienCommande(panier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => { if (!MESSAGERIE.prerempli) copierAvantDePartir(texteCommande(panier)); }}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl active:scale-95 transition-transform"
                    style={{ background: MESSAGERIE.couleur, color: MESSAGERIE.encre, fontFamily: TITRE, fontSize: 16 }}
                  >
                    <MessageCircle size={18} /> ENVOYER SUR {MESSAGERIE.nom.toUpperCase()}
                  </a>
                  {!MESSAGERIE.prerempli && (
                    <p className="text-[11.5px] text-center mt-2.5" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.5 }}>
                      {MESSAGERIE.nom} ne permet pas d'écrire le message à l'avance.
                      <br /><b style={{ color: texte }}>Ta commande est copiée</b> — colle-la dans la conversation.
                    </p>
                  )}
                  <button onClick={() => setPanier([])} className="w-full text-[11px] mt-3 py-1" style={{ color: "#6B6B6B", fontFamily: CORPS }}>
                    Vider le panier
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* vidéo du produit */}
        {video && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.96)" }} onClick={() => setVideo(null)}>
            <Video source={video.video} nom={video.nom} className="max-w-full max-h-full rounded-xl" />
            <button
              onClick={() => setVideo(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "#1A1A1ACC", border: `1px solid ${bordure}` }}
              aria-label="Fermer la vidéo"
            >
              <X size={18} color={texte} />
            </button>
            <p className="absolute bottom-5 left-0 right-0 text-center text-[12px] px-6" style={{ color: texteDoux, fontFamily: CORPS }}>
              {video.nom} — tape à côté pour fermer
            </p>
          </div>
        )}

        {/* photos, descriptif et vidéo du produit */}
        {vue && famille && (
          <Visionneuse
            produit={vue.produit}
            famille={famille}
            depart={vue.depart}
            onFermer={() => setVue(null)}
          />
        )}
      </div>
    </div>
  );
}
