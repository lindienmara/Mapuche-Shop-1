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
  version: "3.31",
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
    "un bouton ouvre la liste complete des familles, rien n est cache hors de l ecran",
    "moyens de paiement annonces, avec liens vers le prestataire",
    "le montant du panier est ajoute au lien PayPal",
    "moyens de paiement sur mesure, nom et lien au choix du vendeur",
    "un moyen de paiement sans compte relie n est jamais propose au client",
    "compte prive ou pro, paiement entre proches ou biens et services, au choix",
    "reference de commande, pour rapprocher un virement d une commande",
    "le bouton d envoi dans la conversation peut etre eteint",
    "sans contact ni paiement, la boutique devient une vitrine sans panier",
    "des avis en images : les captures de conversations defilent en carrousel",
    "le client ne depose plus d avis lui-meme : le vendeur seul les publie",
    "sans moyen d etre contacte, aucun lien vers la messagerie nulle part",
    "quatre types de boutique : familles, liste, La Maison, ou par marques",
    "type par marques : une grande photo par marque, puis un carrousel page a page",
    "taille et couleur sur la fiche produit, affichees seulement si renseignees",
    "la taille et la couleur se choisissent au doigt et partent avec la commande",
    "les pointures en rupture sont barrees, visibles mais pas commandables",
    "les photos de marque prennent la meme forme que les photos de produit",
    "une marque peut avoir une video qui tourne a la place de sa photo",
    "chaque marque occupe tout l ecran du telephone, une marque a la fois",
    "les modeles d une marque en vignettes : on voit les couleurs et on choisit",
    "les tailles se lisent quelle que soit la facon de les ecrire : points, virgules, espaces",
    "type par marques : photo en haut, tailles et prix dessous, dans une colonne",
    "la video d un produit se joue a meme la fiche, a la place de la photo",
    "une famille entiere peut passer en rupture, sans etre supprimee",
  ],
};
