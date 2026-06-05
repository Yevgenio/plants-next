/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "objectstorage.il-jerusalem-1.oraclecloud.com",
        pathname: "/n/axftwemw5l5c/b/gallery/o/**",
      },
      {
        protocol: "http",
        hostname: "10.0.0.105",
        port: "9000",
        pathname: "/gallery/**",
      },
    ],
  },
};

export default nextConfig;
