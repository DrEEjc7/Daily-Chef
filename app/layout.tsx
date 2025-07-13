import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Daily Chef - Recipe Generator",
  description: "Discover personalized recipes that match your taste preferences and dietary needs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          type="image/svg+xml"
          href="https://ik.imagekit.io/dee7studio/Logos/Andrej%20The%20Chef%20Icon.svg?updatedAt=1752329928330"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
