/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Cloudinary — imagens dos negócios
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Google — avatares dos usuários via OAuth
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
}

export default nextConfig
