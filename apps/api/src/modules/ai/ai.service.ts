import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { logger } from '@api/core/logger/logger';

export class AIService {
  /**
   * Generates a blog post draft based on a prompt.
   * Uses OpenAI (ChatGPT) for content generation.
   */
  async generateDraft(prompt: string): Promise<string> {
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Write a high-quality blog post draft based on the following instructions. Format the output in Markdown.\n\nInstructions: ${prompt}`,
      system: 'You are an expert technical blog writer. Write clear, engaging, and accurate content.',
    });
    return text;
  }

  /**
   * Rewrites a specific piece of text.
   * Uses OpenAI (ChatGPT) for content generation.
   */
  async rewriteText(text: string, instruction: string): Promise<string> {
    const { text: rewritten } = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: `Rewrite the following text according to this instruction: ${instruction}\n\nText: ${text}`,
      system: 'You are an expert editor.',
    });
    return rewritten;
  }

  /**
   * Extracts SEO metadata (title, description, tags) from a post.
   * Uses Anthropic (Claude) for marketing and SEO analysis as requested by the user.
   */
  async extractSeo(content: string): Promise<{ title: string, description: string, tags: string[] }> {
    const { text } = await generateText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      prompt: `Analyze the following blog post content and generate optimal SEO metadata.\n\nContent: ${content.substring(0, 5000)}`,
      system: `You are an expert SEO and marketing specialist. Return the metadata strictly as a JSON object with this exact structure:
{
  "title": "A catchy, SEO-optimized meta title under 60 characters",
  "description": "A compelling meta description between 150-160 characters",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}
Do not include any other text or markdown outside the JSON block.`,
    });

    try {
      // Find JSON block if Claude wrapped it in markdown
      const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
      return JSON.parse(jsonStr);
    } catch (e) {
      logger.error({ err: e, rawAiOutput: text }, 'Failed to parse Claude SEO response');
      throw new Error('Failed to generate valid SEO metadata');
    }
  }
}

export const aiService = new AIService();
