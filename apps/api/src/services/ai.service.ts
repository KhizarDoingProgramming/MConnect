import { prisma } from '../lib/prisma.js';

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

  static async getBotUser() {
    let bot = await prisma.user.findUnique({ where: { username: 'mconnect_ai' } });
    if (!bot) {
      bot = await prisma.user.create({
        data: {
          username: 'mconnect_ai',
          email: 'ai@mconnect.local',
          passwordHash: 'no-login-allowed',
          displayName: 'MConnect AI',
          status: 'online',
          customStatus: 'Always here to help!',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=MConnect'
        }
      });
    }
    return bot;
  }
}
