/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: ["ipfs.io", "content.optimism.io"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "content.optimism.io",
      },
    ],
  },
};

module.exports = nextConfig;
