// TYPE DE BOUTIQUE N° 4 — PAR MARQUES
// ----------------------------------
// Pour ce qui se choisit à l'œil : des chaussures, du prêt-à-porter, des
// lunettes. Le client ne cherche pas dans un catalogue, il regarde.
//
// Trois écrans, et rien de plus :
//
//   1. L'ACCUEIL — une grande photo par marque, empilées, pleine largeur. Le
//      nom de la marque posé dessus. Rien d'autre : ni prix, ni compteur, ni
//      pastille. On choisit une marque comme on entre dans un rayon.
//
//   2. LE CARROUSEL — une photo par page, en grand. On tourne la page pour
//      voir le modèle suivant. C'est le geste d'un catalogue papier, et c'est
//      le seul geste à connaître.
//
//   3. LA FICHE — au doigt sur la photo : la taille, la couleur, le prix.
//      Elle est commune à toutes les boutiques et ne vit pas ici.
//
// POURQUOI SI PEU. Une paire de baskets ne se vend pas sur sa description : on
// l'aime ou non en la voyant. Tout ce qu'on ajoute autour de la photo la
// rétrécit, et rétrécir la photo est la seule erreur qu'on ne rattrape pas
// dans ce type de boutique.
//
// ★ CE FICHIER N'APPARTIENT QU'A CE TYPE.
// Le modifier ne touche ni le type 1, ni le type 2, ni le type 3.

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { visuelFamille, visuelProduit } from "./visuels.js";
import {
  FAMILLES, EST_VIDEOS, EN_RUPTURE, GALERIE, CLE, euros, PROPORTION_PHOTO, ChoixEtCommande,
  CadreVideo,
  TITRE, CORPS, CARTE, bordure, texte, texteDoux, jaune,
} from "./commun.jsx";

/* LA FORME DES TUILES DE MARQUE suit le réglage « forme des photos » de la
   boutique : carré, portrait, paysage. Sans cela le vendeur choisirait le
   portrait pour ses produits et retrouverait quand même un bandeau large à
   l'accueil — deux formes pour la même photo, dans la même boutique.

   « Forme d'origine » ne veut rien dire pour une tuile qui doit s'aligner avec
   ses voisines : dans ce cas seulement, on retombe sur le portrait. */
const PROPORTION_MARQUE = PROPORTION_PHOTO || "3 / 4";

// Les marques : les familles de produits, les galeries de vidéos mises à part.
export const MARQUES = FAMILLES.filter((f) => !EST_VIDEOS(f));

// Tous les modèles d'une marque, dans l'ordre du catalogue. Les gammes ne sont
// pas montrées au client — ici, elles ne servent qu'à ranger côté atelier.
export const MODELES = (famille) =>
  (famille.gammes || []).flatMap((g) =>
    (g.produits || []).map((p, i) => ({ produit: p, gamme: g, cle: CLE(famille, g, i, p) })));

/* ═════════ 1. L'ACCUEIL : UNE GRANDE PHOTO PAR MARQUE ═════════ */

