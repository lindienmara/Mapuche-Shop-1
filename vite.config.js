import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { BOUTIQUE, COULEURS } from './src/config.js'
import { FAMILLES } from './src/catalogue.js'
import { MOTEUR } from './src/moteur.js'

// Publie, à côté de la boutique, un fichier donnees.json qui contient trois
// choses : la version du moteur, l'identité, et le catalogue. L'atelier le lit
// au démarrage au lieu d'embarquer une copie figée. Il affiche donc toujours ce
// qui est réellement en ligne, et sait aussi si le moteur de cette boutique est
// en retard sur le sien.
function donneesPourAtelier() {
  return {
    name: 'donnees-pour-atelier',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'donnees.json',
        source: JSON.stringify({ MOTEUR, BOUTIQUE, COULEURS, FAMILLES }, null, 2),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), donneesPourAtelier()],
})
