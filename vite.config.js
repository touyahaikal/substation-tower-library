import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes the build work on any https://<username>.github.io/<repo-name>/ URL
export default defineConfig({
  base: './',
  plugins: [react()],
})
