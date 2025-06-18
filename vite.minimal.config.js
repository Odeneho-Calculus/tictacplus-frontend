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
        port: 5174,
        proxy: {
            '/api': {
                target: 'https://172.236.22.145',
                changeOrigin: true,
                secure: false,
            },
            '/socket.io': {
                target: 'https://172.236.22.145',
                changeOrigin: true,
                ws: true,
            }
        }
    },
    esbuild: {
        target: 'es2020'
    }
});