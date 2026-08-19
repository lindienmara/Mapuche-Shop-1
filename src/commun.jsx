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
/* ───────────── UN RAYON PEUT FERMER SANS DISPARAÎTRE ─────────────
   Le fournisseur n'a pas livré, la saison est finie, le vendeur s'absente une
   semaine. Jusqu'ici la seule sortie était de SUPPRIMER la famille — et avec
   elle ses articles, ses prix, ses photos et ses descriptions, tout à
   ressaisir au retour. Personne ne devrait avoir à détruire son rayon pour
   dire « pas cette semaine ».

   Une famille porte donc un interrupteur, « dispo ». Fermée, elle reste
   visible et se visite : le client voit ce qui existe, comprend que ce n'est
   pas commandable aujourd'hui, et revient. Un seul geste la rouvre, intacte.

   Le réglage est appliqué ICI, une seule fois, en marquant chaque article
   épuisé. Tout le reste de la boutique — étiquettes, panier, bouton de
   commande, vedettes — sait déjà traiter un article épuisé : aucun écran n'a à
   connaître la notion de rayon fermé. */
export const EN_RUPTURE = (f) => !!f && f.dispo === false;

const RAYON_FERME = (f) => (!EN_RUPTURE(f) ? f : {
  ...f,
  gammes: (f.gammes || []).map((g) => ({
    ...g,
    produits: (g.produits || []).map((p) => ({ ...p, dispo: false })),
  })),
});

export const FAMILLES = (APERCU ? APERCU.FAMILLES : FAMILLES_PUBLIEES).map(RAYON_FERME);

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

export const PRESENTATION = ["liste", "luxe", "marques"].includes(BOUTIQUE.presentation)
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

/* ═══════ LES MOYENS DE PAIEMENT ═══════
   Annoncés avant que le client commande, jamais après : savoir qu'on ne peut
   payer qu'en espèces se découvre au moment de choisir, pas une fois le message
   envoyé.

   ★ La boutique ne demande JAMAIS de numéro de carte, et n'en recevra jamais.
   Elle n'a pas de serveur : un numéro saisi ici ne serait protégé par personne.
   Les liens ci-dessous ouvrent la page du prestataire — c'est lui qui encaisse,
   sur sa propre page. */
const CATALOGUE_PAIEMENTS = {
  paypal: { nom: "PayPal", emoji: "🅿️", choix: true },
  revolut: { nom: "Revolut", emoji: "🔵" },
  lydia: { nom: "Lydia", emoji: "🇱" },
  wero: { nom: "Wero", emoji: "🇪🇺" },
};

/* Sur PayPal, le client choisit lui-même entre deux façons de payer, et ce
   choix ne se devine pas. Le vendeur dit laquelle il attend ; la boutique la
   lui rappelle au moment exact où il va la choisir — pas avant, pas après. */
const CONSIGNES = {
  proches: "Choisis « Entre proches » — aucun frais.",
  biens: "Choisis « Biens et services » au moment de payer.",
};

/* Le montant du panier ajouté au lien — uniquement là où le prestataire
   documente ce format. PayPal et Revolut le font ; Lydia et Wero non. Fabriquer
   une adresse au jugé enverrait le client sur une page cassée, ce qui est pire
   que de le laisser saisir la somme lui-même. */
