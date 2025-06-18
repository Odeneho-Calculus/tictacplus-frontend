import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    root: '.',
    css: {
        // Disable SCSS processing entirely to avoid memory issues
        preprocessorOptions: {},
    },
    build: {
        outDir: 'dist-minimal',
        rollupOptions: {
            input: './src/main.minimal.jsx'
        }
    },
    server: {
        host: true,
        open: true,
        port: 5174
    },
    esbuild: {
        target: 'es2020'
    }
});