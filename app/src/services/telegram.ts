import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars if not already loaded
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessageOptions {
  chatId?: string;
  botToken?: string;
  parseMode?: 'Markdown' | 'HTML';
  disableWebPagePreview?: boolean;
}

export class TelegramService {
  private static instance: TelegramService;
  private enabled: boolean = false;

  private constructor() {
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      this.enabled = true;
      console.log('[Telegram] Service initialized with token and chat ID.');
    } else {
      console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Service disabled.');
    }
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  /**
   * Send a text message to Telegram
   */
  public async sendMessage(message: string, options: TelegramMessageOptions = {}): Promise<boolean> {
    const botToken = options.botToken || TELEGRAM_BOT_TOKEN;
    const chatId = options.chatId || TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.log('[Telegram] Skipped sending message (missing token or chat ID):', message);
      return false;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: options.parseMode,
          disable_web_page_preview: options.disableWebPagePreview
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Telegram] API Error:', errorData);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Telegram] Network Error:', error);
      return false;
    }
  }

  /**
   * Send a log message (info)
   */
  public async sendLog(message: string, context?: any): Promise<boolean> {
    const timestamp = new Date().toISOString();
    let text = `ℹ️ *Log* [${timestamp}]\n\n${message}`;
    
    if (context) {
      text += `\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``;
    }

    return this.sendMessage(text, { parseMode: 'Markdown' });
  }

  /**
   * Send an error message
   */
  public async sendError(message: string, error?: any): Promise<boolean> {
    const timestamp = new Date().toISOString();
    let text = `🚨 *Error* [${timestamp}]\n\n${message}`;

    if (error) {
        const errorDetails = error instanceof Error ? error.message + '\n' + error.stack : JSON.stringify(error, null, 2);
        text += `\n\n\`\`\`\n${errorDetails}\n\`\`\``;
    }

    return this.sendMessage(text, { parseMode: 'Markdown' });
  }
}

export const telegram = TelegramService.getInstance();
