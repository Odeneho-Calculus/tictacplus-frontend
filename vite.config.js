import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: {
          // Use legacy API with older Sass version
          api: 'legacy',
          // Silence deprecation warnings
          silenceDeprecations: ['legacy-js-api', 'strict-unary'],
          // Optimized compiler options
          charset: false,
          sourceMap: false, // Disable source maps to save memory
          quietDeps: true,
          style: 'compressed', // Use compressed output to save memory
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@store': path.resolve(__dirname, './src/store'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './public/assets'),
      }
    },
    server: {
      host: true,
      open: true,
      hmr: {
        overlay: false, // Disable error overlay to save memory
      },
      proxy: {
        '/api': {
          target: env.VITE_DEV_SERVER_API_TARGET || 'https://172.236.22.145',
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: env.VITE_SOCKET_URL || 'https://172.236.22.145',
          changeOrigin: true,
          ws: true,
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            redux: ['@reduxjs/toolkit', 'react-redux'],
            animations: ['framer-motion', 'lottie-react'],
            socket: ['socket.io-client']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'framer-motion', 'lottie-react'],
      // Force pre-bundling to reduce memory usage during dev
      force: true
    },
    // Development performance optimizations
    esbuild: {
      // Disable dropping console logs in development
      drop: mode === 'production' ? ['console', 'debugger'] : [],
      // Target ES2020 to reduce compilation overhead
      target: 'es2020'
    },
    // Reduce memory usage
    define: {
      // Only define what's necessary
      __DEV__: mode === 'development'
    }
  }
})