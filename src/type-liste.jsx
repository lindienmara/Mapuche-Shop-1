// TYPE DE BOUTIQUE N° 2 — LA LISTE
// --------------------------------
// Le meme catalogue, montre autrement : tout sur une page, avec une barre de
// recherche et des pastilles de categories. Rien a redescendre, rien a ouvrir.
// Convient aux boutiques dont le stock se parcourt d'un coup d'oeil.
//
// ★ CE FICHIER N'APPARTIENT QU'A CE TYPE.
// Le modifier ne touche AUCUNE boutique de type 1.

import React, { useState, useMemo } from "react";
import { Search, PlayCircle, Star, X } from "lucide-react";
import { visuelProduit } from "./visuels.js";
import {
  BOUTIQUE, FAMILLES, TOUS_PRODUITS, EST_VIDEOS, SECOURS, GALERIE, AJUSTEMENT,
  STYLE_PHOTO, Vedettes, RemonterEnHaut, ToutesLesFamilles, Photo, Prix, Etiquette, VOILE, CARTE, COLONNE, DEGRADE,
  TITRE, CORPS, euros, fond, fondCarte, bordure, texte, texteDoux, rose, violet,
  vert, jaune, cyan,
} from "./commun.jsx";

export function EcranListe({ onProduit, onFamille }) {
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

  /* Quand le client choisit une categorie, il ne veut voir QUE cette
     categorie. Les vedettes viennent de toutes les familles : les laisser
     afficherait un fruit au-dessus d'une liste de legumes, et brouillerait
     justement ce qu'il vient de demander. Meme chose pendant une recherche.
     Elles reviennent des qu'il reprend « TOUT VOIR ». */
  const toutAfficher = filtre === "tous" && !recherche.trim();

  return (
    <>
      <RemonterEnHaut articles={produits.length} />
      {toutAfficher && <Vedettes onProduit={onProduit} />}
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

      {/* La rangée de pastilles défile de côté : passé la troisième famille, le
          client ne sait pas que les autres existent. Ce bouton ouvre la liste
          entière, avec le compte de chacune — et « Tout voir » y figure en tête,
          donc rien n'est perdu de ce que faisait l'ancienne pastille. */}
      <ToutesLesFamilles
        familles={FAMILLES}
        actif={filtre}
        total={TOUS_PRODUITS.length}
        onTout={() => setFiltre("tous")}
        onFamille={(f) => (EST_VIDEOS(f) ? onFamille(f) : setFiltre(f.id))}
      />

      <div className="flex gap-2 overflow-x-auto px-3 mt-3 pb-1" style={{ scrollbarWidth: "none" }}>
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
              key={p.cle || p.ref}
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

