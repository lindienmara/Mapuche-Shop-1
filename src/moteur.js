// VERSION DU MOTEUR
// -----------------
// Ce fichier ne contient rien de propre à la boutique : il dit seulement quelle
// version du moteur elle fait tourner. La boutique le publie dans donnees.json,
// et l'atelier compare cette version à la sienne pour savoir si une mise à jour
// existe.
//
// Ne pas modifier à la main. La version est celle du logiciel qui a créé ou mis
// à jour cette boutique.

export const MOTEUR = {
  modele: "vitrine-3-niveaux",
  version: "3.12",
  // Ce que sait faire cette version, pour information.
  capacites: [
    "familles > gammes > produits",
    "panier et commande WhatsApp",
    "plusieurs photos par produit avec visionneuse",
    "video par produit",
    "famille galerie de videos",
    "ouverture animee au demarrage",
    "image de fond et espaces transparents",
    "photo entiere ou recadree, au choix",
    "un produit en vedette sur l accueil",
    "commande sur WhatsApp, Telegram, Signal ou Snapchat",
    "photos en portrait, paysage ou forme d origine",
    "photos enregistrees entieres, cadrage modifiable a tout moment",
    "presentation en familles ou en liste, au choix",
    "les deux types de boutique sont separes : corriger l un ne touche pas l autre",
    "choisir une categorie ne montre plus que cette categorie",
    "une famille sans article le dit, au lieu d ouvrir un ecran vide",
    "trois types de boutique : par familles, en liste, ou La Maison",
    "une famille mene directement a ses articles, avec un bouton pour remonter",
    "des references de produit en double n empechent plus l affichage",
  ],
};
