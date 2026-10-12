import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // Placeholder renders (PLACEHOLDER_IMAGE) until real project photos land.
    remotePatterns: [{ protocol: "https", hostname: "placehold.net" }],
  },
};

export default nextConfig;
