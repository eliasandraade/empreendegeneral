/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin usa módulos nativos do Node — não deve ser bundlado pelo webpack
  serverExternalPackages: ["firebase-admin"],

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
