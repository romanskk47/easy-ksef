import { defineConfig } from 'vite';
import { rmSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const cleanUiAssets={name:'clean-ui-assets',buildStart(){rmSync(new URL('./app/ui-assets',import.meta.url),{recursive:true,force:true});}};
export default defineConfig({root:'ui',base:'./',plugins:[cleanUiAssets,react(),tailwindcss()],build:{outDir:'../app',emptyOutDir:false,assetsDir:'ui-assets',target:'chrome144',sourcemap:false}});
