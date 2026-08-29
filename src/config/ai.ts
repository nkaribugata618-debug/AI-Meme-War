export const aiConfig = {
  // Model settings
  model: "gemini-1.5-flash", // Fast, multimodal for vision
  temperature: 0.8,          // Slightly creative for humor
  maxRetries: 3,             // Retries for failed generations
  
  // Scoring weights (must sum to 1.0)
  weights: {
    audience: 0.5, // 50% audience votes
    ai: 0.5,       // 50% AI score
  },
  
  // Feature toggles
  toggles: {
    enableAiJudging: true,
    enableAiCommentary: true,
    enableWinnerCommentary: true,
  }
};
