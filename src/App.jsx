// LE MOTEUR — ASSEMBLAGE
// ----------------------
// Ce fichier ne contient plus que les ecrans communs aux trois types (gammes,
// produits, fiche, infos, liens, avis, intro, visionneuse, videos) et
// l'aiguillage : selon le type de la boutique, l'accueil est celui du
// type 1 ou celui du type 2.
//
// Quatre fichiers, quatre roles :
//   commun.jsx        ce que TOUTES les boutiques partagent
//   type-familles.jsx le type 1, et lui seul
//   type-liste.jsx    le type 2, et lui seul
//   type-luxe.jsx     le type 3, et lui seul

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft, ChevronRight, Search, ShoppingCart, Plus, Minus, X,
  Home, Info, Link2, Star, MessageCircle, Maximize2, PlayCircle,
} from "lucide-react";
import { visuelFamille, visuelProduit } from "./visuels.js";
import {
  FONTS, APERCU, BOUTIQUE, COULEURS, FAMILLES, EST_VIDEOS, GALERIE,
  TOUS_PRODUITS, SELECTION_CHEF, VEDETTES, SECOURS, PRESENTATION, AJUSTEMENT,
  CLE, PROPORTION_PHOTO, STYLE_PHOTO, FOND_IMAGE, COLONNE, CARTE, VOILE, FOND_PAGE,
  DEGRADE, TITRE, CORPS, INTRO, ANIMATIONS, telegram, euros, MESSAGERIES,
  MESSAGERIE, CONTACT, Photo, Video, Etiquette, Prix, BarreSection, Vedettes, RemonterEnHaut, MoyensDePaiement, referenceCommande, PEUT_COMMANDER,
  AVIS, Carrousel, CHOIX, ChoixEtCommande, CadreVideo,
  cartTotal, texteCommande, lienCommande, copierAvantDePartir,
  fond, fondCarte, bordure, texte, texteDoux, rose, violet, vert, jaune, cyan,
} from "./commun.jsx";
import { EcranFamilles } from "./type-familles.jsx";
import { EcranListe } from "./type-liste.jsx";
import { EcranLuxe } from "./type-luxe.jsx";
import { EcranMarques, EcranCarrousel } from "./type-marques.jsx";
/* Une famille sans aucune gamme ouvrait un ecran entierement vide : le titre,
   puis rien. Vu du visiteur — et de qui tient la boutique — le bouton semble
   simplement ne pas marcher, alors qu'il a parfaitement fonctionne. On ne
   laisse plus jamais un ecran muet : il dit ce qu'il en est, et propose de
   revenir. */
function RayonVide({ famille, onRetour }) {
  return (
    <div className="mx-3 mt-6 rounded-2xl px-4 py-6 text-center"
      style={{ background: CARTE, border: `1px solid ${bordure}` }}>
      <p style={{ fontFamily: TITRE, fontSize: 19, color: texte, letterSpacing: ".5px" }}>
        {famille.emoji} Bientôt garni
      </p>
      <p className="mt-2" style={{ fontFamily: CORPS, fontSize: 13, color: texteDoux }}>
        Cette famille n'a pas encore d'articles. Reviens la voir bientôt.
      </p>
      <button
        onClick={onRetour}
        className="mt-4 px-4 py-2.5 rounded-xl active:scale-95 transition-transform"
        style={{ backgroundImage: DEGRADE, color: "#fff", fontFamily: CORPS, fontSize: 13, fontWeight: 700 }}
      >
        Revenir aux familles
      </button>
    </div>
  );
}

/* Cliquer une famille amène ICI, directement sur ses articles.
   Avant, on tombait sur une liste de gammes : un menu de plus à traverser
   avant de voir la moindre image, alors que c'est l'image qu'on vient
   chercher. Les gammes n'ont pas disparu — elles sont devenues le filtre en
   haut de cet écran, et on n'y voit jamais que les articles de la famille
   choisie. */
