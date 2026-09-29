import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a self-contained .next/standalone build (server + only the
  // node_modules it actually needs) — what the Docker image in deploy/
  // copies into the runtime stage. Vercel ignores this and builds its own
  // way, so it's safe to leave on for both deployment targets.
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
