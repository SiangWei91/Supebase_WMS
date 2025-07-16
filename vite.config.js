import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    headers: {
      'Accept': 'application/json'
    }
  }
})
