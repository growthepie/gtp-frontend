const AUTH_SUBDOMAIN = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
    scrollRestoration: true,
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
              value: "fees.growthepie.com",
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
              value: "dev.fees.growthepie.com",
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
              value: "labels.growthepie.com",
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
              value: "dev.labels.growthepie.com",
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
              value: "icons.growthepie.com",
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
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "dev.icons.growthepie.com",
            },
          ],
          destination: "/icons",
        },
        ...(AUTH_SUBDOMAIN ? [
        {
          source: "/",
          has: [
            {
              type: "host",
              value: AUTH_SUBDOMAIN + ".growthepie.com",
            },
          ],
          destination: "/chains/" + AUTH_SUBDOMAIN,
        },
        {
          source: "/landing",
          has: [
            {
              type: "host",
              value: AUTH_SUBDOMAIN + ".growthepie.com",
            },
          ],
          destination: "/",
        },
        {
          source: "/",
          has: [
            {
              type: "host",
              value: AUTH_SUBDOMAIN + "-dev.growthepie.com",
            },
          ],
          destination: "/chains/" + AUTH_SUBDOMAIN,
        },
        {
          source: "/landing",
          has: [
            {
              type: "host",
              value: AUTH_SUBDOMAIN + "-dev.growthepie.com",
            },
          ],
          destination: "/",
        }] : []),
      ],
    };
  },
  async redirects() {
    // Skip certain redirects in development environment
    const isDevelopment = process.env.NODE_ENV === 'development';
    
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
      // Only include the icons redirect in production, not in development
      ...(isDevelopment ? [] : [{
        source: "/icons",
        destination: "https://icons.growthepie.com/",
        permanent: true,
      }]),
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
      {
        source: "/ethereum-ecosystem",
        destination: "/ethereum-ecosystem/metrics",
        permanent: false,
      },
      {
        source: "/quick-bites/shopify-usdc",
        destination: "/quick-bites/base-commerce",
        permanent: true,
      }
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
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "api.growthepie.xyz",
      },
      {
        protocol: "https",
        hostname: "api.growthepie.com",
      },
    ],
  },
};

// const millionConfig = {
//   auto: true,
// };

module.exports = nextConfig;

// export default million.next(nextConfig, millionConfig);
