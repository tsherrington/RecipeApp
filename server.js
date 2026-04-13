require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

function getOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
        return null;
    }
    return new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}

const openai = getOpenAIClient();

const responseCache = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pluralRules = [
    [/ves$/i, 'f'],
    [/ies$/i, 'y'],
    [/ses$/i, 's'],
    [/xes$/i, 'x'],
    [/ches$/i, 'ch'],
    [/shes$/i, 'sh'],
    [/oes$/i, 'o'],
    [/s$/i, '']
];

function normalizeIngredient(word) {
    word = word.toLowerCase().trim();
    for (const [pattern, replacement] of pluralRules) {
        if (pattern.test(word)) {
            const singular = word.replace(pattern, replacement);
            if (singular !== word) {
                return singular;
            }
        }
    }
    return word;
}

function getCacheKey(ingredients) {
    return ingredients.map(i => normalizeIngredient(i)).sort().join(',');
}

app.post('/api/suggest', async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({ error: 'AI service not configured. Please set OPENAI_API_KEY environment variable.' });
        }

        const { ingredients, mealType, cuisineType } = req.body;

        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ error: 'Ingredients array is required' });
        }

        const filters = [];
        if (mealType) filters.push(`meal type: ${mealType}`);
        if (cuisineType) filters.push(`cuisine: ${cuisineType}`);
        const filterText = filters.length > 0 ? ` The recipes must be ${filters.join(' and ')}.` : '';

        const cacheKey = getCacheKey(ingredients) + (mealType ? `:${mealType}` : '') + (cuisineType ? `:${cuisineType}` : '');

        if (responseCache.has(cacheKey)) {
            return res.json({ ...responseCache.get(cacheKey), cached: true });
        }

        const ingredientList = ingredients.join(', ');

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional chef. Generate exactly 4 recipes that can be made with the given ingredients. You may suggest additional common pantry staples (salt, pepper, oil, etc.) if needed.${filterText}

Return ONLY valid JSON in this exact format, no other text:
{
  "recipes": [
    {
      "id": "recipe-1",
      "title": "Recipe Name",
      "description": "Brief description of the dish (1-2 sentences)",
      "cook_time": "30 mins",
      "difficulty": "Easy",
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
      "ingredients": ["1 cup ingredient", "2 tbsp ingredient", ...],
      "instructions": ["Step 1...", "Step 2...", ...]
    }
  ]
}

Difficulty levels: Easy, Medium, Hard
Each recipe should have 5-10 ingredients and 4-8 instruction steps.
Provide realistic calorie counts (200-800 per serving) and nutritional estimates based on the ingredients listed.`
                },
                {
                    role: 'user',
                    content: `Suggest 4 recipes I can make with these ingredients: ${ingredientList}`
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;
        let parsed;

        try {
            parsed = JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
            return res.status(500).json({ error: 'Invalid response format from AI' });
        }

        responseCache.set(cacheKey, parsed);

        res.json({ ...parsed, cached: false });
    } catch (error) {
        console.error('Error:', error);
        
        if (error.status === 401 || error.code === 'invalid_api_key') {
            return res.status(401).json({ error: 'Invalid API key. Please check your OPENAI_API_KEY.' });
        }
        
        res.status(500).json({ error: 'Failed to generate recipes' });
    }
});

app.post('/api/generate-image', async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({ error: 'AI service not configured' });
        }

        const { recipeTitle, cuisine } = req.body;

        if (!recipeTitle) {
            return res.status(400).json({ error: 'Recipe title is required' });
        }

        const prompt = `A beautiful, appetizing ${cuisine || ''} dish called "${recipeTitle}". Professional food photography, on a elegant plate, soft natural lighting, restaurant quality, on a clean background. No text, no people in the frame.`;

        const image = await openai.images.generate({
            model: 'dall-e-3',
            prompt: prompt,
            size: '1024x1024',
            quality: 'standard',
            n: 1,
        });

        res.json({ imageUrl: image.data[0].url });
    } catch (error) {
        console.error('Error generating image:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
