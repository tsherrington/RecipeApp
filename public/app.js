const MAX_INGREDIENTS = 15;
const BOOKMARKS_KEY = 'recipe_bookmarks';

const ingredients = [];
let bookmarks = [];
let recipesData = [];

const ingredientInput = document.getElementById('ingredient-input');
const addBtn = document.getElementById('add-btn');
const tagsContainer = document.getElementById('tags-container');
const suggestBtn = document.getElementById('suggest-btn');
const errorMessage = document.getElementById('error-message');
const recipesGrid = document.getElementById('recipes-grid');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const bookmarksToggle = document.getElementById('bookmarks-toggle');
const bookmarksContent = document.getElementById('bookmarks-content');
const bookmarksGrid = document.getElementById('bookmarks-grid');
const bookmarksEmpty = document.getElementById('bookmarks-empty');
const bookmarkCount = document.getElementById('bookmark-count');
const loadingOverlay = document.getElementById('loading-overlay');
const loadingGif = document.getElementById('loading-gif');
const recipesSection = document.getElementById('recipes-section');
const moreSection = document.getElementById('more-section');
const moreBtn = document.getElementById('more-btn');
const mealTypeSelect = document.getElementById('meal-type');
const cuisineTypeSelect = document.getElementById('cuisine-type');
const shoppingListBtn = document.getElementById('shopping-list-btn');
const saveRecipeBtn = document.getElementById('save-recipe-btn');
const saveBtnText = document.getElementById('save-btn-text');
const shoppingListContainer = document.getElementById('shopping-list-container');
const shoppingList = document.getElementById('shopping-list');
const copyListBtn = document.getElementById('copy-list-btn');
const allergyInput = document.getElementById('allergy-input');
const addAllergyBtn = document.getElementById('add-allergy-btn');
const allergyTagsContainer = document.getElementById('allergy-tags');

const COMMON_INGREDIENTS = [
    'salt', 'pepper', 'black pepper', 'white pepper', 'red pepper flakes',
    'oil', 'olive oil', 'vegetable oil', 'cooking oil', 'canola oil',
    'butter', 'unsalted butter', 'salted butter',
    'sugar', 'white sugar', 'brown sugar', 'granulated sugar', 'powdered sugar',
    'flour', 'all-purpose flour', 'self-rising flour', 'bread flour',
    'water',
    'garlic', 'garlic cloves', 'minced garlic', 'garlic powder',
    'onion', 'onions', 'yellow onion', 'white onion', 'red onion', 'onion powder',
    'vinegar', 'white vinegar', 'apple cider vinegar', 'red wine vinegar',
    'soy sauce', 'worcestershire sauce', 'fish sauce',
    'paprika', 'cumin', 'oregano', 'basil', 'thyme', 'rosemary', 'bay leaf',
    'cayenne', 'chili powder', 'curry powder', 'turmeric', 'cinnamon', 'nutmeg',
    'honey', 'maple syrup', 'mustard', 'ketchup', 'mayonnaise',
    'baking powder', 'baking soda', 'yeast', 'cornstarch',
    'stock', 'broth', 'chicken stock', 'beef stock', 'vegetable stock',
    'cream', 'heavy cream', 'whipping cream', 'half and half',
    'milk', 'whole milk', 'skim milk',
    'eggs', 'egg', 'egg whites', 'egg yolks',
    'breadcrumbs', 'panko', 'cracker crumbs',
    'lemon juice', 'lime juice', 'juice', 'juice of',
    'parsley', 'cilantro', 'dill', 'mint', 'chives', 'green onion', 'scallion'
];

let currentRecipe = null;
let originalServings = 4;
let currentServings = 4;

const ALLERGIES_KEY = 'user_allergies';
let userAllergies = [];

function loadAllergies() {
    try {
        const saved = localStorage.getItem(ALLERGIES_KEY);
        userAllergies = saved ? JSON.parse(saved) : [];
    } catch {
        userAllergies = [];
    }
}

