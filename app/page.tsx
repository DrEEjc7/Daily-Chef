"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

// Define the type for a recipe for better code quality
interface Recipe {
  id: string
  "Recipe Name"?: string
  Name?: string
  Description?: string
  "Short Description"?: string
  URL?: string
  Link?: string
  Image?: any[]
  Photo?: any[]
  "Image URL"?: string
  Photos?: any[]
  Images?: any[]
  Picture?: any[]
  "Meal Type"?: string
  Protein?: string
  Cuisine?: string
  "Cook Time"?: string
}

// Helper to get image URL from various possible fields in Airtable
const getImageUrl = (recipe: Recipe | null): string => {
  if (!recipe) return ""
  const imageFields = ["Image", "Photo", "Image URL", "Photos", "Images", "Picture"]
  for (const field of imageFields) {
    const fieldValue = recipe[field as keyof Recipe]
    if (fieldValue) {
      if (Array.isArray(fieldValue) && fieldValue.length > 0) {
        return fieldValue[0].url || fieldValue[0].thumbnails?.large?.url || ""
      }
      if (typeof fieldValue === "string") {
        return fieldValue
      }
    }
  }
  return ""
}

export default function HomePage() {
  // State variables to manage the app's data and UI
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([])
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([])
  const [displayedRecipe, setDisplayedRecipe] = useState<Recipe | null>(null)
  const [dailyRecipe, setDailyRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<"initial" | "filtering" | "random">("initial")

  // State for the filter dropdowns
  const [mealType, setMealType] = useState("")
  const [protein, setProtein] = useState("")
  const [cuisine, setCuisine] = useState("")
  const [cookTime, setCookTime] = useState("")

  // Fetch recipes from our secure API endpoint
  const loadRecipes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/recipes")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch recipes")
      }
      const data: Recipe[] = await response.json()
      setAllRecipes(data)
    } catch (err: any) {
      setError(err.message)
      console.error("Error loading recipes:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load recipes on the initial page load
  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  // Set the "Recipe of the Day" once recipes are loaded
  useEffect(() => {
    if (allRecipes.length > 0) {
      const today = new Date()
      const dayOfYear = Math.floor(
        (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
      )
      const recipeIndex = dayOfYear % allRecipes.length
      setDailyRecipe(allRecipes[recipeIndex])
    }
  }, [allRecipes])

  // Memoize daily recipe details to avoid re-calculating on every render
  const dailyRecipeDetails = useMemo(() => {
    if (!dailyRecipe) return null
    return {
      name: dailyRecipe["Recipe Name"] || dailyRecipe["Name"] || "Today's Special Recipe",
      description:
        dailyRecipe["Description"] || dailyRecipe["Short Description"] || "A wonderful recipe to brighten your day!",
      url: dailyRecipe["URL"] || dailyRecipe["Link"] || "#",
      imageUrl: getImageUrl(dailyRecipe),
    }
  }, [dailyRecipe])

  // Automatically filter recipes when dropdowns change
  useEffect(() => {
    // Don't run this on initial load before recipes are available or if a random recipe was just selected
    if ((allRecipes.length === 0 && loading) || searchMode === "random") return

    const hasActiveFilters = mealType || protein || cuisine || cookTime

    if (hasActiveFilters) {
      const filtered = allRecipes.filter(
        (recipe) =>
          (!mealType || recipe["Meal Type"] === mealType) &&
          (!protein || recipe["Protein"] === protein) &&
          (!cuisine || recipe["Cuisine"] === cuisine) &&
          (!cookTime || recipe["Cook Time"] === cookTime),
      )
      setFilteredRecipes(filtered)
      setDisplayedRecipe(filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : null)
      setSearchMode("filtering")
    } else {
      // If no filters are selected, go back to the initial state
      if (searchMode === "filtering") {
        setSearchMode("initial")
        setDisplayedRecipe(null)
        setFilteredRecipes([])
      }
    }
  }, [mealType, protein, cuisine, cookTime, allRecipes, loading, searchMode])

  // Get a completely random recipe, ignoring filters
  const handleRandomRecipe = useCallback(() => {
    if (allRecipes.length > 0) {
      const random = allRecipes[Math.floor(Math.random() * allRecipes.length)]
      setDisplayedRecipe(random)
      // Set filtered recipes to just this one so "Another" button is disabled
      setFilteredRecipes([random])
      setSearchMode("random") // Set mode to random
      // Clear the filter dropdowns
      setMealType("")
      setProtein("")
      setCuisine("")
      setCookTime("")
    }
  }, [allRecipes])

  // Show another recipe from the current filtered list
  const handleShowAnotherRecipe = useCallback(() => {
    if (filteredRecipes.length > 1) {
      let newRecipe
      do {
        newRecipe = filteredRecipes[Math.floor(Math.random() * filteredRecipes.length)]
      } while (newRecipe.id === displayedRecipe?.id) // Ensure it's a different recipe
      setDisplayedRecipe(newRecipe)
    } else if (filteredRecipes.length === 1) {
      // If only one match, do nothing or show a message
    }
  }, [filteredRecipes, displayedRecipe])

  // A reusable component for displaying a recipe card
  const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
    const name = recipe["Recipe Name"] || recipe["Name"] || "Untitled Recipe"
    const description = recipe["Description"] || recipe["Short Description"] || "Delicious recipe to try!"
    const url = recipe["URL"] || recipe["Link"] || "#"
    const imageUrl = getImageUrl(recipe)

    return (
      <div className="recipe-card">
        <div className="recipe-image">
          {imageUrl ? (
            <>
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={name}
                className="recipe-image-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = "none"
                  if (target.nextElementSibling) {
                    ;(target.nextElementSibling as HTMLElement).style.display = "flex"
                  }
                }}
              />
              <div className="recipe-image-placeholder" style={{ display: "none" }}>
                🍽️
              </div>
            </>
          ) : (
            <div className="recipe-image-placeholder">🍽️</div>
          )}
        </div>
        <div className="recipe-content">
          <h3 className="recipe-title">{name}</h3>
          <div className="recipe-meta">
            {recipe["Meal Type"] && <span className="meta-item">🍽️ {recipe["Meal Type"]}</span>}
            {recipe["Protein"] && <span className="meta-item">🥩 {recipe["Protein"]}</span>}
            {recipe["Cuisine"] && <span className="meta-item">🌍 {recipe["Cuisine"]}</span>}
            {recipe["Cook Time"] && <span className="meta-item">⏱️ {recipe["Cook Time"]}</span>}
          </div>
          <p className="recipe-description">{description}</p>
          <a href={url} className="recipe-link" target="_blank" rel="noopener noreferrer">
            View Recipe
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img
              src="https://ik.imagekit.io/dee7studio/Logos/Andrej%20The%20Chef%20Icon.svg?updatedAt=1752329928330"
              alt="Daily Chef Logo"
              className="logo"
            />
            <div className="site-title">Daily Chef</div>
          </div>
          <a href="https://andrejthechef.com" className="website-link" target="_blank" rel="noopener noreferrer">
            Andrej The Chef - Website
          </a>
        </div>
      </header>

      <div className="container">
        <section className="hero-section">
          <h1 className="hero-title">Recipe Generator</h1>
          <p className="hero-subtitle">
            Discover personalized recipes that match your taste preferences and dietary needs
          </p>
        </section>

        <section className="generator-section">
          <h2 className="section-title">Find Your Perfect Recipe</h2>

          <div className="filters">
            {/* Filter dropdowns are now controlled by React state */}
            <div className="filter-group">
              <label className="filter-label">🍽️ Meal Type</label>
              <select className="filter-select" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                <option value="">Select meal type...</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Brunch">Brunch</option>
                <option value="Lunch">Lunch</option>
                <option value="Snack">Snack</option>
                <option value="Dinner">Dinner</option>
                <option value="Dessert">Dessert</option>
                <option value="Fast Food">Fast Food</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">🥩 Protein</label>
              <select className="filter-select" value={protein} onChange={(e) => setProtein(e.target.value)}>
                <option value="">Select protein...</option>
                <option value="Chicken">Chicken</option>
                <option value="Beef">Beef</option>
                <option value="Fish">Fish</option>
                <option value="Pork">Pork</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">🌍 Cuisine</label>
              <select className="filter-select" value={cuisine} onChange={(e) => setCuisine(e.target.value)}>
                <option value="">Select cuisine...</option>
                <option value="Italian">Italian</option>
                <option value="Asian">Asian</option>
                <option value="Mexican">Mexican</option>
                <option value="American">American</option>
                <option value="Mediterranean">Mediterranean</option>
                <option value="Indian">Indian</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">⏱️ Cook Time</label>
              <select className="filter-select" value={cookTime} onChange={(e) => setCookTime(e.target.value)}>
                <option value="">Select time...</option>
                <option value="Under 15 min">Under 15 min</option>
                <option value="15-30 min">15-30 min</option>
                <option value="30-60 min">30-60 min</option>
                <option value="1+ hours">1+ hours</option>
              </select>
            </div>
          </div>

          <div className="button-group">
            <button className="random-btn" onClick={handleRandomRecipe} disabled={loading}>
              Random Recipe
            </button>
          </div>

          <div className="results-section">
            {error && (
              <div className="empty-state">
                <div className="empty-message">
                  <h3>Oops! Something went wrong</h3>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {!error && searchMode === "initial" && (
              <div className="empty-state">
                <div className="empty-icon">
                  <div className="icon-placeholder">🎲</div>
                </div>
                <div className="empty-message">
                  <h3>Discover Your Perfect Recipe</h3>
                  <p>Select filters to find a recipe, or click "Random Recipe" for a surprise!</p>
                </div>
              </div>
            )}

            {!error &&
              (searchMode === "filtering" || searchMode === "random") &&
              (displayedRecipe ? (
                <div className="recipe-results" style={{ animation: "fadeIn 0.5s ease-in" }}>
                  <div className="results-header">
                    <h3>
                      {searchMode === "filtering"
                        ? `Found ${filteredRecipes.length} matching recipe${filteredRecipes.length > 1 ? "s" : ""}. Here's one!`
                        : "Here's a random recipe!"}
                    </h3>
                    <button
                      className="shuffle-btn"
                      onClick={handleShowAnotherRecipe}
                      disabled={searchMode === "random" || filteredRecipes.length <= 1}
                    >
                      🎲 Another Recipe
                    </button>
                  </div>
                  <div
                    className="recipe-grid"
                    style={{ gridTemplateColumns: "1fr", maxWidth: "420px", margin: "0 auto" }}
                  >
                    <RecipeCard recipe={displayedRecipe} />
                  </div>
                </div>
              ) : (
                <div className="recipe-results">
                  <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>😔</div>
                    <h3 style={{ fontSize: "20px", marginBottom: "8px" }}>No recipes found</h3>
                    <p style={{ color: "#6b7280" }}>Try different filter combinations to find your perfect recipe.</p>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="daily-recipe">
          <h2 className="banner-title">Today's Featured Recipe</h2>
          <div className="daily-content">
            {dailyRecipeDetails ? (
              <>
                <div className="daily-image">
                  {dailyRecipeDetails.imageUrl ? (
                    <img
                      src={dailyRecipeDetails.imageUrl || "/placeholder.svg"}
                      alt={dailyRecipeDetails.name}
                      className="daily-recipe-img"
                    />
                  ) : (
                    <div className="recipe-placeholder">📸</div>
                  )}
                </div>
                <div className="daily-info">
                  <h3>{dailyRecipeDetails.name}</h3>
                  <p className="daily-description">{dailyRecipeDetails.description}</p>
                  <a href={dailyRecipeDetails.url} className="daily-cta" target="_blank" rel="noopener noreferrer">
                    Cook Today's Recipe
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="daily-image">
                  <div className="recipe-placeholder">📸</div>
                </div>
                <div className="daily-info">
                  <h3>Loading today's recipe...</h3>
                  <p className="daily-description">Discovering today's featured recipe from our collection...</p>
                  <a href="#" className="daily-cta">
                    Cook Today's Recipe
                  </a>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading recipes...</p>
        </div>
      )}
    </>
  )
}
