// Airtable Configuration
const AIRTABLE_CONFIG = {
    apiKey: 'patdEx07FVD2fVn3n.43bb9c4e2335068c0a1a77dde7eac3a73a4a470b95bffe3dc4f2d4c5b907e711',
    baseId: 'appEeK6TzbyxOgHdU',
    tableName: 'Recipes'
};

// Global variables
let allRecipes = [];
let filteredRecipes = [];

// DOM Elements
const findBtn = document.getElementById('findBtn');
const randomBtn = document.getElementById('randomBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const emptyState = document.getElementById('emptyState');
const recipeResults = document.getElementById('recipeResults');
const recipeGrid = document.getElementById('recipeGrid');
const resultsCount = document.getElementById('resultsCount');
const loadingSpinner = document.getElementById('loadingSpinner');

// Filter elements
const mealTypeSelect = document.getElementById('mealType');
const proteinSelect = document.getElementById('protein');
const cuisineSelect = document.getElementById('cuisine');
const cookTimeSelect = document.getElementById('cookTime');

// Daily recipe elements
const dailyTitle = document.getElementById('dailyTitle');
const dailyDescription = document.getElementById('dailyDescription');
const dailyCta = document.getElementById('dailyCta');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    findBtn.addEventListener('click', findRecipe);
    randomBtn.addEventListener('click', randomRecipe);
    shuffleBtn.addEventListener('click', showAnotherRecipe);
}

// Load recipes from Airtable
async function loadRecipes() {
    try {
        showLoading(true);
        
        // Check if Base ID is configured
        if (AIRTABLE_CONFIG.baseId === 'YOUR_BASE_ID_HERE') {
            console.error('Please configure your Airtable Base ID in js/app.js');
            showError('Configuration needed: Please add your Airtable Base ID to the app configuration.');
            return;
        }
        
        const url = `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.tableName}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allRecipes = data.records.map(record => ({
            id: record.id,
            ...record.fields
        }));
        
        console.log(`Loaded ${allRecipes.length} recipes from Airtable`);
        
        // Debug: Log first recipe to check image field structure
        if (allRecipes.length > 0) {
            console.log('Sample recipe data:', allRecipes[0]);
        }
        
        // Set up daily recipe
        setupDailyRecipe();
        
    } catch (error) {
        console.error('Error loading recipes:', error);
        showError('Error loading recipes. Please check your configuration and try again.');
    } finally {
        showLoading(false);
    }
}

// Generate/filter recipes based on selected criteria
function generateRecipes() {
    const mealType = mealTypeSelect.value;
    const protein = proteinSelect.value;
    const cuisine = cuisineSelect.value;
    const cookTime = cookTimeSelect.value;
    
    // Meal type is mandatory
    if (!mealType) {
        alert('Please select a meal type to generate recipes.');
        return;
    }
    
    // Filter recipes based on selected criteria
    filteredRecipes = allRecipes.filter(recipe => {
        return (
            (recipe['Meal Type'] === mealType) &&
            (!protein || recipe['Protein'] === protein) &&
            (!cuisine || recipe['Cuisine'] === cuisine) &&
            (!cookTime || recipe['Cook Time'] === cookTime)
        );
    });
    
    displayResults();
}

// Display filtered results
function displayResults() {
    if (filteredRecipes.length === 0) {
        showNoResults();
        return;
    }
    
    // Hide empty state and show results
    emptyState.style.display = 'none';
    recipeResults.style.display = 'block';
    
    // Update results count
    resultsCount.textContent = `${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'} found`;
    
    // Clear previous results
    recipeGrid.innerHTML = '';
    
    // Shuffle results for variety
    const shuffledRecipes = [...filteredRecipes].sort(() => Math.random() - 0.5);
    
    // Display up to 6 recipes
    const recipesToShow = shuffledRecipes.slice(0, 6);
    
    recipesToShow.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipeGrid.appendChild(recipeCard);
    });
}

// Create a recipe card element
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    
    // Handle missing fields gracefully
    const name = recipe['Recipe Name'] || recipe['Name'] || 'Untitled Recipe';
    const description = recipe['Description'] || recipe['Short Description'] || 'Delicious recipe to try!';
    const url = recipe['URL'] || recipe['Link'] || '#';
    
    // Try multiple possible image field names and handle Airtable attachment format
    let imageUrl = '';
    const imageFields = ['Image', 'Photo', 'Image URL', 'Photos', 'Images', 'Picture'];
    
    for (const field of imageFields) {
        if (recipe[field]) {
            // Check if it's an Airtable attachment array
            if (Array.isArray(recipe[field]) && recipe[field].length > 0) {
                imageUrl = recipe[field][0].url || recipe[field][0].thumbnails?.large?.url || '';
                break;
            }
            // Check if it's a direct URL string
            else if (typeof recipe[field] === 'string') {
                imageUrl = recipe[field];
                break;
            }
        }
    }
    
    const mealType = recipe['Meal Type'] || '';
    const protein = recipe['Protein'] || '';
    const cuisine = recipe['Cuisine'] || '';
    const cookTime = recipe['Cook Time'] || '';
    
    // Create image element
    let imageElement;
    if (imageUrl) {
        imageElement = `<img src="${imageUrl}" alt="${name}" class="recipe-image-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="recipe-image-placeholder" style="display: none;">🍽️</div>`;
    } else {
        imageElement = `<div class="recipe-image-placeholder">🍽️</div>`;
    }
    
    card.innerHTML = `
        <div class="recipe-image">
            ${imageElement}
        </div>
        <div class="recipe-content">
            <h3 class="recipe-title">${name}</h3>
            <div class="recipe-meta">
                ${mealType ? `<span class="meta-item">🍽️ ${mealType}</span>` : ''}
                ${protein ? `<span class="meta-item">🥩 ${protein}</span>` : ''}
                ${cuisine ? `<span class="meta-item">🌍 ${cuisine}</span>` : ''}
                ${cookTime ? `<span class="meta-item">⏱️ ${cookTime}</span>` : ''}
            </div>
            <p class="recipe-description">${description}</p>
            <a href="${url}" class="recipe-link" target="_blank" rel="noopener noreferrer">View Recipe</a>
        </div>
    `;
    
    return card;
}

