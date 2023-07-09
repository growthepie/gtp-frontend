/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["ipfs.io"],
  },
};

module.exports = nextConfig;
