# Recipe Suggestion App - Specification

## 1. Project Overview
- **Project Name**: Recipe AI
- **Type**: Full-stack web application (Node.js backend + vanilla JS frontend)
- **Core Functionality**: Users input available ingredients, and an AI suggests 4 recipes they can make
- **Target Users**: Home cooks looking for meal ideas based on what they have

## 2. Backend Specification

### Server
- **Runtime**: Node.js with Express
- **Port**: 3000 (Railway default)
- **Endpoints**:
  - `POST /api/suggest` - Accepts ingredients array, returns 4 AI-generated recipes

### AI Integration
- **Provider**: OpenAI GPT-4o-mini
- **API Key**: Stored in `OPENAI_API_KEY` environment variable (never exposed to client)
- **Request**: System prompt instructs model to return exactly 4 recipes as JSON
- **Response Format**: Structured JSON with recipe array

### Caching
- **Strategy**: In-memory cache with ingredient combination as key
- **Key Format**: Sorted, comma-separated lowercase ingredients with singular/plural normalization
- **Singular/Plural Handling**: "tomatoes" and "tomato" are treated as the same ingredient
- **TTL**: No expiration (persists until server restart)
- **Cache Location**: Server-side only

### API Response Schema
```json
{
  "recipes": [
    {
      "id": "recipe-1",
      "title": "Recipe Title",
      "description": "Brief description",
      "cook_time": "30 mins",
      "difficulty": "Easy|Medium|Hard",
      "servings": 4,
      "calories": 350,
      "meal_type": "Dinner",
      "cuisine": "Italian",
      "nutrition": {
        "protein": "15g",
        "carbs": "40g",
        "fat": "12g",
        "fiber": "5g"
      },
      "ingredients": ["1 cup flour", "2 eggs", ...],
      "instructions": ["Step 1...", "Step 2...", ...]
    }
  ],
  "cached": true|false
}
```

## 3. Frontend Specification

### Layout Structure
- **Container**: Centered max-width 900px, responsive
- **Header**: App title with cooking-themed icon
- **Main Sections**:
  1. Ingredient input area
  2. Recipe grid (2x2 on desktop, 1 column on mobile)
  3. Bookmarks section (collapsible)

### Visual Design

#### Color Palette
- **Primary**: #9e3d00 (Spiced Pumpkin)
- **Secondary**: #46673a (Leaf Green)
- **Background**: #fbf9f8 (Soft Cream)
- **Surface**: #ffffff (Cards)
- **Surface Container Low**: #f6f3f2
- **Text Primary**: #1b1c1c (Charcoal)
- **Text Secondary**: #594238
- **Tertiary**: #605c50
- **Outline**: #8c7166

#### Typography
- **Font Family**: "Noto Serif" for headings, "Plus Jakarta Sans" for body (Google Fonts)
- **Headings**: 700 weight, serif
- **Body**: 400-600 weight, sans-serif
- **Sizes**: 
  - Hero H1: 2.75rem
  - Section H2: 2rem
  - Card Title: 1.15rem
  - Body: 1rem
  - Small: 0.875rem

#### Spacing
- Base unit: 8px
- Card padding: 24px
- Grid gap: 24px
- Section spacing: 48px

#### Visual Effects
- Card shadow: 0 2px 8px rgba(0,0,0,0.08)
- Card hover: translateY(-4px), shadow increase
- Tag background: Primary color at 10% opacity
- Smooth transitions: 200ms ease

### Components

#### Ingredient Input
- Text input with placeholder "Type an ingredient..."
- Enter key or Add button adds ingredient as tag
- Tags display with × remove button
- Max 15 ingredients

#### Filter Selectors
- Meal Type dropdown: Any Meal, Breakfast, Lunch, Dinner, Appetizer, Dessert
- Cuisine Type dropdown: Any Cuisine, Asian, Mexican, Italian, American, Mediterranean, Indian, French, Japanese, Thai, Greek
- Filters are optional and passed to AI to constrain recipe suggestions
- Filters included in cache key for proper caching

