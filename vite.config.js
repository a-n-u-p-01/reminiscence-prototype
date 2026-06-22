import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      registerType: "autoUpdate",

      injectRegister: "auto",

      includeAssets: [
        "favicon.png",
        "apple-touch-icon.png",
        "masked-icon.svg"
      ],

      manifest: {
        id: "/",

        name: "Reminiscence",
        short_name: "Reminiscence",

        description:
          "A focused spaced-repetition workspace that turns daily learning into long-term memory.",

        start_url: "/",

        scope: "/",

        display: "standalone",

        orientation: "portrait",

        background_color: "#09090b",

        theme_color: "#09090b",

        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },

          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          },

          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },

      workbox: {
        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        globPatterns: [
          "**/*.{js,css,html,png,svg,json,ico}"
        ]
      }
    })
  ]
});