function Marque({ famille, onFamille }) {
  const modeles = MODELES(famille);
  const [videoRatee, setVideoRatee] = useState(false);

  /* La photo de la marque si elle en a une, sinon celle de son premier modèle,
     sinon le dessin de secours. Une case vide serait la seule chose à ne pas
     montrer sur un écran qui n'est fait que d'images. */
  const affiche =
    (famille.image || "").trim() ||
    (modeles.length ? (GALERIE(modeles[0].produit)[0] || "") : "") ||
    visuelFamille(famille);

  return (
    <button
      onClick={() => onFamille(famille)}
      className="relative block w-full overflow-hidden active:scale-[.99] transition-transform"
      /* UNE MARQUE = UN ÉCRAN ENTIER.

         La tuile ne se contente plus d'une proportion : elle prend TOUTE la
         hauteur du téléphone. On ne voit donc qu'une marque à la fois, en
         grand, et on fait défiler pour passer à la suivante.

         « dvh » et non « vh » : sur un téléphone, la barre d'adresse du
         navigateur apparaît et disparaît au défilement. « vh » se fige sur la
         plus grande hauteur et laisse un bout de l'image coupé sous la barre ;
         « dvh » suit la hauteur réellement visible. Le « vh » reste écrit
         juste avant, pour les navigateurs qui ignorent encore « dvh ».

         On retranche la barre du bas — accueil, infos, liens, avis — pour que
         le nom de la marque ne se retrouve pas caché dessous. */
      style={{ height: "100vh", minHeight: "100dvh", maxHeight: "100dvh", background: "#0A0A0C" }}
    >
      {/* UNE VIDÉO QUI TOURNE, SI LA MARQUE EN A UNE.

          Quatre attributs, et chacun est indispensable :
            muted     — sans le silence, AUCUN téléphone ne démarre une vidéo
                        tout seul. C'est la règle de tous les navigateurs, et
                        c'est elle qu'on oublie en premier.
            playsInline — sans lui, l'iPhone passe en plein écran dès la
                        lecture : la boutique disparaît derrière un lecteur.
            loop      — une tuile qui s'arrête au bout de six secondes et reste
                        figée est pire qu'une photo.
            preload="metadata" — on ne télécharge pas les trois vidéos en
                        entier avant d'avoir montré la page.

          Et si la vidéo manque ou refuse de se lire, on retombe sur l'image :
          une tuile noire ne dit rien à personne. */}
      {(famille.video || "").trim() && !videoRatee ? (
        <video
          src={famille.video}
          poster={affiche}
          autoPlay muted loop playsInline
          preload="metadata"
          /* La vidéo REMPLIT l'écran, la photo non — et ce n'est pas une
             inconséquence. Une vidéo de marque est un décor : on la filme pour
             qu'elle occupe le cadre, et des bandes noires autour la ruineraient.
             Une photo de produit, elle, montre une paire de chaussures : la
             remplir couperait la semelle ou le talon. */
          className="w-full h-full object-cover"
          onError={() => setVideoRatee(true)}
        />
      ) : (
        /* L'IMAGE ENTIÈRE, JAMAIS ROGNÉE.
           Ces tuiles montrent des photos de PRODUIT — une paire de chaussures,
           pas un décor. « object-cover » remplirait mieux le cadre, mais en
           coupant les bords : la semelle ou le talon disparaîtraient. Une
           chaussure amputée ne donne envie d'entrer dans aucun rayon. */
        <img
          src={affiche}
          alt={famille.nom}
          className="w-full h-full object-contain"
          onError={(e) => { e.currentTarget.src = visuelFamille(famille); }}
        />
      )}
      {/* Le voile sombre : sans lui, le nom de la marque devient illisible dès
          que la photo est claire — et une photo de produit l'est souvent. */}
      <div
        className="absolute inset-0 flex flex-col items-start justify-end px-5 pb-28"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.25) 45%, rgba(0,0,0,0) 100%)" }}
      >
        <p style={{ fontFamily: TITRE, fontSize: "clamp(26px, 8vw, 40px)", color: "#fff", lineHeight: 1, letterSpacing: ".5px" }}>
          {(famille.nom || "").toUpperCase()}
        </p>
        <p className="mt-1.5 text-[12px]" style={{ color: "#D8D8D8", fontFamily: CORPS, letterSpacing: ".08em" }}>
          {EN_RUPTURE(famille)
            ? "Rayon épuisé — à revoir bientôt"
            : `${modeles.length} modèle${modeles.length > 1 ? "s" : ""} — voir la collection`}
        </p>
      </div>
    </button>
  );
}

export function EcranMarques({ onFamille }) {
  if (!MARQUES.length) {
    return (
      <div className="mx-3 mt-6 rounded-2xl px-4 py-8 text-center"
        style={{ background: CARTE, border: `1px solid ${bordure}` }}>
        <p style={{ fontFamily: TITRE, fontSize: 19, color: texte }}>AUCUNE MARQUE</p>
        <p className="text-[13px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.6 }}>
          Ajoute une famille par marque dans l'atelier, avec sa photo.
        </p>
      </div>
    );
  }

  /* Aucun espace entre les marques : chacune occupe son écran, et le passage
     de l'une à l'autre doit être franc, sans liseré de fond au milieu. */
  return (
    <div className="flex flex-col">
      {MARQUES.map((f) => <Marque key={f.id} famille={f} onFamille={onFamille} />)}
    </div>
  );
}

/* ═════════ 2. LE CARROUSEL : UNE PHOTO PAR PAGE ═════════ */

