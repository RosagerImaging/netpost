import { VercelRequest, VercelResponse } from '@vercel/node';
import { corsMiddleware } from '../../src/middleware/cors';
import { handleError, ValidationError } from '../../src/middleware/errorHandler';
import { requireAuth } from '../../src/utils/auth';
import { supabaseAdmin } from '../../src/utils/database';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!corsMiddleware(req, res)) return;

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const user = await requireAuth(req);
    const { inventoryItemId, platform } = req.body;

    if (!inventoryItemId || !platform) {
      throw new ValidationError('Inventory item ID and platform are required');
    }

    // Get inventory item
    const { data: item, error: itemError } = await supabaseAdmin
      .from('inventory_items')
      .select('*')
      .eq('id', inventoryItemId)
      .eq('user_id', user.id)
      .single();

    if (itemError || !item) {
      throw new ValidationError('Inventory item not found');
    }

    // Generate SEO analysis using AI
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

    const message = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: analysisPrompt
        }
      ]
    });

    let analysisResult;
    try {
      const content = message.content[0];
      if (content.type === 'text') {
        analysisResult = JSON.parse(content.text);
      } else {
        throw new Error('Unexpected response type');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to generate SEO analysis');
    }

    // Save analysis to database
    const { data: seoAnalysis, error: saveError } = await supabaseAdmin
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
  } catch (error) {
    handleError(error, res);
  }
}