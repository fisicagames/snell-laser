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
    modulePreload: false, 
    rollupOptions: {
      output: {
        // FORÇA O VITE A GERAR UM ÚNICO ARQUIVO JS
        // Isso embute até mesmo os imports dinâmicos (como o seu Inspector)
        inlineDynamicImports: true,
        
        // Mantemos apenas a nomenclatura do arquivo de entrada e assets
        entryFileNames: 'assets/js/bundle-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
        
        // manualChunks e chunkFileNames foram removidos, 
        // pois não haverá mais "chunks" (pedaços) separados.
      },
    },
  },
  optimizeDeps: {
    exclude: ['@babylonjs/havok']
  }
});