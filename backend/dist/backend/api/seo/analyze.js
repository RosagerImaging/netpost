"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const cors_1 = require("../../src/middleware/cors");
const errorHandler_1 = require("../../src/middleware/errorHandler");
const rateLimiting_1 = require("../../src/middleware/rateLimiting");
const auth_1 = require("../../src/utils/auth");
const database_1 = require("../../src/utils/database");
// Try to use OpenAI as primary, with fallback to mock analysis
let openaiClient = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAI } = require('openai');
    if (process.env.OPENAI_API_KEY) {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
}
catch (error) {
    console.log('OpenAI not available, using mock analysis');
}
async function handler(req, res) {
    if (!(0, cors_1.corsMiddleware)(req, res))
        return;
    if (!(0, rateLimiting_1.strictRateLimit)(req, res))
        return;
    if (req.method !== 'POST') {
        res.status(405).json({ success: false, error: 'Method not allowed' });
        return;
    }
    try {
        const user = await (0, auth_1.requireAuth)(req);
        const { inventoryItemId, platform } = req.body;
        if (!inventoryItemId || !platform) {
            throw new errorHandler_1.ValidationError('Inventory item ID and platform are required');
        }
        // Get inventory item
        const { data: item, error: itemError } = await database_1.supabaseAdmin
            .from('inventory_items')
            .select('*')
            .eq('id', inventoryItemId)
            .eq('user_id', user.id)
            .single();
        if (itemError || !item) {
            throw new errorHandler_1.ValidationError('Inventory item not found');
        }
        // Generate SEO analysis using AI or mock data
        let analysisResult;
        try {
            analysisResult = await generateSEOAnalysis(item, platform);
        }
        catch (aiError) {
            console.error('AI analysis failed, using mock analysis:', aiError);
            analysisResult = generateMockSEOAnalysis(item, platform);
        }
        // Save analysis to database
        const { data: seoAnalysis, error: saveError } = await database_1.supabaseAdmin
            .from('seo_analyses')
            .insert({
            user_id: user.id,
            inventory_item_id: inventoryItemId,
            platform,
            score: analysisResult.score,
            recommendations: analysisResult.recommendations,
            keyword_suggestions: analysisResult.keywordSuggestions,
            overall_assessment: analysisResult.overallAssessment,
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (saveError) {
            console.error('Failed to save SEO analysis:', saveError);
            // Continue anyway, return the analysis
        }
        res.status(200).json({
            success: true,
            data: {
                analysisId: seoAnalysis?.id,
                score: analysisResult.score,
                recommendations: analysisResult.recommendations,
                keywordSuggestions: analysisResult.keywordSuggestions,
                overallAssessment: analysisResult.overallAssessment,
                createdAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        (0, errorHandler_1.handleError)(error, res);
    }
}
async function generateSEOAnalysis(item, platform) {
    if (!openaiClient) {
        throw new Error('OpenAI not available');
    }
    const analysisPrompt = `
    Analyze the following e-commerce listing for SEO optimization on ${platform}:
    
    Title: ${item.title}
    Description: ${item.description}
    Category: ${item.category}
    Brand: ${item.brand || 'Not specified'}
    Condition: ${item.condition}
    Price: $${item.retail_price}
    
    Provide:
    1. SEO score (0-100)
    2. Top 3 specific recommendations with priority levels
    3. 5-10 relevant keyword suggestions
    4. Estimated impact of implementing recommendations
    
    Format as JSON with structure:
    {
      "score": number,
      "recommendations": [{"type": string, "priority": "high|medium|low", "description": string, "suggestedChange": string, "estimatedImpact": number}],
      "keywordSuggestions": [string],
      "overallAssessment": string
    }
  `;
    const response = await openaiClient.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'user',
                content: analysisPrompt
            }
        ],
        max_tokens: 1000,
        temperature: 0.7
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }
    try {
        return JSON.parse(content);
    }
    catch (parseError) {
        console.error('Failed to parse OpenAI response:', parseError);
        throw new Error('Failed to parse AI response');
    }
}
function generateMockSEOAnalysis(item, platform) {
    // Calculate mock score based on item properties
    let score = 50; // Base score
    // Title analysis
    if (item.title.length > 10 && item.title.length < 80)
        score += 15;
    if (item.title.includes(item.brand))
        score += 10;
    if (item.title.includes(item.condition))
        score += 5;
    // Description analysis
    if (item.description.length > 100)
        score += 10;
    if (item.description.length > 300)
        score += 5;
    // Category and brand
    if (item.brand)
        score += 5;
    if (item.category)
        score += 5;
    // Ensure score is within bounds
    score = Math.min(Math.max(score, 0), 100);
    const recommendations = [];
    if (item.title.length > 80) {
        recommendations.push({
            type: 'title_optimization',
            priority: 'high',
            description: 'Title is too long for optimal SEO',
            suggestedChange: 'Shorten title to under 80 characters while keeping key terms',
            estimatedImpact: 15
        });
    }
    if (item.description.length < 200) {
        recommendations.push({
            type: 'description_enhancement',
            priority: 'medium',
            description: 'Description is too short for good SEO',
            suggestedChange: 'Add more detailed product information, measurements, and benefits',
            estimatedImpact: 10
        });
    }
    if (!item.title.toLowerCase().includes(platform.toLowerCase())) {
        recommendations.push({
            type: 'platform_optimization',
            priority: 'low',
            description: 'Consider platform-specific keywords',
            suggestedChange: `Add platform-specific terms that perform well on ${platform}`,
            estimatedImpact: 8
        });
    }
    // Generate relevant keywords based on category and item
    const baseKeywords = {
        'clothing': ['fashion', 'style', 'trendy', 'outfit', 'wardrobe'],
        'electronics': ['tech', 'gadget', 'device', 'digital', 'modern'],
        'home': ['decor', 'interior', 'living', 'design', 'functional'],
        'collectibles': ['rare', 'vintage', 'collector', 'unique', 'limited']
    };
    const categoryKeywords = baseKeywords[item.category.toLowerCase()] || ['quality', 'authentic', 'original'];
    const conditionKeywords = {
        'new': ['brand new', 'unused', 'mint'],
        'like_new': ['excellent condition', 'barely used', 'pristine'],
        'excellent': ['great condition', 'well maintained', 'quality'],
        'good': ['good condition', 'functional', 'reliable']
    };
    const keywordSuggestions = [
        ...categoryKeywords,
        ...(conditionKeywords[item.condition] || []),
        item.brand?.toLowerCase(),
        'fast shipping',
        'authentic',
        'great deal'
    ].filter(Boolean).slice(0, 8);
    return {
        score,
        recommendations,
        keywordSuggestions,
        overallAssessment: score >= 80 ?
            'Excellent SEO optimization. Your listing is well-optimized for search visibility.' :
            score >= 60 ?
                'Good SEO foundation with room for improvement. Implement the recommendations to boost visibility.' :
                'Significant SEO improvements needed. Focus on the high-priority recommendations first.'
    };
}