function avecMontant(id, lien, total) {
  const base = String(lien || "").replace(/\/+$/, "");
  const somme = Number(total);
  if (!base || !(somme > 0)) return base;
  // PayPal seul : paypal.me/nom/12.50 est un format publié. Pour les autres, on
  // ne fabrique rien — une adresse inventée mène à une page introuvable, et le
  // client abandonne. Mieux vaut qu'il saisisse la somme.
  if (id === "paypal" && /paypal\.me\//i.test(base)) return `${base}/${somme.toFixed(2)}`;
  return base;
}

// Un lien qui n'est pas en https:// n'est pas affiché : le moteur ne fait
// confiance à rien, pas même à ce qu'il a écrit lui-même.
const lienSur = (u) => {
  try {
    return new URL(String(u || "")).protocol === "https:" ? String(u) : "";
  } catch (e) {
    return "";
  }
};

/* ★ UN MOYEN SANS COMPTE RELIÉ N'EST JAMAIS PROPOSÉ.
   Afficher « PayPal » sans lien, c'est promettre au client un paiement qu'il ne
   pourra pas faire : il clique, rien ne s'ouvre, et il repart. Pire, il peut
   croire avoir payé.

   La règle est donc sans exception : pas de lien valide, pas de moyen affiché.
   Un moyen coché dans l'atelier mais laissé sans adresse n'existe pas pour le
   client — l'atelier le dit en clair de son côté. */
export const PAIEMENTS = (BOUTIQUE.paiements || [])
  .filter((p) => p && (CATALOGUE_PAIEMENTS[p.id] || (p.id === "perso" && p.nom)))
  .map((p) => ({
    id: p.id,
    nom: CATALOGUE_PAIEMENTS[p.id] ? CATALOGUE_PAIEMENTS[p.id].nom : p.nom,
    emoji: CATALOGUE_PAIEMENTS[p.id] ? CATALOGUE_PAIEMENTS[p.id].emoji : (p.emoji || "💳"),
    lien: lienSur(p.lien),
    note: p.note || "",
    consigne: (CATALOGUE_PAIEMENTS[p.id] || {}).choix ? CONSIGNES[p.nature] || "" : "",
  }))
  .filter((p) => !!p.lien);

/* ★ BOUTIQUE OU VITRINE — la boutique le déduit, on ne le lui dit pas.

   Commander suppose un chemin : soit une conversation où envoyer la commande,
   soit un moyen de paiement relié. Sans ni l'un ni l'autre, il n'existe aucune
   façon d'acheter — et un panier ne sert alors qu'à décevoir : on y met des
   articles, on cherche comment valider, il n'y a rien.

   Dans ce cas la boutique devient une VITRINE : les articles, les photos et les
   prix restent, le panier disparaît entièrement. C'est un usage légitime — un
   catalogue qu'on montre, une carte de restaurant, une collection — et non une
   boutique en panne. */
export const PEUT_COMMANDER =
  (BOUTIQUE.commandeActive !== false && CONTACT !== "") || PAIEMENTS.length > 0;

/* La référence de commande.
   Un virement arrive chez le vendeur sans dire à quelle commande il répond :
   « X vous a envoyé 3,20 € », et rien d'autre. Avec deux clients dans la même
   minute, plus moyen de savoir qui a payé quoi.

   Cette référence courte relie les deux. Elle s'affiche au client, part dans le
   message de commande, et il la recopie dans le mot du virement. Elle ne
   protège de rien — elle permet seulement de s'y retrouver, ce qui manquait. */
export function referenceCommande() {
  const t = Date.now().toString(36).toUpperCase();
  return t.slice(-4);
}

export function MoyensDePaiement({ total = 0, reference = "" }) {
  // Aucun moyen relié : le bloc entier disparaît, note comprise. Une précision
  // sur un paiement qui n'existe pas n'aurait aucun sens.
  if (!PAIEMENTS.length) return null;
  return (
    <div className="rounded-xl px-3 py-3" style={{ background: VOILE("#131317", "D9"), border: `1px solid ${bordure}` }}>
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: texteDoux, fontFamily: CORPS }}>
        Paiement accepté
      </p>

      {/* Le montant et la référence, en gros et au même endroit. C'est ce que
          le client doit saisir là où rien ne le pré-remplit — et ce que le
          vendeur retrouvera sur son relevé. */}
      {total > 0 && (
        <div className="rounded-lg px-3 py-2 mb-2" style={{ background: "#00000066", border: `1px solid ${jaune}44` }}>
          <p className="text-[11px]" style={{ color: texteDoux, fontFamily: CORPS }}>
            Montant à envoyer
          </p>
          <p style={{ fontFamily: TITRE, fontSize: 24, color: jaune, lineHeight: 1.1 }}>{euros(total)}</p>
          {reference && (
            <p className="text-[11px] mt-1" style={{ color: texte, fontFamily: CORPS }}>
              Indique la référence <b style={{ color: jaune }}>{reference}</b> dans le message du paiement.
            </p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1.5">
        {PAIEMENTS.map((p) => (
          p.lien ? (
            <a
              key={p.id}
              href={avecMontant(p.id, p.lien, total)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2"
              style={{ background: CARTE, border: `1px solid ${vert}66`, textDecoration: "none" }}
            >
              <span style={{ fontSize: 15 }}>{p.emoji}</span>
              <span className="flex-1 min-w-0" style={{ fontFamily: CORPS }}>
                <span className="block text-[12.5px] font-bold" style={{ color: texte }}>
                  {p.nom}{p.note ? ` — ${p.note}` : ""}
                </span>
                {p.consigne && (
                  <span className="block text-[10.5px] mt-0.5" style={{ color: texteDoux }}>
                    {p.consigne}
                  </span>
                )}
              </span>
              <span className="text-[11px] flex-shrink-0" style={{ color: vert, fontFamily: CORPS }}>
                {avecMontant(p.id, p.lien, total) !== p.lien ? `payer ${euros(total)} ↗` : "ouvrir ↗"}
              </span>
            </a>
          ) : (
            <div key={p.id} className="flex items-center gap-2.5 px-2.5 py-1">
              <span style={{ fontSize: 15 }}>{p.emoji}</span>
              <span className="text-[12.5px]" style={{ color: texte, fontFamily: CORPS }}>
                {p.nom}{p.note ? ` — ${p.note}` : ""}
              </span>
            </div>
          )
        ))}
      </div>
      {(BOUTIQUE.paiementNote || "").trim() && (
        <p className="text-[11px] mt-2" style={{ color: texteDoux, fontFamily: CORPS }}>
          {BOUTIQUE.paiementNote}
        </p>
      )}
      <p className="text-[10px] mt-2" style={{ color: texteDoux, fontFamily: CORPS }}>
        Cette boutique ne demande jamais de numéro de carte. Un paiement en ligne se fait
        sur la page du prestataire, jamais ici.
      </p>
    </div>
  );
}

/* DÉCOUPER UNE LISTE ÉCRITE À LA MAIN.
   Le vendeur tape « 39 · 40 · 41 », ou « 39, 40, 41 », ou « 39/40/41 », ou
   « 39 40 41 » — et il a raison à chaque fois. C'est au logiciel de s'adapter,
   pas au vendeur d'apprendre une syntaxe.

   On coupe donc sur tout ce qui sépare visiblement, et on garde l'ordre écrit :
   une pointure se lit de la plus petite à la plus grande, et le vendeur l'a
   déjà rangée ainsi. */
/* DÉCOUPER UNE LISTE ÉCRITE À LA MAIN.

   Le vendeur écrit ses tailles comme il les dit. Vu en vrai dans une vraie
   boutique : « 39. 40. 42. 43 » — avec des points. Ailleurs : « 39, 40 »,
   « 39 · 40 », « 39/40 », ou simplement « 39 40 41 ». Toutes ces façons sont
   justes. C'est au logiciel de s'adapter, pas au vendeur d'apprendre une
   syntaxe qu'il n'a pas demandée.

   DEUX PIÈGES, et ils tirent en sens contraire.

   1. La virgule et le point séparent — mais ils marquent AUSSI la demi-
      pointure : « 38,5 », « 38.5 ». Pris pour des séparateurs, « 38,5 »
      devenait deux tailles, « 38 » et « 5 » : un 5 pour homme. Une demi-
      pointure s'écrivant toujours « ,5 » ou « .5 », on met celles-là à l'abri
      le temps de découper.

   2. L'espace sépare — mais pas toujours : « 8 US » est UNE taille en deux
      mots. On ne coupe donc sur les espaces que si TOUT le morceau est fait de
      nombres séparés par des espaces. « 39 40 41 » se coupe, « 8 US » reste
      entier. */
const DECIMALE = "\u0000";
const QUE_DES_NOMBRES = /^\d+(?:[.,]\d)?(?:\s+\d+(?:[.,]\d)?)+$/;

export const CHOIX = (texte) =>
  String(texte || "")
    .replace(/(\d)([.,])(5)(?!\d)/g, "$1" + DECIMALE + "$3")
    .split(/[·,;|\/\n.]+/)
    .flatMap((x) => {
      const morceau = x.split(DECIMALE).join(",").trim();
      return QUE_DES_NOMBRES.test(morceau) ? morceau.split(/\s+/) : [morceau];
    })
    .filter(Boolean);

export function texteCommande(items, reference = "") {
  const lignes = items.map((i) => {
    // La taille et la couleur choisies partent AVEC la commande. Sans elles,
    // le vendeur doit rappeler chaque client pour les lui demander.
    const precisions = [i.taille, i.couleur].filter(Boolean).join(", ");
    return `• ${i.nom}${precisions ? " (" + precisions + ")" : ""} — ${i.unite} (réf. ${i.ref}) x${i.qty} — ${euros(i.prix * i.qty)}`;
  });
  // Le moyen de paiement voyage avec la commande : le client garde une trace
  // de ce qui a été annoncé, et toi aussi. Aucun lien n'est recopié ici — un
  // lien de paiement se clique sur la boutique, pas dans une conversation.
  const moyens = PAIEMENTS.length
    ? `\n\nPaiement accepté : ${PAIEMENTS.map((p) => p.nom).join(", ")}`
    : "";
  // La référence, pour que le vendeur rapproche un virement d'une commande.
  const ref = reference ? `\n\nRéférence : ${reference}` : "";
  return `${BOUTIQUE.accroche}\n\n${lignes.join("\n")}\n\nTotal : ${euros(cartTotal(items))}${ref}${moyens}`;
}

export function lienCommande(items, reference = "") {
  return MESSAGERIE.lien(CONTACT, texteCommande(items, reference));
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
export function Video({
  source, nom, className, style,
  muet = false, boucle = false, auto = true, controles = true, secours = null,
}) {
  const [erreur, setErreur] = useState(false);
  const lecteur = useRef(null);

  /* ★ POURQUOI « MUET » EST POSÉ À LA MAIN
     Aucun navigateur ne lance tout seul une vidéo qui a du son : c'est une
     règle, pas un réglage, et elle protège le visiteur. Muette, la même vidéo
     démarre partout sans rien demander — et le son reste à un doigt, dans les
     commandes du lecteur. Or React n'applique pas toujours l'attribut avant que
     le navigateur ne prenne sa décision : on le pose donc nous-mêmes sur le
     lecteur, juste avant de demander la lecture. */
  useEffect(() => {
    const v = lecteur.current;
    if (!v) return;
    v.muted = muet;
    if (auto) {
      const lecture = v.play();
      if (lecture && lecture.catch) lecture.catch(() => {});
    }
  }, [source, muet, auto]);

  // Une vignette a son propre dessin de secours : elle ne doit pas se changer
  // en pavé d'explications au milieu d'une grille.
  if (erreur && secours) return secours;
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
      ref={lecteur}
      src={source}
      controls={controles}
      autoPlay={auto}
      loop={boucle}
      muted={muet}
      playsInline
      preload={auto ? "auto" : "metadata"}
      onError={() => setErreur(true)}
      title={nom}
      className={className}
      style={controles ? style : { ...style, pointerEvents: "none" }}
      onClick={controles ? (e) => e.stopPropagation() : undefined}
    />
  );
}

/* ───────────── UNE VIDÉO SE MONTRE, ELLE NE S'ANNONCE PAS ─────────────
   Une vidéo de produit se cachait derrière un bouton « VOIR LA VIDÉO » : il
   fallait un geste de plus pour voir ce que le vendeur avait filmé, et sur une
   fiche sans photo il ne restait qu'un dessin de remplacement à la place de
   l'article. La vidéo s'affiche donc à même la page, dans son cadre, et part
   toute seule, en boucle, comme une vitrine.

   Muette au départ : c'est la condition pour qu'un navigateur accepte de la
   lancer sans qu'on le lui demande. Le son s'allume d'un doigt.

   Ce cadre vit ici, dans le tronc commun, parce que TOUS les types de boutique
   en ont besoin — la fiche partagée comme le carrousel des marques. */
export function CadreVideo({ produit, couleur, onPleinEcran }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ border: `2px solid ${couleur || bordure}`, boxShadow: couleur ? `0 0 24px ${couleur}33` : "none", background: "#000" }}
    >
      <Video
        source={produit.video}
        nom={produit.nom}
        muet
        boucle
        className="w-full block"
        style={{ display: "block", width: "100%", maxHeight: "72vh" }}
      />
      {onPleinEcran && (
        <button
          onClick={() => onPleinEcran(produit)}
          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
          style={{ background: "#000000AA", color: texte, border: `1px solid ${bordure}` }}
        >
          <Maximize2 size={12} /> Plein écran
        </button>
      )}
      {!produit.dispo && (
        <span className="absolute top-3 left-3"><Etiquette couleur="#888">Épuisé</Etiquette></span>
      )}
    </div>
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

/* ══════════ LES AVIS, EN IMAGES ══════════
   Un avis recopié à la main ne prouve rien : n'importe qui peut écrire
   « super vendeur ». Une capture d'écran de la conversation, elle, se voit.
   C'est pourquoi les avis sont des IMAGES, montrées telles quelles — jamais
   recadrées, jamais retouchées.

   Elles défilent en carrousel : une à l'écran, on glisse pour la suivante. Une
   capture de conversation est haute et étroite ; on la laisse donc entière dans
   sa hauteur, quitte à ce qu'elle ne remplisse pas la largeur.

   Un appui l'ouvre en grand : sur un téléphone, le texte d'une conversation
   réduite à la largeur d'une carte est illisible. */
export const AVIS = Array.isArray(BOUTIQUE.avis)
  ? BOUTIQUE.avis.filter((a) => (a.image || "").trim())
  : [];

export function Carrousel({ images }) {
  const [i, setI] = useState(0);
  const [plein, setPlein] = useState(false);
  const doigtX = useRef(null);

  const n = images.length;
  const suivante = () => setI((k) => (k + 1) % n);
  const precedente = () => setI((k) => (k - 1 + n) % n);

  // Une image retirée pendant qu'on la regardait ne doit pas laisser un cadre
  // vide : on revient sur la dernière existante.
  useEffect(() => { if (i >= n) setI(0); }, [n, i]);

  useEffect(() => {
    if (!plein) return;
    const touche = (e) => {
      if (e.key === "Escape") setPlein(false);
      else if (e.key === "ArrowRight" && n > 1) suivante();
      else if (e.key === "ArrowLeft" && n > 1) precedente();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [plein, n]);

  const debutGlisse = (e) => { doigtX.current = e.touches[0].clientX; };
  const finGlisse = (e) => {
    if (doigtX.current === null || n < 2) return;
    const ecart = e.changedTouches[0].clientX - doigtX.current;
    if (Math.abs(ecart) > 45) (ecart < 0 ? suivante : precedente)();
    doigtX.current = null;
  };

  if (!n) return null;
  const courant = images[Math.min(i, n - 1)];

  const Fleche = ({ cote, onClick, children }) => (
    <button
      onClick={onClick}
      aria-label={cote === "g" ? "Avis précédent" : "Avis suivant"}
      className="absolute top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-transform"
      style={{
        [cote === "g" ? "left" : "right"]: 8,
        background: "#0C0C10D9", border: `1px solid ${bordure}`, color: texte,
      }}
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="rounded-2xl overflow-hidden" style={{ background: CARTE, border: `1px solid ${bordure}` }}>
        <div className="relative" onTouchStart={debutGlisse} onTouchEnd={finGlisse}>
          <button
            onClick={() => setPlein(true)}
            className="block w-full"
            style={{ background: "#08080C", lineHeight: 0 }}
            aria-label="Voir cet avis en grand"
          >
            <img
              src={courant.image}
              alt={courant.legende || "Avis d'un client"}
              className="w-full object-contain"
              style={{ maxHeight: "62vh" }}
            />
          </button>

          {n > 1 && (
            <>
              <Fleche cote="g" onClick={precedente}><ChevronLeft size={18} /></Fleche>
              <Fleche cote="d" onClick={suivante}><ChevronRight size={18} /></Fleche>
              <span
                className="absolute top-2 right-2 px-2 py-1 rounded-lg text-[11px] font-bold"
                style={{ background: "#0C0C10D9", color: texteDoux, border: `1px solid ${bordure}`, fontFamily: CORPS }}
              >
                {i + 1} / {n}
              </span>
            </>
          )}

          <span
            className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#0C0C10D9", border: `1px solid ${bordure}`, color: texteDoux }}
          >
            <Maximize2 size={14} />
          </span>
        </div>

        {courant.legende ? (
          <p className="px-3 py-2.5 text-[12.5px]" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.5 }}>
            {courant.legende}
          </p>
        ) : null}
      </div>

      {/* Les pastilles : elles disent combien il y en a, et où l'on en est. */}
      {n > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
          {images.map((a, k) => (
            <button
              key={k}
              onClick={() => setI(k)}
              aria-label={`Avis ${k + 1}`}
              className="rounded-full transition-all"
              style={{
                width: k === i ? 22 : 7, height: 7,
                background: k === i ? jaune : bordure,
              }}
            />
          ))}
        </div>
      )}

      {plein && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(0,0,0,.97)" }}>
          <div className="flex items-center gap-2 px-3 pt-3 pb-2 flex-shrink-0">
            <p className="flex-1 truncate" style={{ fontFamily: TITRE, fontSize: 17, color: texte }}>
              AVIS {i + 1} / {n}
            </p>
            <button
              onClick={() => setPlein(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "#1A1A1ACC", border: `1px solid ${bordure}` }}
              aria-label="Fermer"
            >
              <X size={17} color={texte} />
            </button>
          </div>
          <div className="relative flex-1 min-h-0 flex items-center justify-center px-3"
            onTouchStart={debutGlisse} onTouchEnd={finGlisse}>
            <img src={courant.image} alt={courant.legende || "Avis d'un client"}
              className="max-w-full max-h-full object-contain rounded-xl" />
            {n > 1 && (
              <>
                <Fleche cote="g" onClick={precedente}><ChevronLeft size={18} /></Fleche>
                <Fleche cote="d" onClick={suivante}><ChevronRight size={18} /></Fleche>
              </>
            )}
          </div>
          {courant.legende ? (
            <p className="px-4 pb-4 pt-2 text-center text-[13px] flex-shrink-0"
              style={{ color: texteDoux, fontFamily: CORPS }}>
              {courant.legende}
            </p>
          ) : null}
        </div>
      )}
    </>
  );
}

/* ══════════ CHOISIR SA TAILLE, SA COULEUR, ET COMMANDER ══════════

   Ce bloc vit dans le tronc commun parce que DEUX écrans s'en servent : la
   fiche d'un produit, et le carrousel des boutiques par marques. Le recopier
   dans les deux aurait été plus rapide à écrire, et la garantie qu'un jour
   l'un des deux serait corrigé et pas l'autre.

   Trois règles y sont tenues :

     • RIEN N'EST PRÉSÉLECTIONNÉ. Choisir une pointure à la place du client,
       c'est lui vendre une paire qu'il n'a pas demandée.

     • UNE POINTURE EN RUPTURE RESTE VISIBLE, barrée. La masquer ferait croire
       au client que le modèle ne se fait pas dans sa taille, et il partirait.
       Barrée, il sait que c'est son modèle mais pas aujourd'hui, et il revient.

     • SANS MOYEN DE COMMANDER, AUCUN BOUTON. Le prix et la fiche restent :
       la boutique devient une vitrine, pas une boutique en panne. */
export function ChoixEtCommande({ produit, onAjouter, compact = false }) {
  const [qte, setQte] = useState(1);
  const [taille, setTaille] = useState("");
  const [couleur, setCouleur] = useState("");

  const tailles = CHOIX(produit.tailles);
  const teintes = CHOIX(produit.couleurs);
  const epuisees = new Set(CHOIX(produit.taillesEpuisees));

  // Changer de produit sans remettre les choix à zéro ferait partir un 42 pour
  // un modèle qui ne se fait qu'en 38.
  useEffect(() => { setTaille(""); setCouleur(""); setQte(1); }, [produit.ref, produit.nom]);
  useEffect(() => { if (taille && epuisees.has(taille)) setTaille(""); }, [taille, produit.taillesEpuisees]);

  const manque = (tailles.length && !taille) || (teintes.length && !couleur);

  return (
    <>
      {(tailles.length > 0 || teintes.length > 0) && (
        <div className={compact ? "" : "mt-5"}>
          {tailles.length > 0 && (
            <>
              <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: texteDoux, fontFamily: CORPS }}>
                Choisir la taille
              </p>
              <div className="grid grid-cols-3 gap-2">
                {tailles.map((t) => {
                  const partie = epuisees.has(t);
                  return (
                    <button
                      key={t}
                      onClick={() => { if (!partie) setTaille(taille === t ? "" : t); }}
                      disabled={partie}
                      aria-label={partie ? t + " — épuisée" : t}
                      className="py-2.5 rounded-xl text-[14px] transition-transform"
                      style={{
                        background: taille === t ? texte : CARTE,
                        color: partie ? texteDoux : taille === t ? "#0B0B0B" : texte,
                        border: `1px solid ${taille === t ? texte : bordure}`,
                        fontFamily: CORPS, fontWeight: taille === t ? 700 : 500,
                        textDecoration: partie ? "line-through" : "none",
                        opacity: partie ? 0.5 : 1,
                        cursor: partie ? "default" : "pointer",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {teintes.length > 0 && (
            <>
              <p className="text-[11px] uppercase tracking-wider mb-2"
                style={{ color: texteDoux, fontFamily: CORPS, marginTop: tailles.length ? 16 : 0 }}>
                Choisir la couleur
              </p>
              <div className="flex flex-wrap gap-2">
                {teintes.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCouleur(couleur === c ? "" : c)}
                    className="px-4 py-2.5 rounded-xl text-[14px] active:scale-95 transition-transform"
                    style={{
                      background: couleur === c ? texte : CARTE,
                      color: couleur === c ? "#0B0B0B" : texte,
                      border: `1px solid ${couleur === c ? texte : bordure}`,
                      fontFamily: CORPS, fontWeight: couleur === c ? 700 : 500,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

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

        {!PEUT_COMMANDER ? null : produit.dispo ? (
          <button
            onClick={() => { if (!manque) onAjouter(produit, qte, taille, couleur); }}
            disabled={manque}
            className="w-full mt-4 py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{
              backgroundImage: manque ? "none" : DEGRADE,
              background: manque ? CARTE : undefined,
              border: manque ? `1px solid ${bordure}` : "none",
              color: manque ? texteDoux : "#fff",
              fontFamily: TITRE, fontSize: 17, letterSpacing: ".5px",
            }}
          >
            <Plus size={18} />
            {manque
              ? (tailles.length && !taille ? "CHOISIS TA TAILLE" : "CHOISIS TA COULEUR")
              : `AJOUTER AU PANIER · ${euros(produit.prix * qte)}`}
          </button>
        ) : (
          <p className="w-full mt-4 py-3.5 rounded-xl text-center text-[13px] font-bold"
            style={{ background: VOILE("#262626", "D9"), color: texteDoux, border: `1px solid ${bordure}` }}>
            Bientôt de retour
          </p>
        )}
      </div>
    </>
  );
}

/* ══════════ TOUTES LES FAMILLES ══════════
   Une rangée de pastilles qui défile de côté cache ce qui dépasse de l'écran :
   passé la troisième famille, le client ne sait même pas que les autres
   existent. Ce bouton ouvre la liste complète, en pleine largeur, avec le
   nombre d'articles de chacune — plus rien n'est caché.

   Il sert dans les deux sens : choisir une famille, ou revenir à l'ensemble. */
export function ToutesLesFamilles({ familles, actif, onFamille, onTout, total, etiquette = "Toutes les familles" }) {
  const [ouvert, setOuvert] = useState(false);
  const compte = (f) => (f.gammes || []).reduce((s, g) => s + (g.produits || []).length, 0);

  return (
    <div className="px-3 mt-3">
      <button
        onClick={() => setOuvert(!ouvert)}
        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 active:scale-[0.99] transition-transform"
        style={{ background: VOILE("#1C1C1C", "D9"), border: `1.5px solid ${jaune}66`,
                 fontFamily: CORPS, fontSize: 13, fontWeight: 700, color: texte }}
      >
        <span style={{ color: jaune, fontSize: 15, lineHeight: 1 }}>☰</span>
        <span className="flex-1 text-left">{etiquette}</span>
        <span style={{ color: texteDoux, fontWeight: 400, fontSize: 12 }}>
          {familles.length} · {ouvert ? "fermer" : "voir"}
        </span>
      </button>

      {ouvert && (
        <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${bordure}` }}>
          {onTout && (
            <button
              onClick={() => { onTout(); setOuvert(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              style={{ background: actif === "tous" ? VOILE("#241830", "E6") : CARTE,
                       borderBottom: `1px solid ${bordure}`, fontFamily: CORPS, fontSize: 13,
                       fontWeight: 700, color: actif === "tous" ? jaune : texte }}
            >
              <span style={{ fontSize: 15 }}>🛍️</span>
              <span className="flex-1">Tout voir</span>
              <span style={{ color: texteDoux, fontWeight: 400, fontSize: 12 }}>{total} articles</span>
            </button>
          )}
          {familles.map((f, i) => (
            <button
              key={f.id}
              onClick={() => { onFamille(f); setOuvert(false); }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left"
              style={{ background: actif === f.id ? VOILE("#241830", "E6") : CARTE,
                       borderBottom: i < familles.length - 1 ? `1px solid ${bordure}` : "none",
                       fontFamily: CORPS, fontSize: 13, fontWeight: 700,
                       color: actif === f.id ? jaune : texte }}
            >
              <span style={{ fontSize: 15 }}>{f.emoji}</span>
              <span className="flex-1 min-w-0" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.nom}
              </span>
              {EST_VIDEOS(f)
                ? <PlayCircle size={13} color={cyan} />
                : EN_RUPTURE(f)
                ? <span style={{ color: texteDoux, fontWeight: 700, fontSize: 11 }}>ÉPUISÉ</span>
                : <span style={{ color: texteDoux, fontWeight: 400, fontSize: 12 }}>{compte(f)} articles</span>}
            </button>
          ))}
        </div>
      )}
    </div>
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
