export interface AIProvider {
  /**
   * Generates 3 meme ideas based on a given prompt.
   * @param prompt The competition round prompt (e.g., "College Life")
   * @returns Array of 3 string ideas
   */
  generateIdeas(prompt: string): Promise<string[]>;

  /**
   * Generates 5 caption suggestions for a specific idea or general context.
   * @param context The context or selected idea for the meme
   * @returns Array of 5 string captions
   */
  generateCaptions(context: string): Promise<string[]>;

  /**
   * Generates a base image for the meme.
   * @param prompt Detailed description of the desired image
   * @param aspectRatio Aspect ratio ("1:1" or "16:9")
   * @returns URL or Base64 string of the generated image
   */
  generateImage(prompt: string, aspectRatio?: "1:1" | "16:9"): Promise<string>;
}

export class AIProviderError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "AIProviderError";
    this.code = code;
  }
}