export function EcranCarrousel({ famille, onAjouter, onRetour }) {
  const modeles = MODELES(famille);

  /* DEUX REPÈRES, ET NON UN SEUL.

     « i » est le MODÈLE — c'est-à-dire la COULEUR. On en change en touchant
     une vignette, sous la grande photo.

     « j » est la PHOTO du modèle choisi. On en change avec les flèches posées
     sur l'image, ou en la faisant glisser du doigt.

     Les deux étaient confondus, et c'était une faute : les flèches sautaient
     d'une couleur à l'autre, si bien que la deuxième vue d'une paire — celle
     qui la montre sur sa boîte, de trois quarts — n'apparaissait nulle part.
     Un client qui voulait voir l'autre photo de la TN noire tombait sur la
     blanche.

     Un geste, une seule chose : les vignettes changent la couleur, les flèches
     tournent les photos de cette couleur. */
  const [i, setI] = useState(0);
  const [j, setJ] = useState(0);
  const doigtX = useRef(null);

  const n = modeles.length;
  const courant = n ? modeles[Math.min(i, n - 1)] : null;

  /* Les photos du modèle affiché. Si le vendeur n'en a mis aucune, le dessin
     de secours en tient lieu : la galerie n'est jamais vide, et les flèches
     n'ont donc jamais à naviguer dans du vide. */
  const galerie = courant
    ? (GALERIE(courant.produit).length
        ? GALERIE(courant.produit)
        : [visuelProduit(courant.produit, famille.couleurs, famille.glyphe)])
    : [];
  const np = galerie.length;

  const suivant = () => setJ((k) => (k + 1) % np);
  const precedent = () => setJ((k) => (k - 1 + np) % np);

  /* Changer de marque doit toujours ramener à la première page. Sans cela, on
     ouvre une marque de trois modèles en page 7 et l'écran paraît cassé. */
  useEffect(() => { setI(0); }, [famille.id]);

  /* Et changer de couleur ramène à la première photo de cette couleur : on
     ouvre la bleue sur la bleue de profil, jamais sur son carton. */
  useEffect(() => { setJ(0); }, [i, famille.id]);

  useEffect(() => {
    if (np < 2) return;
    const touche = (e) => {
      if (e.key === "ArrowRight") suivant();
      else if (e.key === "ArrowLeft") precedent();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [np, i, famille.id]);

  const debut = (e) => { doigtX.current = e.touches[0].clientX; };
  const fin = (e) => {
    if (doigtX.current === null || np < 2) return;
    const ecart = e.changedTouches[0].clientX - doigtX.current;
    if (Math.abs(ecart) > 45) (ecart < 0 ? suivant : precedent)();
    doigtX.current = null;
  };

  if (!n) {
    return (
      <div className="mx-3 mt-6 rounded-2xl px-4 py-8 text-center"
        style={{ background: CARTE, border: `1px solid ${bordure}` }}>
        <p style={{ fontFamily: TITRE, fontSize: 19, color: texte }}>
          {(famille.nom || "").toUpperCase()} — RIEN À MONTRER
        </p>
        <p className="text-[13px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.6 }}>
          Cette marque n'a pas encore de modèle.
        </p>
        <button onClick={onRetour} className="mt-5 px-5 py-2.5 rounded-xl"
          style={{ background: CARTE, border: `1px solid ${bordure}`, color: texte, fontFamily: TITRE, fontSize: 14 }}>
          ← LES MARQUES
        </button>
      </div>
    );
  }

  const { produit } = courant;
  const photo = galerie[Math.min(j, np - 1)];
  const aVideo = !!(produit.video || "").trim();
  const aPhoto = GALERIE(produit).length > 0;

  /* LA PAGE D'UN MODÈLE — UNE COLONNE, DE HAUT EN BAS.

     Version précédente : une couche plein écran, avec le nom, le prix et le
     bouton posés SUR la photo. Sur un téléphone cela passait ; sur un écran
     large la photo restait une colonne étroite au milieu, et le texte partait
     se coller dans les coins noirs, très loin d'elle.

     Le défaut n'était pas la largeur, c'était le principe : poser les
     informations SUR l'image oblige à les entasser dans le peu de place qui
     reste, et interdit d'en mettre plus. Elles sont donc maintenant SOUS elle,
     dans le fil de la page. On voit la photo en grand, on descend, on trouve
     les tailles, le prix et le bouton — chacun avec la place qu'il lui faut.

     La colonne, elle, est celle de toute la boutique : la photo garde la forme
     choisie dans les réglages, et rien ne s'étale sur un grand écran. */
  return (
    <div className="select-none pb-4" onTouchStart={debut} onTouchEnd={fin}>

      {/* La barre de la marque : on sait où on est, et comment sortir. */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button onClick={onRetour} aria-label="Revenir aux marques"
          className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform flex-shrink-0"
          style={{ background: CARTE, border: `1px solid ${bordure}` }}>
          <ChevronLeft size={18} color={texte} />
        </button>
        <p className="flex-1 truncate" style={{ fontFamily: TITRE, fontSize: 17, color: texte, letterSpacing: ".5px" }}>
          {(famille.nom || "").toUpperCase()}
        </p>
        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex-shrink-0"
          style={{ background: CARTE, border: `1px solid ${bordure}`, color: texteDoux, fontFamily: CORPS }}>
          {i + 1} / {n}
        </span>
      </div>

      {/* Pas de photo, mais un film : le film prend simplement sa place. */}
      {aVideo && !aPhoto ? (
        <div className="mx-3">
          <CadreVideo produit={produit} couleur={(famille.couleurs || [])[0]} />
        </div>
      ) : (
      <>
      {/* LA PHOTO, en grand, dans la forme choisie pour la boutique. */}
      <div className="relative mx-3 rounded-2xl overflow-hidden"
        style={{ aspectRatio: PROPORTION_MARQUE, background: "#08080A", border: `1px solid ${bordure}` }}>
        <img
          src={photo}
          alt={produit.nom}
          className="w-full h-full object-contain"
          onError={(e) => { e.currentTarget.src = visuelProduit(produit, famille.couleurs, famille.glyphe); }}
        />

        {/* LES FLÈCHES TOURNENT LES PHOTOS DE CETTE COULEUR — rien d'autre.
            Elles ne s'affichent donc que si le modèle a bien une deuxième vue,
            et le petit compteur dit laquelle on regarde. Deux flèches qui ne
            mènent nulle part valent mieux absentes. */}
        {np > 1 && (
          <>
            <button onClick={precedent} aria-label="Photo précédente"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#0C0C10D9", border: `1px solid ${bordure}` }}>
              <ChevronLeft size={20} color="#fff" />
            </button>
            <button onClick={suivant} aria-label="Photo suivante"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: "#0C0C10D9", border: `1px solid ${bordure}` }}>
              <ChevronRight size={20} color="#fff" />
            </button>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-bold"
              style={{ background: "#0C0C10E6", border: `1px solid ${bordure}`, color: "#D8D8D8", fontFamily: CORPS }}>
              {j + 1} / {np}
            </span>
          </>
        )}

        {!produit.dispo && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold"
            style={{ background: "#0C0C10E6", border: `1px solid ${bordure}`, color: "#D8D8D8", fontFamily: CORPS }}>
            ÉPUISÉ
          </span>
        )}
      </div>
      </>
      )}

      {/* Des photos ET un film : le film se déroule juste dessous, déjà lancé,
          au lieu d'attendre derrière un bouton. */}
      {aVideo && aPhoto && (
        <div className="mx-3 mt-3">
          <CadreVideo produit={produit} couleur={(famille.couleurs || [])[0]} />
        </div>
      )}

      {/* LES AUTRES MODÈLES, EN VIGNETTES.

          Des pastilles disaient seulement « il y en a trois, tu es sur la
          deuxième ». Elles ne montraient rien. Or ce qui distingue trois TN,
          c'est justement leur COULEUR : il faut la voir pour la choisir.

          Les vignettes portent donc la photo de chaque modèle, et un doigt
          dessus amène directement à sa page — ses photos, ses tailles, son
          prix. C'est ce que fait la page d'une marque, et c'est ce que le
          client connaît déjà.

          La rangée défile de côté si les modèles sont nombreux ; on ne les
          entasse pas sur plusieurs lignes, ce qui repousserait les tailles
          hors de l'écran. */}
      {n > 1 && (
        <div className="mt-3 px-3">
          <p className="text-[11px] uppercase tracking-wider mb-2" style={{ color: texteDoux, fontFamily: CORPS }}>
            {n} modèles — touche pour changer
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {modeles.map((m, k) => {
              const vignette = GALERIE(m.produit)[0] || visuelProduit(m.produit, famille.couleurs, famille.glyphe);
              const choisi = k === i;
              return (
                <button
                  key={m.cle}
                  onClick={() => setI(k)}
                  aria-label={m.produit.nom}
                  className="flex-shrink-0 rounded-xl overflow-hidden transition-transform active:scale-95"
                  style={{
                    width: 64, height: 85,
                    background: "#08080A",
                    border: `2px solid ${choisi ? texte : bordure}`,
                    opacity: choisi ? 1 : 0.72,
                  }}
                >
                  <img src={vignette} alt={m.produit.nom} className="w-full h-full object-contain"
                    onError={(e) => { e.currentTarget.src = visuelProduit(m.produit, famille.couleurs, famille.glyphe); }} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PUIS, EN DESCENDANT : le nom, la description, les tailles, le prix et
          le bouton. C'est le même bloc que la fiche d'un produit — il vit dans
          le tronc commun, il n'est écrit qu'une fois. */}
      <div className="px-3 mt-5">
        <p style={{ fontFamily: TITRE, fontSize: "clamp(22px, 7vw, 30px)", color: texte, lineHeight: 1.1 }}>
          {(produit.nom || "").toUpperCase()}
        </p>

        {(produit.description || "").trim() && (
          <p className="text-[14px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.6 }}>
            {produit.description}
          </p>
        )}

        <div className="mt-4">
          <ChoixEtCommande produit={produit} onAjouter={onAjouter} compact />
        </div>
      </div>
    </div>
  );
}
