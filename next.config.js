// import million from "million/compiler";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "fees.growthepie.xyz",
            },
          ],
          destination: "/fees",
        },
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "dev.fees.growthepie.xyz",
            },
          ],
          destination: "/fees",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/optimism-retropgf-3",
        destination: "/trackers/optimism-retropgf-3",
        permanent: true,
      },
    ];
  },
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

// const millionConfig = {
//   auto: true,
// };

module.exports = nextConfig;

// export default million.next(nextConfig, millionConfig);
