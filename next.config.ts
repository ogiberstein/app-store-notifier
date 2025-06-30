import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright-extra', 'puppeteer-extra-plugin-stealth'],
  },
};

export default nextConfig;
