// Integração com Cloudinary — upload e gestão de imagens

import { v2 as cloudinary } from "cloudinary"

// Configura o Cloudinary com variáveis de ambiente (server-side apenas)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export type UploadResult = {
  url: string
  publicId: string
}

// Faz upload de uma imagem (buffer ou URL) para o Cloudinary
export async function uploadImage(
  source: string,
  folder = "empreende-general"
): Promise<UploadResult> {
  const result = await cloudinary.uploader.upload(source, {
    folder,
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  })

  return {
    url: result.secure_url,
    publicId: result.public_id,
  }
}

// Remove uma imagem do Cloudinary pelo publicId
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