function EcranProduits({ famille, gamme, onProduit, onRetour }) {
  const [recherche, setRecherche] = useState("");
  // « toutes » par défaut : on arrive d'une famille, on veut la voir entière.
  // La gamme n'est imposée que si l'on vient d'un produit précis.
  const [gammeFiltre, setGammeFiltre] = useState(gamme ? gamme.id : "toutes");

  // Le filtre peut désigner une gamme d'une AUTRE famille — après un retour,
  // ou si le catalogue a changé. On le vérifie plutôt que de faire confiance :
  // sans ça, la recherche échouait et l'écran se vidait sans rien expliquer.
  const gammeChoisie = famille.gammes.find((g) => g.id === gammeFiltre) || null;
  const filtreValide = gammeFiltre === "toutes" || !!gammeChoisie;

  const produits = useMemo(() => {
    // Chaque produit emporte sa clé — voir CLE dans commun.jsx : une référence
    // peut resservir d'une collection à l'autre, sa place non.
    const source = !filtreValide || gammeFiltre === "toutes"
      ? famille.gammes.flatMap((g) => (g.produits || []).map((p, i) => ({ ...p, gamme: g, cle: CLE(famille, g, i, p) })))
      : (gammeChoisie.produits || []).map((p, i) => ({ ...p, gamme: gammeChoisie, cle: CLE(famille, gammeChoisie, i, p) }));
    const q = recherche.trim().toLowerCase();
    return q ? source.filter((p) => p.nom.toLowerCase().includes(q)) : source;
  }, [famille, gammeFiltre, recherche, filtreValide, gammeChoisie]);

  return (
    <>
      <BarreSection titre={filtreValide && gammeChoisie ? gammeChoisie.nom : famille.nom} onRetour={onRetour} />

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

      {famille.gammes.length > 1 && (
        <div className="mx-3 mt-2">
          <select
            value={filtreValide ? gammeFiltre : "toutes"}
            onChange={(e) => setGammeFiltre(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none appearance-none"
            style={{ background: VOILE("#1C1C1C", "D9"), border: `1px solid ${bordure}`, color: texte, fontFamily: CORPS }}
          >
            <option value="toutes">Tout {famille.nom} — {famille.gammes.reduce((s, g) => s + (g.produits || []).length, 0)} articles</option>
            {famille.gammes.map((g) => (
              <option key={g.id} value={g.id}>{g.nom} — {(g.produits || []).length}</option>
            ))}
          </select>
        </div>
      )}

      {produits.length === 0 && <RayonVide famille={famille} onRetour={onRetour} />}

      <RemonterEnHaut articles={produits.length} />

      <div className="grid grid-cols-2 gap-3 px-3 mt-4">
        {produits.map((p) => (
          <button
            key={p.cle || p.ref}
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

/* Dans une galerie de vidéos, la vignette EST la vidéo : sa première image
   s'affiche au lieu du dessin de remplacement. Elle ne se lance pas — dix
   vidéos qui démarreraient ensemble videraient le forfait du visiteur. Elle se
   charge juste assez pour se montrer, et l'appui ouvre le plein écran. */
function VignetteVideo({ produit, famille, source, className }) {
  return (
    <Video
      source={produit.video}
      nom={produit.nom}
      muet
      auto={false}
      controles={false}
      className={className}
      style={STYLE_PHOTO(produit)}
      secours={
        <Photo produit={produit} secours={SECOURS(produit, famille)} source={source} alt={produit.nom} className={className} />
      }
    />
  );
}

function EcranFiche({ famille, gamme, produit, onRetour, onAjouter, onOuvrir, onVideo }) {
  const image = visuelProduit(produit, famille.couleurs, famille.glyphe);
  const photos = GALERIE(produit);
  const aVideo = !!(produit.video || "").trim();
  const aPhoto = photos.length > 0;
  const aPlus = photos.length > 1 || !!(produit.description || "").trim() || aVideo;

  return (
    <>
      <BarreSection titre={produit.nom} onRetour={onRetour} />

      <div className="px-3 mt-3">
        {/* Pas de photo, mais un film : le film prend simplement sa place. */}
        {aVideo && !aPhoto ? (
          <CadreVideo produit={produit} couleur={famille.couleurs[0]} onPleinEcran={onVideo} />
        ) : (
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
        )}

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

        {/* Des photos ET un film : le film se déroule juste dessous, déjà
            lancé, au lieu d'attendre derrière un bouton. */}
        {aVideo && aPhoto && (
          <div className="mt-3">
            <CadreVideo produit={produit} couleur={famille.couleurs[0]} onPleinEcran={onVideo} />
          </div>
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

        {/* LA TAILLE, LA COULEUR, LE PRIX ET LE PANIER.
            Ce sont les deux questions qu'on pose en magasin avant toute autre,
            et les deux qui font renoncer quand la réponse manque. Elles vivent
            ici, sur la fiche commune : une boutique de chaussures en a besoin,
            mais une boutique de vêtements ou de vaisselle aussi.

            Rien ne s'affiche si le vendeur n'a rien écrit — pas de ligne vide,
            pas de « non renseigné ». Une boutique d'épicerie ne verra jamais
            ces deux lignes. */}
        <ChoixEtCommande produit={produit} onAjouter={onAjouter} />
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

/* L'ONGLET AVIS
   Les avis ne se déposent PAS depuis la boutique. C'est le vendeur qui les
   publie, et uniquement sous forme de captures d'écran de vraies conversations
   — voir l'onglet Avis de l'atelier.

   Il y avait ici un bouton « DONNER MON AVIS » qui ouvrait la messagerie. Il
   est retiré : il ouvrait une porte que personne n'avait demandé d'ouvrir, il
   promettait au client que son message serait publié — ce qui n'a jamais été
   vrai — et il donnait le numéro du vendeur à quiconque passait sur l'onglet,
   y compris quand aucune façon d'être contacté n'était activée. */
function EcranAvis() {
  if (AVIS.length) {
    return (
      <>
        <BarreSection titre="AVIS" />
        <div className="px-3 mt-4 pb-4">
          <p className="text-[12px] mb-3" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.55 }}>
            De vrais messages de clients, en capture d'écran. Appuie sur une image pour la lire en grand.
          </p>
          <Carrousel images={AVIS} />
        </div>
      </>
    );
  }

  return (
    <>
      <BarreSection titre="AVIS" />
      <div className="px-3 mt-4">
        <div className="rounded-2xl p-6 text-center" style={{ background: CARTE, border: `1px solid ${bordure}` }}>
          <Star size={28} color={jaune} className="mx-auto" />
          <p className="mt-3" style={{ fontFamily: TITRE, fontSize: 19, color: texte }}>PAS ENCORE D'AVIS</p>
          <p className="text-[13px] mt-2" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.6 }}>
            Les avis affichés ici sont de vrais messages de clients, publiés tels quels. Rien n'est inventé.
          </p>
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
        /* LE TITRE PAR-DESSUS LA VIDÉO.

           Le texte d'ouverture n'apparaissait que faute de vidéo : dès qu'on en
           mettait une, le nom de la boutique disparaissait. Or c'est justement
           là qu'il sert — trois secondes d'images, et rien pour dire chez qui
           on vient d'entrer.

           Il se pose donc SUR la vidéo, au centre, sur un voile sombre. Le
           voile n'est pas une décoration : un titre clair sur des images
           claires ne se lit pas, et une vidéo change d'image vingt-cinq fois
           par seconde. Le voile est le seul moyen de tenir la lisibilité sans
           connaître le film.

           « pointer-events-none » : le doigt traverse le texte et atteint le
           fond, qui referme l'ouverture. Sans cela, taper sur le titre — le
           plus gros élément de l'écran — ne ferait rien. */
        <div className="relative">
          <video
            src={INTRO.video}
            autoPlay
            muted
            playsInline
            onEnded={fermer}
            onError={fermer}
            className="block max-w-full max-h-[76vh] rounded-2xl"
            style={{ border: `2px solid ${rose}`, boxShadow: `0 0 40px ${rose}55` }}
          />
          {INTRO.texte && (
            <div
              className="absolute inset-0 flex items-center justify-center px-5 rounded-2xl pointer-events-none"
              style={{
                /* Le voile est le plus sombre AU CENTRE, là où le titre se pose.
                   Un dégradé du bas vers le haut, comme sur les tuiles de marque,
                   laissait justement le milieu de l'image en clair : le texte y
                   tombait sur la partie la moins couverte. */
                background: "radial-gradient(ellipse at center, rgba(0,0,0,.66) 0%, rgba(0,0,0,.44) 58%, rgba(0,0,0,.58) 100%)",
                /* L'ombre est portée par le cadre, non par le texte : les
                   lettres sont transparentes — c'est le dégradé qui se voit à
                   travers — et une ombre de texte n'aurait rien à assombrir. */
                filter: "drop-shadow(0 2px 14px rgba(0,0,0,.9))",
              }}
            >
              <p
                className="atelier-anime text-center"
                style={{
                  fontFamily: TITRE, fontSize: "clamp(26px, 8.5vw, 54px)", lineHeight: 1.02,
                  backgroundImage: DEGRADE, WebkitBackgroundClip: "text", backgroundClip: "text",
                  color: "transparent",
                  animation: "atelier-apparition .8s cubic-bezier(.2,.9,.2,1) both, atelier-lueur 2.4s ease-in-out .8s infinite",
                }}
              >
                {INTRO.texte}
              </p>
            </div>
          )}
        </div>
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
  const photos = GALERIE(produit);
  const affichees = photos.length ? photos : [visuelProduit(produit, famille.couleurs, famille.glyphe)];
  const plusieurs = affichees.length > 1;
  const aVideo = !!(produit.video || "").trim();

  const [i, setI] = useState(depart);
  // Un produit filmé et non photographié s'ouvre directement sur son film :
  // sinon la visionneuse s'ouvrait sur le dessin de remplacement, et il fallait
  // encore un bouton pour atteindre la seule vraie image du produit.
  const [surVideo, setSurVideo] = useState(aVideo && photos.length === 0);
  const doigtX = useRef(null);

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
                    key={p.cle || p.ref}
                    onClick={() => jouable && onVideo(p)}
                    className="relative rounded-2xl overflow-hidden text-left active:scale-[0.97] transition-transform"
                    style={{
                      border: `2px solid ${jouable ? famille.couleurs[0] : bordure}`,
                      boxShadow: jouable ? `0 0 18px ${famille.couleurs[0]}33` : "none",
                      opacity: jouable ? 1 : 0.55,
                    }}
                  >
                    {jouable ? (
                      <VignetteVideo produit={p} famille={famille} source={affiche} className="w-full block" />
                    ) : (
                      <Photo produit={p} secours={SECOURS(p, famille)} source={affiche} alt={p.nom} className="w-full block" />
                    )}
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
  // Une seule reference par visite : elle doit rester la meme entre le panier,
  // le message envoye et le virement, sinon elle ne relie rien.
  const [reference] = useState(referenceCommande);
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

/* Deux pointures du même modèle sont DEUX lignes de commande, pas une.
     C'est pourquoi l'article est reconnu par sa référence ET par la taille et
     la couleur choisies : sans cela, commander un 42 après un 40 remplacerait
     silencieusement le premier, et le vendeur enverrait deux fois la même
     paire. Un client qui ne choisit rien retombe sur l'ancien comportement. */
  const ajouter = (p, qte, taille = "", couleur = "") => {
    const meme = (i) => i.ref === p.ref && (i.taille || "") === taille && (i.couleur || "") === couleur;
    setPanier((actuel) => {
      if (actuel.find(meme)) return actuel.map((i) => (meme(i) ? { ...i, qty: i.qty + qte } : i));
      return [...actuel, { ref: p.ref, nom: p.nom, unite: p.unite, prix: p.prix, qty: qte, taille, couleur }];
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

  /* Choisir une famille remet les niveaux du dessous à zéro.
     Sans ça, un produit ou une gamme d'une visite précédente restait en
     mémoire : on cliquait sur une famille et c'est l'ancien écran qui
     revenait. Le bouton semblait alors « ne pas marcher », et seulement de
     temps en temps — selon ce qu'on avait consulté avant. */
  const choisirFamille = (f) => {
    setOnglet("accueil"); setProduit(null); setGamme(null); setFamille(f);
  };

  // Depuis un article on revient a la famille ; depuis la famille, a l accueil.
  // Il n y a plus de niveau intermediaire a traverser.
  const retour = () => {
    if (produit) { setProduit(null); return; }
    setGamme(null); setFamille(null);
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
            {PEUT_COMMANDER && (
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
            )}
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
            ) : famille && PRESENTATION === "marques" ? (
              <EcranCarrousel famille={famille} onAjouter={ajouter} onRetour={retour} />
            ) : famille ? (
              <EcranProduits famille={famille} gamme={gamme} onProduit={allerProduit} onRetour={retour} />
            ) : PRESENTATION === "liste" ? (
              <EcranListe onProduit={allerProduit} onFamille={choisirFamille} />
            ) : PRESENTATION === "marques" ? (
              <EcranMarques onFamille={choisirFamille} />
            ) : PRESENTATION === "luxe" ? (
              <EcranLuxe onFamille={choisirFamille} onProduit={allerProduit} />
            ) : (
              <EcranFamilles onFamille={choisirFamille} onProduit={allerProduit} />
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
        {panierOuvert && PEUT_COMMANDER && (
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

                  {/* Les moyens de paiement se lisent AVANT d'envoyer la
                      commande : découvrir qu'on ne peut payer qu'en espèces
                      après coup, c'est une commande annulée. */}
                  <div className="mb-3">
                    <MoyensDePaiement total={cartTotal(panier)} reference={reference} />
                  </div>

                  {/* Le bouton d'envoi peut être éteint depuis l'atelier : une
                      boutique qui n'encaisse qu'en ligne n'a pas de commande à
                      recevoir dans une conversation. */}
                  {/* Sans contact renseigné, le lien mènerait dans le vide :
                      wa.me sans numéro, t.me sans pseudo. Un bouton qui ne mène
                      nulle part est pire que pas de bouton. */}
                  {BOUTIQUE.commandeActive !== false && CONTACT ? (
                    <>
                      <a
                        href={lienCommande(panier, reference)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => { if (!MESSAGERIE.prerempli) copierAvantDePartir(texteCommande(panier, reference)); }}
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
                    </>
                  ) : (
                    <p className="text-[11.5px] text-center" style={{ color: texteDoux, fontFamily: CORPS, lineHeight: 1.5 }}>
                      Règle ta commande par un des moyens ci-dessus,
                      <br />en indiquant la référence <b style={{ color: jaune }}>{reference}</b>.
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