// Show no results message
function showNoResults() {
    emptyState.style.display = 'none';
    recipeResults.style.display = 'block';
    resultsCount.textContent = '0 recipes found';
    
    recipeGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
            <h3 style="font-size: 20px; margin-bottom: 8px;">No recipes found</h3>
            <p style="color: #6b7280;">Try different filter combinations to find your perfect recipe.</p>
        </div>
    `;
}

// Shuffle current results
function shuffleResults() {
    if (filteredRecipes.length > 0) {
        displayResults();
    }
}

// Setup daily recipe
function setupDailyRecipe() {
    if (allRecipes.length === 0) return;
    
    // Use date to consistently pick the same recipe each day
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const recipeIndex = dayOfYear % allRecipes.length;
    const dailyRecipe = allRecipes[recipeIndex];
    
    // Update daily recipe display
    const name = dailyRecipe['Recipe Name'] || dailyRecipe['Name'] || 'Today\'s Special Recipe';
    const description = dailyRecipe['Description'] || dailyRecipe['Short Description'] || 'A wonderful recipe to brighten your day!';
    const url = dailyRecipe['URL'] || dailyRecipe['Link'] || '#';
    
    // Try multiple possible image field names and handle Airtable attachment format
    let imageUrl = '';
    const imageFields = ['Image', 'Photo', 'Image URL', 'Photos', 'Images', 'Picture'];
    
    for (const field of imageFields) {
        if (dailyRecipe[field]) {
            // Check if it's an Airtable attachment array
            if (Array.isArray(dailyRecipe[field]) && dailyRecipe[field].length > 0) {
                imageUrl = dailyRecipe[field][0].url || dailyRecipe[field][0].thumbnails?.large?.url || '';
                break;
            }
            // Check if it's a direct URL string
            else if (typeof dailyRecipe[field] === 'string') {
                imageUrl = dailyRecipe[field];
                break;
            }
        }
    }
    
    dailyTitle.textContent = name;
    dailyDescription.textContent = description;
    dailyCta.href = url;
    
    if (url !== '#') {
        dailyCta.target = '_blank';
        dailyCta.rel = 'noopener noreferrer';
    }
    
    // Update daily recipe image
    const dailyImageContainer = document.querySelector('.daily-image');
    if (imageUrl) {
        dailyImageContainer.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="daily-recipe-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="recipe-placeholder" style="display: none;">📸</div>
        `;
    } else {
        dailyImageContainer.innerHTML = `<div class="recipe-placeholder">📸</div>`;
    }
}

// Show/hide loading spinner
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Show error message
function showError(message) {
    emptyState.style.display = 'block';
    recipeResults.style.display = 'none';
    
    const emptyMessage = emptyState.querySelector('.empty-message');
    emptyMessage.innerHTML = `
        <h3>Oops! Something went wrong</h3>
        <p>${message}</p>
    `;
    
    const emptyIcon = emptyState.querySelector('.icon-placeholder');
    emptyIcon.textContent = '⚠️';
}

// Utility function to clear all filters
function clearFilters() {
    mealTypeSelect.value = '';
    proteinSelect.value = '';
    cuisineSelect.value = '';
    cookTimeSelect.value = '';
    
    // Hide results and show empty state
    recipeResults.style.display = 'none';
    emptyState.style.display = 'block';
    
    // Reset empty state
    const emptyMessage = emptyState.querySelector('.empty-message');
    emptyMessage.innerHTML = `
        <h3>Discover Your Perfect Recipe</h3>
        <p>Select a meal type and click "Find Recipe" for filtered results, or "Random Recipe" for any recipe</p>
    `;
    
    const emptyIcon = emptyState.querySelector('.icon-placeholder');
    emptyIcon.textContent = '🎲';
}

// Optional: Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press Enter to find recipes
    if (e.key === 'Enter' && document.activeElement.tagName === 'SELECT') {
        findRecipe();
    }
    
    // Press Escape to clear filters
    if (e.key === 'Escape') {
        clearFilters();
    }
});
