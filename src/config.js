// IDENTITÉ DE LA BOUTIQUE
// -----------------------
// Fichier produit par l'atelier : file://

export const BOUTIQUE = {
  nom: "Mapuche-Shop-1",
  bandeau: "CRÉATIONS ORIGINALES 🏆",
  sousTitre: "boutique officielle",

  // Logo : un emoji, ou un fichier déposé dans public/ (prioritaire).
  emoji: "",
  logo: "/produits/logo.jpg",

  // Image de fond de la boutique, dans public/. Vide = simple halo coloré.
  fondImage: "/produits/fond.jpg",

  // Dépôt GitHub de cette boutique, lu par l'atelier pour publier.
  depot: "lindienmara/Mapuche-Shop-1",

  // Où arrivent les commandes : whatsapp, telegram, signal ou snapchat.
  // « contact » est le numéro ou le pseudo selon l'application choisie.
  messagerie: "whatsapp",
  contact: "33758810894",
  // Conservé pour les boutiques encore sur un ancien moteur.
  whatsapp: "33758810894",
  accroche: "Bonjour Mapuche-Shop-1, je souhaite commander :",

  // Présentation du catalogue : "familles" (on descend) ou "liste" (tout sur
  // une page, avec recherche). Changeable à tout moment.
  presentation: "familles",

  // Forme du cadre réservé aux photos : carre, portrait, paysage ou libre.
  formatPhoto: "portrait",
  // true = image entière dans ce cadre, false = recadrée pour le remplir.
  // Chaque produit peut décider autrement, dans son propre champ « cadrage ».
  imageEntiere: false,

  // Bloc mis en avant sur l'accueil. Vide = masqué.
  enAvant: "",

  // Ouverture de la boutique, jouée une fois par visite.
  // introVideo vide = titre animé, sans rien à charger.
  introActive: true,
  introTexte: "Mapuche ARTS ",
  introVideo: "",
  introDuree: 4,

  // Onglets du bas de la boutique.
  afficherInfos: true,
  afficherLiens: true,
  afficherAvis: true,

  info: [
    { titre: "Horaires ", texte: "24/24" },
    { titre: "Zone de livraison", texte: "Toutes la France " },
    { titre: "Délai de préparation", texte: "24/48H" },
    { titre: "Moyens de paiement", texte: "PCS/Virement /PayPal " },
  ],

  liens: [
    { titre: "👻SnapChat👻", url: "https://www.snapchat.com/add/mapuche_art?share_id=dx4YhJ92Y5Y&locale=fr-FR" },
    { titre: "👽TikTok👽", url: "https://www.tiktok.com/@mapuche.arts?_r=1&_t=ZN-98pmckqPQ62" },
  ],
};

export const COULEURS = {
  rose: "#A31621",
  violet: "#5A0E16",
  jaune: "#F2E8CF",
  vert: "#D9C79A",
  cyan: "#F2E8CF",
  halo: "#24070B",
  fond: "#120A0B",
  fondCarte: "#1C1113",
  bordure: "#33211F",
  texte: "#FFFFFF",
  texteDoux: "#B7A79E",
};
