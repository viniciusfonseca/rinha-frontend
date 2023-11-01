import { defineConfig } from 'vite'
import million from 'million/compiler'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [million.vite(), react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.jsx'),
      },
      output: {
        entryFileNames: `index.js`,
      },
    }
  }
})