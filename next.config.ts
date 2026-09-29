import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (server + only the
  // node_modules it actually needs) — what the Docker image in deploy/
  // copies into the runtime stage. Vercel has its own equivalent packaging
  // and its build pipeline breaks if this is also set (it errors looking
  // for a .nft.json file standalone mode doesn't produce), so this must
  // stay off whenever VERCEL=1 — Vercel sets that automatically, the same
  // flag src/lib/attachment-storage.ts already keys off of.
  output: process.env.VERCEL === "1" ? undefined : "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
