import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // DESATIVA o pré-carregamento de módulos. 
    // Isso impede que o Vite coloque o Inspector no seu index.html.
    modulePreload: false, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Agrupamos o motor essencial (Core, GUI e Loaders).
          // Isso evita erros de inicialização e reduz as conexões mobile.
          if (
            id.includes('@babylonjs/core') ||
            id.includes('@babylonjs/loaders') ||
            id.includes('@babylonjs/gui')
          ) {
            return 'babylon-engine';
          }
          // Deixamos o Inspector em paz. Como ele é importado dinamicamente 
          // no game.ts, o Vite criará um arquivo separado automaticamente.
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      },
    },
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  }
});