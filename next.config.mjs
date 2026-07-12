/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // A Meta Ad Library serve criativos por CDNs variadas do Facebook.
    // Liberamos os hosts conhecidos; ajuste conforme o provider escolhido.
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "scontent.**" },
    ],
  },
};

export default nextConfig;
