import { Suspense } from "react"
import { HomeClient } from "@/components/home-client"

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeClient />
    </Suspense>
  )
}