#### Recipe Card
- White background, rounded corners (12px)
- Title (truncate if long)
- Description (2-line clamp)
- Cook time with clock icon
- Difficulty badge (color-coded):
  - Easy: #2D6A4F (green)
  - Medium: #E9C46A (amber)
  - Hard: #D62828 (red)
- Bookmark icon (top-right corner)
- Hover: lift effect with enhanced shadow

#### Recipe Modal
- Centered overlay with backdrop blur
- Max-width 600px
- Sections: Overview, Ingredients List, Instructions
- Close button (×) and click-outside-to-close
- Smooth fade-in animation

#### Bookmarks Section
- Collapsible with toggle header
- Shows saved recipe count
- Same card layout as main grid
- Remove bookmark button on each card

### Interactions
- Input: Type → Enter/Add → Tag appears → Input clears
- Tag: Click × → Tag removed
- Suggest: Click button → Loading state → Cards appear
- Card: Click → Modal opens with full details
- Card bookmark: Click icon → Toggle saved state
- Modal: Click × or backdrop → Modal closes

### States
- **Empty**: "Add ingredients and click Suggest Recipes"
- **Loading**: Button shows spinner, disabled
- **Error**: Red alert message with retry option
- **No Results**: "No recipes found" message
- **Cached**: Subtle indicator that response was cached

## 4. Data Flow

### Suggest Recipes Flow
1. User adds ingredients (tags)
2. User clicks "Suggest Recipes"
3. Client sends POST to `/api/suggest` with ingredients
4. Server checks cache
5. If not cached: calls OpenAI API
6. Server caches response, returns to client
7. Client renders recipe cards
8. User can bookmark any recipe

### Bookmark Flow
1. User clicks bookmark icon on card
2. Client saves full recipe to localStorage
3. Bookmark icon fills/activates
4. Bookmarks appear in collapsible section

## 5. Technical Implementation

### File Structure
```
/RecipeApp
├── server.js          # Express server + OpenAI integration
├── package.json       # Dependencies
├── .env.example       # Environment template
├── public/
│   ├── index.html     # Main HTML
│   ├── styles.css     # All styles
│   └── app.js         # Frontend logic
└── SPEC.md            # This file
```

### Dependencies
- express: ^4.18.x
- openai: ^4.x
- dotenv: ^16.x
- cors: ^2.8.x

### Environment Variables
- `OPENAI_API_KEY`: Required, OpenAI API secret key

## 6. Deployment (Railway)

### Configuration
- Build command: `npm install`
- Start command: `npm start`
- Environment variables: Set `OPENAI_API_KEY` in Railway dashboard
- Port: Railway sets `PORT` env var, server uses it

### Files for Deployment
- All files in repository
- `.env` is gitignored (key set in Railway)
- `public/` served as static files

## 7. Acceptance Criteria

- [ ] User can add ingredients as tags (max 15)
- [ ] User can remove individual tags
- [ ] User can select meal type filter (Breakfast, Lunch, Dinner, Appetizer, Dessert)
- [ ] User can select cuisine type filter (Asian, Mexican, Italian, etc.)
- [ ] "Suggest Recipes" button triggers API call with filters
- [ ] Loading state shown during API call
- [ ] Exactly 4 recipe cards displayed
- [ ] Each card shows: title, description, cook time, difficulty
- [ ] Clicking card opens modal with full details
- [ ] Modal shows ingredient list and step-by-step instructions
- [ ] User can bookmark/unbookmark recipes
- [ ] Bookmarks persist in localStorage across sessions
- [ ] Bookmarks section shows saved recipes
- [ ] Cached responses don't trigger new API calls
- [ ] API key never exposed to browser
- [ ] App works on mobile (responsive)
- [ ] Clean, usable interface
