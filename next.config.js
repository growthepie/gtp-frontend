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
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "icons.growthepie.xyz",
            },
          ],
          destination: "/icons",
        },
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "dev.icons.growthepie.xyz",
            },
          ],
          destination: "/icons",
        },
      ],
    };
  },
  async redirects() {
    return [
      {
        source: "/data-availability/blob-producers",
        destination: "/data-availability/da-consumers",
        permanent: true,
      },
      {
        source: "/fundamentals/total-value-locked",
        destination: "/fundamentals/total-value-secured",
        permanent: true,
      },
      {
        source: "/labels",
        destination: "https://labels.growthepie.xyz/",
        permanent: true,
      },
      {
        source: "/optimism-retropgf-3",
        destination: "/trackers/optimism-retropgf-3",
        permanent: true,
      },
      {
        source: "/trackers/octant-v2",
        destination: "/trackers/octant",
        permanent: true,
      },
      {
        source: "/trackers/octant-v3",
        destination: "/trackers/octant",
        permanent: true,
      },
      {
        source: "/donategiveth",
        destination:
          "https://giveth.io/project/growthepie-analytics-for-ethereum-scaling-solutions",
        permanent: true,
      },
      {
        source: "/donateeth",
        destination:
          "https://etherscan.io/address/0x7291a5Aa55886900C460Bf4366A46820F40476fB",
        permanent: true,
      },
      {
        source: "/donateop",
        destination:
          "https://optimistic.etherscan.io/address/0x700E73d289DE10b6143465E02E6931E6e6a0CA15",
        permanent: true,
      },
      {
        source: "/donatebase",
        destination:
          "https://basescan.org/address/0xC9847131b6acb8dA9BfC4Ec970Be1D604215A1E4",
        permanent: true,
      },
      {
        source: "/donatearb",
        destination:
          "https://arbiscan.io/address/0x18f79D6d2166997c9A237C25c4692647CD4faf59",
        permanent: true,
      },
    ];
  },
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
      {
        protocol: "https",
        hostname: "api.growthepie.xyz",
      },
    ],
  },
};

// const millionConfig = {
//   auto: true,
// };

module.exports = nextConfig;

// export default million.next(nextConfig, millionConfig);
