// import million from "million/compiler";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
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
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "labels.growthepie.xyz",
            },
          ],
          destination: "/labels",
        },
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "dev.labels.growthepie.xyz",
            },
          ],
          destination: "/labels",
        },
      ],
    };
  },
  // async redirects() {
  //   return [
  //     {
  //       source: "/optimism-retropgf-3",
  //       destination: "/trackers/optimism-retropgf-3",
  //       permanent: true,
  //     },
  //   ];
  // },
  images: {
    dangerouslyAllowSVG: true,
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

export default nextConfig;

// export default million.next(nextConfig, millionConfig);