function saveAllergies() {
    localStorage.setItem(ALLERGIES_KEY, JSON.stringify(userAllergies));
}

function addAllergy(value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (userAllergies.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
        return;
    }
    
    userAllergies.push(trimmed);
    saveAllergies();
    renderAllergyTags();
    allergyInput.value = '';
}

function removeAllergy(index) {
    userAllergies.splice(index, 1);
    saveAllergies();
    renderAllergyTags();
}

function renderAllergyTags() {
    const container = document.getElementById('allergy-tags');
    container.innerHTML = '';
    userAllergies.forEach((allergy, index) => {
        const tag = document.createElement('span');
        tag.className = 'allergy-tag';
        tag.innerHTML = `
            ${escapeHtml(allergy)}
            <button class="allergy-tag-remove" data-index="${index}" aria-label="Remove ${escapeHtml(allergy)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        container.appendChild(tag);
    });
}

function isCommonIngredient(ingredient) {
    const normalized = ingredient.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    return COMMON_INGREDIENTS.some(common => 
        normalized === common || 
        normalized.startsWith(common + ' ') ||
        normalized.endsWith(' ' + common)
    );
}

function loadBookmarks() {
    try {
        const saved = localStorage.getItem(BOOKMARKS_KEY);
        bookmarks = saved ? JSON.parse(saved) : [];
    } catch {
        bookmarks = [];
    }
    updateBookmarkUI();
}

function saveBookmarks() {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function isBookmarked(recipeId) {
    return bookmarks.some(b => b.id === recipeId);
}

function toggleBookmark(recipe) {
    const index = bookmarks.findIndex(b => b.id === recipe.id);
    if (index > -1) {
        bookmarks.splice(index, 1);
    } else {
        bookmarks.push({ ...recipe, bookmarkedAt: Date.now() });
    }
    saveBookmarks();
    updateBookmarkUI();
    renderBookmarks();
}

function updateBookmarkUI() {
    bookmarkCount.textContent = bookmarks.length;
    
    document.querySelectorAll('.recipe-card .bookmark-btn').forEach(btn => {
        const recipeId = btn.dataset.recipeId;
        if (isBookmarked(recipeId)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function renderBookmarks() {
    bookmarksGrid.innerHTML = '';
    
    if (bookmarks.length === 0) {
        bookmarksEmpty.classList.remove('hidden');
        bookmarksGrid.style.display = 'none';
        return;
    }
    
    bookmarksEmpty.classList.add('hidden');
    bookmarksGrid.style.display = 'grid';
    
    bookmarks.forEach((recipe, index) => {
        const card = createRecipeCard(recipe, index);
        bookmarksGrid.appendChild(card);
    });
}

function addIngredient(value) {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (ingredients.length >= MAX_INGREDIENTS) {
        showError(`Maximum ${MAX_INGREDIENTS} ingredients allowed`);
        return;
    }
    if (ingredients.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
        showError('Ingredient already added');
        return;
    }
    
    const editingIndex = ingredientInput.dataset.editingIndex;
    if (editingIndex !== undefined) {
        ingredients.splice(parseInt(editingIndex), 0, trimmed);
        delete ingredientInput.dataset.editingIndex;
    } else {
        ingredients.push(trimmed);
    }
    
    renderTags();
    ingredientInput.value = '';
    suggestBtn.disabled = ingredients.length === 0;
    hideError();
}

function removeIngredient(index) {
    ingredients.splice(index, 1);
    renderTags();
    suggestBtn.disabled = ingredients.length === 0;
}

function renderTags() {
    tagsContainer.innerHTML = '';
    ingredients.forEach((ing, index) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `
            ${escapeHtml(ing)}
            <button class="tag-edit" data-index="${index}" aria-label="Edit ${escapeHtml(ing)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
            <button class="tag-remove" data-index="${index}" aria-label="Remove ${escapeHtml(ing)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        tag.addEventListener('dblclick', () => startEditIngredient(index));
        tagsContainer.appendChild(tag);
    });
}

