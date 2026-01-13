/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['kal-shared'],
  output: 'standalone',
};

export default nextConfig;
