// --- Airtable Configuration ---
// IMPORTANT: Do not expose your API key in client-side code.
// This key should be stored securely on a server, and your app
// should make requests to your server instead of directly to Airtable.
const AIRTABLE_CONFIG = {
    // Replace with your server endpoint that securely calls the Airtable API
    // For local development, you might temporarily use your key here,
    // but do not deploy this to a public website.
    apiKey: 'YOUR_SECURE_SERVER_ENDPOINT_OR_DEVELOPMENT_KEY',
    baseId: 'appEeK6TzbyxOgHdU',
    tableName: 'Recipes'
};

// --- Global variables ---
let allRecipes = [];
let filteredRecipes = [];

// --- DOM Elements ---
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
const dailyContent = document.getElementById('dailyContent');


// --- Initialize app ---
document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    setupEventListeners();
});

// --- Setup event listeners ---
function setupEventListeners() {
    findBtn.addEventListener('click', findRecipe);
    randomBtn.addEventListener('click', randomRecipe);
    shuffleBtn.addEventListener('click', showAnotherRecipe);
}

// --- Load recipes from Airtable ---
async function loadRecipes() {
    try {
        showLoading(true);

        if (AIRTABLE_CONFIG.apiKey === 'YOUR_SECURE_SERVER_ENDPOINT_OR_DEVELOPMENT_KEY') {
            console.error('Please configure your Airtable API key or server endpoint in js/app.js');
            showError('Configuration needed: Please add your Airtable API key or server endpoint to the app configuration.');
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

        if (allRecipes.length > 0) {
            console.log('Sample recipe data:', allRecipes[0]);
        }

        setupDailyRecipe();

    } catch (error) {
        console.error('Error loading recipes:', error);
        showError('Error loading recipes. Please check your configuration and try again.');
    } finally {
        showLoading(false);
    }
}

// --- Recipe Generation and Display ---

function findRecipe() {
    generateRecipes();
}

function randomRecipe() {
    if (allRecipes.length === 0) {
        alert('Recipes are still loading. Please try again in a moment.');
        return;
    }
    clearFilters();
    const randomIndex = Math.floor(Math.random() * allRecipes.length);
    filteredRecipes = [allRecipes[randomIndex]];
    displayResults();
}

function showAnotherRecipe() {
    if (filteredRecipes.length > 1) {
        shuffleResults();
    } else {
        randomRecipe();
    }
}


function generateRecipes() {
    const mealType = mealTypeSelect.value;
    const protein = proteinSelect.value;
    const cuisine = cuisineSelect.value;
    const cookTime = cookTimeSelect.value;

    if (!mealType) {
        alert('Please select a meal type to generate recipes.');
        return;
    }

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

function displayResults() {
    if (filteredRecipes.length === 0) {
        showNoResults();
        return;
    }

    emptyState.style.display = 'none';
    recipeResults.style.display = 'block';

    resultsCount.textContent = `${filteredRecipes.length} recipe${filteredRecipes.length === 1 ? '' : 's'} found`;

    recipeGrid.innerHTML = '';

    const shuffledRecipes = [...filteredRecipes].sort(() => Math.random() - 0.5);

    const recipesToShow = shuffledRecipes.slice(0, 6);

    recipesToShow.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        recipeGrid.appendChild(recipeCard);
    });
}

function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    const name = recipe['Recipe Name'] || recipe['Name'] || 'Untitled Recipe';
    const description = recipe['Description'] || recipe['Short Description'] || 'Delicious recipe to try!';
    const url = recipe['URL'] || recipe['Link'] || '#';

    let imageUrl = getImageUrl(recipe);

    const mealType = recipe['Meal Type'] || '';
    const protein = recipe['Protein'] || '';
    const cuisine = recipe['Cuisine'] || '';
    const cookTime = recipe['Cook Time'] || '';

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

function getImageUrl(recipe) {
    const imageFields = ['Image', 'Photo', 'Image URL', 'Photos', 'Images', 'Picture'];
    for (const field of imageFields) {
        if (recipe[field]) {
            if (Array.isArray(recipe[field]) && recipe[field].length > 0) {
                return recipe[field][0].url || recipe[field][0].thumbnails?.large?.url || '';
            } else if (typeof recipe[field] === 'string') {
                return recipe[field];
            }
        }
    }
    return '';
}


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

function shuffleResults() {
    if (filteredRecipes.length > 0) {
        displayResults();
    }
}

function setupDailyRecipe() {
    dailyContent.classList.remove('loading-shimmer');

    if (allRecipes.length === 0) {
        dailyTitle.textContent = 'Could not load recipe';
        dailyDescription.textContent = 'Please check back later!';
        return;
    }

    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const recipeIndex = dayOfYear % allRecipes.length;
    const dailyRecipe = allRecipes[recipeIndex];

    const name = dailyRecipe['Recipe Name'] || dailyRecipe['Name'] || 'Today\'s Special Recipe';
    const description = dailyRecipe['Description'] || dailyRecipe['Short Description'] || 'A wonderful recipe to brighten your day!';
    const url = dailyRecipe['URL'] || dailyRecipe['Link'] || '#';
    const imageUrl = getImageUrl(dailyRecipe);

    dailyTitle.textContent = name;
    dailyDescription.textContent = description;
    dailyCta.href = url;

    if (url !== '#') {
        dailyCta.target = '_blank';
        dailyCta.rel = 'noopener noreferrer';
    }

    const dailyImageContainer = document.querySelector('.daily-image');
    if (imageUrl) {
        dailyImageContainer.innerHTML = `
            <img src="${imageUrl}" alt="${name}" class="daily-recipe-img"
                 onerror="console.log('Daily image failed to load:', this.src); this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="recipe-placeholder" style="display: none;">📸</div>
        `;
    } else {
        dailyImageContainer.innerHTML = `<div class="recipe-placeholder">📸</div>`;
    }
}

// --- UI Utility Functions ---

function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

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

function clearFilters() {
    mealTypeSelect.value = '';
    proteinSelect.value = '';
    cuisineSelect.value = '';
    cookTimeSelect.value = '';

    recipeResults.style.display = 'none';
    emptyState.style.display = 'block';

    const emptyMessage = emptyState.querySelector('.empty-message');
    emptyMessage.innerHTML = `
        <h3>Discover Your Perfect Recipe</h3>
        <p>Select a meal type and click "Find Recipe" for filtered results, or "Random Recipe" for any recipe</p>
    `;

    const emptyIcon = emptyState.querySelector('.icon-placeholder');
    emptyIcon.textContent = '🎲';
}

// --- Keyboard Shortcuts ---
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.activeElement.tagName === 'SELECT') {
        findRecipe();
    }

    if (e.key === 'Escape') {
        clearFilters();
    }
});
