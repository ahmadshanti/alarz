import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    // images uploaded through the CMS are served by Payload at /api/media/file/<name>
    // (+ the statically imported photos in src/assets, which Next serves from /_next/static/media)
    localPatterns: [{ pathname: "/media/**" }, { pathname: "/api/media/file/**" }, { pathname: "/_next/static/media/**" }],
  },
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
