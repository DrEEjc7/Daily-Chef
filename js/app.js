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
const generateBtn = document.getElementById('generateBtn');
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
    generateBtn.addEventListener('click', generateRecipes);
    shuffleBtn.addEventListener('click', shuffleResults);
    
    // Optional: Filter on change for real-time filtering
    // Uncomment these lines if you want filtering to happen as soon as user selects
    /*
    mealTypeSelect.addEventListener('change', generateRecipes);
    proteinSelect.addEventListener('change', generateRecipes);
    cuisineSelect.addEventListener('change', generateRecipes);
    cookTimeSelect.addEventListener('change', generateRecipes);
    */
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
    
    // Check if any filters are selected
    if (!mealType && !protein && !cuisine && !cookTime) {
        alert('Please select at least one filter to generate recipes.');
        return;
    }
    
    // Filter recipes based on selected criteria
    filteredRecipes = allRecipes.filter(recipe => {
        return (
            (!mealType || recipe['Meal Type'] === mealType) &&
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
    const mealType = recipe['Meal Type'] || '';
    const protein = recipe['Protein'] || '';
    const cuisine = recipe['Cuisine'] || '';
    const cookTime = recipe['Cook Time'] || '';
    
    card.innerHTML = `
        <div class="recipe-image">
            🍽️
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
    
    dailyTitle.textContent = name;
    dailyDescription.textContent = description;
    dailyCta.href = url;
    
    if (url !== '#') {
        dailyCta.target = '_blank';
        dailyCta.rel = 'noopener noreferrer';
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
        <h3>Generate Your Perfect Recipe</h3>
        <p>Select your preferences above and click "Generate Recipe" to discover your next meal</p>
    `;
    
    const emptyIcon = emptyState.querySelector('.icon-placeholder');
    emptyIcon.textContent = '🎲';
}

// Optional: Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Press Enter to generate recipes
    if (e.key === 'Enter' && document.activeElement.tagName === 'SELECT') {
        generateRecipes();
    }
    
    // Press Escape to clear filters
    if (e.key === 'Escape') {
        clearFilters();
    }
});
