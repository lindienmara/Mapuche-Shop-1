// TYPE DE BOUTIQUE N° 1 — LA VITRINE PAR FAMILLES
// -----------------------------------------------
// On entre par une grande image de famille, puis on descend :
//   famille → gamme → produit.
// Chaque famille a sa couleur et son affiche ; le catalogue se decouvre par
// etapes, comme les rayons d'une boutique.
//
// ★ CE FICHIER N'APPARTIENT QU'A CE TYPE.
// Le modifier ne touche AUCUNE boutique de type 2. A l'inverse, tout ce qui
// doit valoir pour les deux types se corrige dans commun.jsx.

import React from "react";
import { Star, PlayCircle } from "lucide-react";
import { visuelFamille } from "./visuels.js";
import {
  BOUTIQUE, FAMILLES, SELECTION_CHEF, EST_VIDEOS, Vedettes, Prix,
  VOILE, CARTE, TITRE, CORPS, bordure, texte, texteDoux, jaune, cyan,
} from "./commun.jsx";

export function EcranFamilles({ onFamille, onProduit }) {
  // Le bloc « mis en avant » disparait completement si son titre est vide dans
  // config.js, ou si aucun produit n'est marque en avant.
  const montrerEnAvant = !!(BOUTIQUE.enAvant || "").trim() && SELECTION_CHEF.length > 0;

  return (
    <>
      <Vedettes onProduit={onProduit} />
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
                      key={p.cle || p.ref}
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

      <div className="flex flex-col gap-4 px-3 mt-4">
        {FAMILLES.map((f) => (
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