function startEditIngredient(index) {
    const ingredient = ingredients[index];
    const input = ingredientInput;
    input.value = ingredient;
    ingredients.splice(index, 1);
    renderTags();
    input.focus();
    input.dataset.editingIndex = index;
    suggestBtn.disabled = ingredients.length === 0;
}

function createRecipeCard(recipe, index) {
    const card = document.createElement('article');
    card.className = 'recipe-card';
    
    const bookmarked = isBookmarked(recipe.id);
    
    card.innerHTML = `
        <div class="recipe-card-image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M12 6v6l4 2"/>
            </svg>
            <button class="bookmark-btn ${bookmarked ? 'active' : ''}" data-recipe-id="${recipe.id}" aria-label="Bookmark recipe">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
            </button>
        </div>
        <div class="recipe-card-content">
            <div class="recipe-tags">
                <span class="recipe-tag">${escapeHtml(recipe.difficulty)}</span>
                ${recipe.calories ? `<span class="recipe-tag time">${recipe.calories} cal</span>` : ''}
            </div>
            <h3 class="recipe-title">${escapeHtml(recipe.title)}</h3>
            <p class="recipe-description">${escapeHtml(recipe.description)}</p>
            <div class="recipe-meta">
                <span class="recipe-time">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                    </svg>
                    ${escapeHtml(recipe.cook_time)}
                </span>
                <span class="difficulty-badge ${recipe.difficulty.toLowerCase()}">${recipe.difficulty}</span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.bookmark-btn')) {
            openModal(recipe);
        }
    });
    
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBookmark(recipe);
    });
    
    return card;
}

function renderRecipes(recipes, cached = false, append = false) {
    if (!append) {
        recipesData = recipes;
    } else {
        recipesData = [...recipesData, ...recipes];
    }
    
    if (!append) {
        recipesGrid.innerHTML = '';
    }
    
    if (recipes.length === 0 && !append) {
        recipesGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p>No recipes found. Try different ingredients.</p>
            </div>
        `;
        moreSection.classList.add('hidden');
        return;
    }
    
    recipesSection.classList.remove('hidden');
    
    recipes.forEach((recipe, index) => {
        const card = createRecipeCard(recipe, append ? recipesData.length - recipes.length + index : index);
        recipesGrid.appendChild(card);
    });
    
    moreSection.classList.remove('hidden');
}

async function generateRecipeImage(recipe) {
    try {
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                recipeTitle: recipe.title,
                cuisine: recipe.cuisine
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.imageUrl) {
            return data.imageUrl;
        }
    } catch (err) {
        console.error('Failed to generate image:', err);
    }
    return null;
}

