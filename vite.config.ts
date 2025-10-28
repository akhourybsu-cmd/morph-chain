import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// Plugin to generate version.json on build
const versionPlugin = () => ({
  name: 'version-generator',
  buildStart() {
    const version = {
      version: process.env.npm_package_version || "1.0.0",
      timestamp: new Date().toISOString(),
      buildTime: Date.now()
    };
    
    // Write to public directory so it's served as a static asset
    const versionPath = path.resolve(__dirname, 'public/version.json');
    fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));
    console.log('✓ Generated version.json:', version.timestamp);
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    versionPlugin()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
}));
