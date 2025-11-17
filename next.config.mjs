/** @type {import('next').NextConfig} */

// هل إحنا في production؟ (GitHub Pages)
const isProd = process.env.NODE_ENV === "production"

// عدّل اسم الريبو هنا لو مختلف
// مثال: لو الريبو اسمه tmanina يبقى اللينك هيكون:
// https://username.github.io/tmanina
const repoName = "tmanina"

const nextConfig = {
  // علشان نقدر نستخدم next export
  output: "export",

  // لو بتستخدم next/image يفضّل حاليًا كده مع الـ export
  images: {
    unoptimized: true,
  },

  // لو الموقع هيشتغل تحت /tmanina على GitHub Pages
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
}

export default nextConfig
