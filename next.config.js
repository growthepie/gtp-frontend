/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  experimental: {
    appDir: true,
  },
  images: {
    domains: ["ipfs.io"],
  },
};

module.exports = nextConfig;
