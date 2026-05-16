import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
