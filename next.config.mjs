/** @type {import('next').NextConfig} */

const nextConfig = {
  // علشان نقدر نستخدم next export
  output: "export",

  // لو بتستخدم next/image يفضّل حاليًا كده مع الـ export
  images: {
    unoptimized: true,
  },

  // basePath و assetPrefix معطلين لأن الموقع على root domain
  // basePath: "/tmanina",
  // assetPrefix: "/tmanina/",
}

export default nextConfig