async function suggestRecipes() {
    if (ingredients.length === 0) return;
    
    suggestBtn.classList.add('loading');
    suggestBtn.disabled = true;
    hideError();
    loadingOverlay.classList.remove('hidden');
    
    try {
        const response = await fetch('/api/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                ingredients,
                mealType: mealTypeSelect.value,
                cuisineType: cuisineTypeSelect.value
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get recipes');
        }
        
        renderRecipes(data.recipes, data.cached);
        
        for (const recipe of data.recipes) {
            const imageUrl = await generateRecipeImage(recipe);
            if (imageUrl) {
                recipe.imageUrl = imageUrl;
            }
        }
        
        const cards = recipesGrid.querySelectorAll('.recipe-card');
        data.recipes.forEach((recipe, index) => {
            if (cards[index] && recipe.imageUrl) {
                const imgContainer = cards[index].querySelector('.recipe-card-image');
                imgContainer.innerHTML = `
                    <img src="${recipe.imageUrl}" alt="${recipe.title}" />
                    <button class="bookmark-btn ${isBookmarked(recipe.id) ? 'active' : ''}" data-recipe-id="${recipe.id}">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </button>
                `;
            }
        });
    } catch (err) {
        showError(err.message || 'Failed to get recipes. Please try again.');
        recipesSection.classList.remove('hidden');
        recipesGrid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p>Something went wrong. Please try again.</p>
            </div>
        `;
    } finally {
        suggestBtn.classList.remove('loading');
        suggestBtn.disabled = false;
        loadingOverlay.classList.add('hidden');
    }
}

function openModal(recipe) {
    const modalImage = document.getElementById('modal-image');
    if (recipe.imageUrl) {
        modalImage.innerHTML = `<img src="${recipe.imageUrl}" alt="${recipe.title}" />`;
    } else {
        modalImage.innerHTML = '';
    }
    
    document.getElementById('modal-title').textContent = recipe.title;
    document.getElementById('modal-description').textContent = recipe.description;
    document.getElementById('modal-time').querySelector('span').textContent = recipe.cook_time;
    
    const difficultyEl = document.getElementById('modal-difficulty');
    difficultyEl.textContent = recipe.difficulty;
    difficultyEl.className = `difficulty-badge ${recipe.difficulty.toLowerCase()}`;
    
    originalServings = recipe.servings || 4;
    currentServings = originalServings;
    updateServingsDisplay();
    
    const caloriesEl = document.getElementById('modal-calories');
    caloriesEl.textContent = recipe.calories || '';
    
    const nutritionDetails = document.getElementById('modal-nutrition-details');
    if (recipe.nutrition) {
        nutritionDetails.innerHTML = `
            <div class="nutrition-macro">
                <span class="nutrition-macro-value">${recipe.nutrition.protein || '0g'}</span>
                <span class="nutrition-macro-label">Protein</span>
            </div>
            <div class="nutrition-macro">
                <span class="nutrition-macro-value">${recipe.nutrition.carbs || '0g'}</span>
                <span class="nutrition-macro-label">Carbs</span>
            </div>
            <div class="nutrition-macro">
                <span class="nutrition-macro-value">${recipe.nutrition.fat || '0g'}</span>
                <span class="nutrition-macro-label">Fat</span>
            </div>
            <div class="nutrition-macro">
                <span class="nutrition-macro-value">${recipe.nutrition.fiber || '0g'}</span>
                <span class="nutrition-macro-label">Fiber</span>
            </div>
        `;
    } else {
        nutritionDetails.innerHTML = '';
    }
    
    const ingredientsList = document.getElementById('modal-ingredients');
    ingredientsList.innerHTML = recipe.ingredients.map(ing => 
        `<li>${escapeHtml(ing)}</li>`
    ).join('');
    
    const instructionsList = document.getElementById('modal-instructions');
    instructionsList.innerHTML = recipe.instructions.map(inst => 
        `<li>${escapeHtml(inst)}</li>`
    ).join('');
    
    shoppingListContainer.classList.add('hidden');
    shoppingList.innerHTML = '';
    copyListBtn.classList.remove('copied');
    copyListBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        Copy to Clipboard
    `;
    
    currentRecipe = recipe;
    
    const allergyWarningEl = document.getElementById('modal-allergies');
    const allergyTextEl = document.getElementById('modal-allergy-text');
    const matchedAllergies = checkRecipeAllergies(recipe);
    
    if (matchedAllergies.length > 0) {
        allergyTextEl.textContent = `Contains: ${matchedAllergies.join(', ')}`;
        allergyWarningEl.classList.remove('hidden');
    } else {
        allergyWarningEl.classList.add('hidden');
    }
    
    if (isBookmarked(recipe.id)) {
        saveRecipeBtn.classList.add('saved');
        saveBtnText.textContent = 'Saved';
    } else {
        saveRecipeBtn.classList.remove('saved');
        saveBtnText.textContent = 'Save Recipe';
    }
    
    modalOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function checkRecipeAllergies(recipe) {
    if (userAllergies.length === 0) return [];
    
    const recipeText = (recipe.ingredients.join(' ') + ' ' + (recipe.instructions?.join(' ') || '')).toLowerCase();
    const matched = [];
    
    userAllergies.forEach(allergy => {
        const allergyLower = allergy.toLowerCase();
        if (recipeText.includes(allergyLower)) {
            matched.push(allergy);
        }
    });
    
    return matched;
}

function scaleIngredient(ingredient, originalServings, newServings) {
    const ratio = newServings / originalServings;
    
    const fractionPatterns = [
        { pattern: /\b1\/8\b/gi, value: 0.125 },
        { pattern: /\b1\/4\b/gi, value: 0.25 },
        { pattern: /\b1\/3\b/gi, value: 0.333 },
        { pattern: /\b1\/2\b/gi, value: 0.5 },
        { pattern: /\b2\/3\b/gi, value: 0.667 },
        { pattern: /\b3\/4\b/gi, value: 0.75 }
    ];
    
    const amountPattern = /^(\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?(?:\s+\d+(?:\.\d+)?(?:\/\d+)?)*)\s+(.+)$/;
    
    const match = ingredient.match(amountPattern);
    if (!match) {
        return ingredient;
    }
    
    let amountStr = match[1].trim();
    const unitAndRest = match[2];
    
    let totalValue = 0;
    let parts = amountStr.split(/\s+/);
    
    for (let part of parts) {
        if (part.includes('/')) {
            const [num, denom] = part.split('/').map(n => parseFloat(n.trim()));
            if (!isNaN(num) && !isNaN(denom) && denom !== 0) {
                totalValue += num / denom;
            }
        } else {
            const num = parseFloat(part);
            if (!isNaN(num)) {
                totalValue += num;
            }
        }
    }
    
    if (totalValue === 0) {
        return ingredient;
    }
    
    let scaledValue = totalValue * ratio;
    
    let displayValue;
    if (Math.abs(scaledValue - Math.round(scaledValue)) < 0.05) {
        displayValue = Math.round(scaledValue).toString();
    } else {
        const fractions = [
            { value: 0.125, display: '1/8' },
            { value: 0.25, display: '1/4' },
            { value: 0.333, display: '1/3' },
            { value: 0.5, display: '1/2' },
            { value: 0.667, display: '2/3' },
            { value: 0.75, display: '3/4' },
            { value: 0.25, display: '1/4' }
        ];
        
        const whole = Math.floor(scaledValue);
        const frac = scaledValue - whole;
        
        let closestFrac = '';
        let minDiff = 0.1;
        for (let f of fractions) {
            const diff = Math.abs(frac - f.value);
            if (diff < minDiff) {
                minDiff = diff;
                closestFrac = f.display;
            }
        }
        
        if (whole === 0 && closestFrac) {
            displayValue = closestFrac;
        } else if (closestFrac) {
            displayValue = `${whole} ${closestFrac}`;
        } else {
            displayValue = scaledValue % 1 === 0 ? scaledValue.toString() : scaledValue.toFixed(1);
        }
    }
    
    return `${displayValue} ${unitAndRest}`;
}

function updateServingsDisplay() {
    document.getElementById('servings-count').textContent = currentServings;
    document.getElementById('servings-decrease').disabled = currentServings <= 1;
    document.getElementById('servings-increase').disabled = currentServings >= 12;
    
    if (currentRecipe) {
        const scaledIngredients = currentRecipe.ingredients.map(ing => 
            scaleIngredient(ing, originalServings, currentServings)
        );
        const ingredientsList = document.getElementById('modal-ingredients');
        ingredientsList.innerHTML = scaledIngredients.map(ing => 
            `<li>${escapeHtml(ing)}</li>`
        ).join('');
    }
}

function createShoppingList(recipe) {
    const userIngredientsLower = ingredients.map(i => i.toLowerCase().trim());
    
    const neededIngredients = recipe.ingredients.filter(ing => {
        if (isCommonIngredient(ing)) return false;
        
        const ingLower = ing.toLowerCase();
        const notInUserList = !userIngredientsLower.some(ui => 
            ingLower.includes(ui) || ui.includes(ingLower.split(' ')[0])
        );
        
        return notInUserList;
    });
    
    return neededIngredients;
}

function showShoppingList(recipe) {
    const list = createShoppingList(recipe);
    
    if (list.length === 0) {
        shoppingList.innerHTML = '<li class="empty-list">You have all the ingredients!</li>';
    } else {
        shoppingList.innerHTML = list.map(ing => `<li>${escapeHtml(ing)}</li>`).join('');
    }
    
    shoppingListContainer.classList.remove('hidden');
}

function copyShoppingList() {
    const items = Array.from(shoppingList.querySelectorAll('li:not(.empty-list)'))
        .map(li => li.textContent)
        .join('\n');
    
    if (items) {
        navigator.clipboard.writeText(items).then(() => {
            copyListBtn.classList.add('copied');
            copyListBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
            `;
        });
    }
}

function closeModal() {
    modalOverlay.classList.remove('visible');
    document.body.style.overflow = '';
    currentRecipe = null;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
}

function hideError() {
    errorMessage.classList.remove('visible');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

addBtn.addEventListener('click', () => addIngredient(ingredientInput.value));

ingredientInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addIngredient(ingredientInput.value);
    }
});

tagsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.tag-remove');
    if (removeBtn) {
        removeIngredient(parseInt(removeBtn.dataset.index));
        return;
    }
    
    const editBtn = e.target.closest('.tag-edit');
    if (editBtn) {
        startEditIngredient(parseInt(editBtn.dataset.index));
    }
});

addAllergyBtn.addEventListener('click', () => addAllergy(allergyInput.value));

allergyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addAllergy(allergyInput.value);
        allergyInput.value = '';
    }
});

allergyTagsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.allergy-tag-remove');
    if (removeBtn) {
        removeAllergy(parseInt(removeBtn.dataset.index));
    }
});

suggestBtn.addEventListener('click', suggestRecipes);

modalClose.addEventListener('click', closeModal);

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) {
        closeModal();
    }
});

bookmarksToggle.addEventListener('click', () => {
    bookmarksToggle.classList.toggle('expanded');
    bookmarksContent.classList.toggle('collapsed');
});

shoppingListBtn.addEventListener('click', () => {
    if (currentRecipe) {
        showShoppingList(currentRecipe);
    }
});

saveRecipeBtn.addEventListener('click', () => {
    if (currentRecipe) {
        toggleBookmark(currentRecipe);
        if (isBookmarked(currentRecipe.id)) {
            saveRecipeBtn.classList.add('saved');
            saveBtnText.textContent = 'Saved';
        } else {
            saveRecipeBtn.classList.remove('saved');
            saveBtnText.textContent = 'Save Recipe';
        }
    }
});

document.getElementById('servings-decrease').addEventListener('click', () => {
    if (currentServings > 1) {
        currentServings--;
        updateServingsDisplay();
    }
});

document.getElementById('servings-increase').addEventListener('click', () => {
    if (currentServings < 12) {
        currentServings++;
        updateServingsDisplay();
    }
});

copyListBtn.addEventListener('click', copyShoppingList);

moreBtn.addEventListener('click', async () => {
    if (ingredients.length === 0) return;
    
    moreBtn.classList.add('loading');
    moreBtn.disabled = true;
    
    try {
        const response = await fetch('/api/suggest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredients })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get recipes');
        }
        
        renderRecipes(data.recipes, data.cached, true);
    } catch (err) {
        showError(err.message || 'Failed to load more recipes.');
    } finally {
        moreBtn.classList.remove('loading');
        moreBtn.disabled = false;
    }
});

loadBookmarks();
renderBookmarks();
loadAllergies();
renderAllergyTags();
