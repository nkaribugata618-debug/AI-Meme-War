import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIProviderError } from "./ai-provider.ts";

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    if (!apiKey || apiKey === "placeholder-key-replace-me") {
      throw new AIProviderError("Invalid Gemini API Key", "INVALID_KEY");
    }
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async generateIdeas(prompt: string): Promise<string[]> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a creative meme genius. Generate exactly 3 funny meme ideas based on the prompt. Return ONLY a JSON array of strings. No markdown formatting, no code blocks, just the raw JSON array. Example: ["Idea 1", "Idea 2", "Idea 3"]`;
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Prompt: ${prompt}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }], role: "model" }
      });
      
      const text = result.response.text();
      // Clean up potential markdown formatting block if the model ignores instructions
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Gemini Idea Gen Error:", error);
      throw new AIProviderError("Failed to generate ideas", "GEN_IDEAS_FAILED");
    }
  }

  async generateCaptions(context: string): Promise<string[]> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `Generate exactly 5 funny, punchy meme caption options for the provided context. Return ONLY a JSON array of strings. No markdown, no code blocks. Example: ["Caption 1", "Caption 2", "Caption 3", "Caption 4", "Caption 5"]`;
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Context: ${context}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }], role: "model" }
      });
      
      const text = result.response.text();
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleaned);
    } catch (error) {
      console.error("Gemini Caption Gen Error:", error);
      throw new AIProviderError("Failed to generate captions", "GEN_CAPTIONS_FAILED");
    }
  }

  async generateImage(prompt: string, aspectRatio?: "1:1" | "16:9"): Promise<string> {
    console.warn(`[GeminiProvider] Image generation requested for: ${prompt} (${aspectRatio})`);
    throw new AIProviderError(
      "Image generation is currently unavailable with the standard Gemini API key. Please use the upload feature.", 
      "IMAGE_GEN_UNAVAILABLE"
    );
  }

  private parseBase64(dataUrl: string) {
    if (!dataUrl.startsWith("data:")) {
      throw new Error("Invalid base64 data URL");
    }
    const [header, base64] = dataUrl.split(',');
    const mimeType = header.replace('data:', '').replace(';base64', '');
    return { mimeType, base64 };
  }

  async judgeMeme(imageUrl: string, prompt: string): Promise<number> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a meme judge. Score this meme based on Humor, Creativity, Originality, and relevance to the prompt. Respond with ONLY an integer from 1 to 100. Do not include any other text.`;
      
      const { mimeType, base64 } = this.parseBase64(imageUrl);
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { text: `Prompt: ${prompt}` },
            { inlineData: { data: base64, mimeType } }
          ]
        }],
        systemInstruction: { parts: [{ text: systemPrompt }], role: "model" }
      });
      
      const score = parseInt(result.response.text().trim(), 10);
      return isNaN(score) ? 50 : Math.min(100, Math.max(1, score));
    } catch (error) {
      console.error("Gemini Judge Error:", error);
      throw new AIProviderError("Failed to judge meme", "JUDGE_FAILED");
    }
  }

  async generateCommentary(imageUrl: string, prompt: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are a witty meme commentator. Write a single, punchy sentence (roast or compliment) about this meme based on the prompt. Keep it under 15 words. Do not use quotes or special formatting.`;
      
      const { mimeType, base64 } = this.parseBase64(imageUrl);
      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [
            { text: `Prompt: ${prompt}` },
            { inlineData: { data: base64, mimeType } }
          ]
        }],
        systemInstruction: { parts: [{ text: systemPrompt }], role: "model" }
      });
      
      return result.response.text().trim();
    } catch (error) {
      console.error("Gemini Commentary Error:", error);
      throw new AIProviderError("Failed to generate commentary", "COMMENTARY_FAILED");
    }
  }

  async generateWinnerSummary(leaderboardData: string): Promise<string> {
    try {
      const model = this.ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const systemPrompt = `You are the witty host of an AI Meme War competition. You have been given the final leaderboard data. Write an entertaining, highly energetic 2-3 sentence announcement declaring the winner and summarizing the round. Make it fun, use emojis, and hype up the winner!`;
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `Leaderboard Data:\n${leaderboardData}` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }], role: "model" }
      });
      
      return result.response.text().trim();
    } catch (error) {
      console.error("Gemini Winner Summary Error:", error);
      throw new AIProviderError("Failed to generate winner summary", "WINNER_SUMMARY_FAILED");
    }
  }
}
