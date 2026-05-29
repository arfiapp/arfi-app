import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const emptyStub = path.join(__dirname, "lib/stubs/empty-module.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["viem", "wagmi", "@wagmi/core", "@rainbow-me/rainbowkit"]
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": emptyStub
    };
    return config;
  }
};

export default nextConfig;
