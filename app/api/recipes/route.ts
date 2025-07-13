import { NextResponse } from "next/server"

// This tells Next.js to always run this function dynamically, not at build time.
export const dynamic = "force-dynamic"

// These would be your environment variables.
// I've used the ones from your original file.
const AIRTABLE_API_KEY = "patdEx07FVD2fVn3n.43bb9c4e2335068c0a1a77dde7eac3a73a4a470b95bffe3dc4f2d4c5b907e711"
const AIRTABLE_BASE_ID = "appEeK6TzbyxOgHdU"
const AIRTABLE_TABLE_NAME = "Recipes"

export async function GET() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_NAME) {
    return NextResponse.json({ error: "Airtable configuration is missing." }, { status: 500 })
  }

  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
      // Cache the response for 1 hour to improve performance and reduce API calls
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Airtable API Error:", errorData)
      throw new Error(`Airtable API error: ${response.statusText}`)
    }

    const data = await response.json()
    const recipes = data.records.map((record: any) => ({
      id: record.id,
      ...record.fields,
    }))

    return NextResponse.json(recipes)
  } catch (error) {
    console.error("Error fetching from Airtable:", error)
    return NextResponse.json({ error: "Failed to fetch recipes from Airtable." }, { status: 500 })
  }
}
