# AI Integration Architecture

AI Meme War uses an abstracted provider pattern for integrating AI capabilities, ensuring tight coupling to business logic is avoided and different models (like Google Vertex AI vs Gemini Standard API) can be swapped seamlessly in the future.

## AI Provider Abstraction
Defined in `src/lib/ai/ai-provider.ts`, the interface mandates three primary methods:
- `generateIdeas(prompt: string): Promise<string[]>`
- `generateCaptions(context: string): Promise<string[]>`
- `generateImage(prompt: string, aspectRatio?: "1:1" | "16:9"): Promise<string>`

### Gemini Provider Implementation
The application currently uses `GeminiProvider` (`src/lib/ai/gemini-provider.ts`) powered by the `@google/generative-ai` SDK (`gemini-1.5-flash`).

#### Prompt Strategy
- **Ideas**: `You are a creative meme genius. Generate exactly 3 funny meme ideas based on the prompt. Return ONLY a JSON array of strings. No markdown formatting, no code blocks, just the raw JSON array.`
- **Captions**: `Generate exactly 5 funny, punchy meme caption options for the provided context. Return ONLY a JSON array of strings. No markdown, no code blocks.`

#### Image Generation & Error Handling
Standard Gemini REST endpoints natively support Text and Multimodal inputs but omit raw image generation (Imagen 3) which is restricted to Vertex AI. 
To strictly avoid locking the architecture to Vertex AI, the `GeminiProvider.generateImage` method throws a graceful `AIProviderError` with the code `IMAGE_GEN_UNAVAILABLE`. The UI (`AIControls.tsx`) catches this and explicitly guides the user to fall back onto the local Custom Upload feature, preserving the architecture for a drop-in Vertex AI replacement when desired.

## Environment Variables
- `GEMINI_API_KEY`: A standard Google AI Studio API key used to instantiate the generative model.
