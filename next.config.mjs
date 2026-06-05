/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: "http",
    hostname: "10.0.0.105",
    port: "9000",
    pathname: "/gallery/**",
  },
];

if (process.env.NEXT_PUBLIC_IMAGE_URL) {
  const { hostname, pathname } = new URL(process.env.NEXT_PUBLIC_IMAGE_URL);
  remotePatterns.push({ protocol: "https", hostname, pathname: `${pathname}/**` });
}

const nextConfig = {
  output: "standalone",
  images: { remotePatterns },
};

export default nextConfig;
