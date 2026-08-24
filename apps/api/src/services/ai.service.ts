export class AiService {
  private static HF_API_KEY = process.env.HF_API_KEY;

  /**
   * Optional Hugging Face integration for smart replies.
   */
  static async generateSmartReply(contextText: string): Promise<string> {
    if (!this.HF_API_KEY) {
      console.log('HF_API_KEY not found. AI features disabled.');
      return '';
    }

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/google/flan-t5-base',
        {
          headers: {
            Authorization: `Bearer ${this.HF_API_KEY}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            inputs: `Generate a short reply to: ${contextText}`,
          }),
        }
      );

      const result = await response.json();
      
      if (Array.isArray(result) && result[0]?.generated_text) {
        return result[0].generated_text;
      }
      return '';
    } catch (error) {
      console.error('Error generating AI reply:', error);
      return '';
    }
  }
}
