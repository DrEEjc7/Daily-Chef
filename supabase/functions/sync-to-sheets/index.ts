import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Airtable from "npm:airtable"
import { Deno } from "https://deno.land/std@0.168.0/io/mod.ts" // Declare Deno variable

// Initialize Airtable client
const airtableBase = new Airtable({ apiKey: Deno.env.get("AIRTABLE_API_KEY") }).base(Deno.env.get("AIRTABLE_BASE_ID"))

serve(async (req) => {
  try {
    const payload = await req.json()

    // The webhook payload from Supabase contains the new record
    const newRecipe = payload.record

    if (!newRecipe) {
      return new Response("No recipe data found in payload", { status: 400 })
    }

    console.log(`Syncing recipe: ${newRecipe.name}`)

    // --- Sync to Airtable ---
    await airtableBase(Deno.env.get("AIRTABLE_TABLE_NAME")).create([
      {
        fields: {
          // Map your Supabase columns to your Airtable fields
          "Recipe Name": newRecipe.recipe_name,
          URL: newRecipe.url,
          Description: newRecipe.description,
          "Meal Type": newRecipe.meal_type,
          // etc.
        },
      },
    ])

    // You could add a similar function here for Google Sheets API

    return new Response(JSON.stringify({ message: "Sync successful!" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    console.error("Sync failed:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
