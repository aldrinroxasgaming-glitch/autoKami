import { Router, Request, Response } from 'express';
import { getOrCreateUser, getSystemLogs, updateUserTelegramSettings } from '../services/supabaseService.js';
import { telegram } from '../services/telegram.js';

const router = Router();

/**
 * POST /api/system/telegram/test
 * Send a test message to Telegram
 * 
 * Body:
 * - privyUserId: string
 */
router.post('/telegram/test', async (req: Request, res: Response) => {
    try {
        const { privyUserId } = req.body;

        if (!privyUserId) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const user = await getOrCreateUser(privyUserId);

        if (!user.telegram_bot_token || !user.telegram_chat_id) {
            return res.status(400).json({
                error: 'Telegram settings not configured'
            });
        }

        const success = await telegram.sendMessage(
            '🔔 *Kamigotchi Test Message*\n\nYour Telegram notifications are configured correctly! You will receive alerts here.', 
            {
                chatId: user.telegram_chat_id,
                botToken: user.telegram_bot_token,
                parseMode: 'Markdown'
            }
        );

        if (success) {
            return res.json({ success: true });
        } else {
            return res.status(500).json({ error: 'Failed to send Telegram message' });
        }

    } catch (error) {
        console.error('Error sending test message:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to send test message'
        });
    }
});

/**
 * POST /api/system/telegram
 * Update Telegram settings for a user
 * 
 * Body:
 * - privyUserId: string
 * - botToken: string
 * - chatId: string
 */
router.post('/telegram', async (req: Request, res: Response) => {
    try {
        const { privyUserId, botToken, chatId } = req.body;

        if (!privyUserId || !botToken || !chatId) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }

        const user = await updateUserTelegramSettings(privyUserId, botToken, chatId);

        return res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Error updating Telegram settings:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to update settings'
        });
    }
});

/**
 * GET /api/system/user
 * Get user details (for settings)
 * 
 * Query:
 * - privyUserId: string
 */
router.get('/user', async (req: Request, res: Response) => {
    try {
        const { privyUserId } = req.query;

        if (!privyUserId || typeof privyUserId !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: privyUserId'
            });
        }

        const user = await getOrCreateUser(privyUserId);

        return res.json({
            user: {
                id: user.id,
                telegram_bot_token: user.telegram_bot_token,
                telegram_chat_id: user.telegram_chat_id
            }
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch user'
        });
    }
});

/**
 * GET /api/system/logs
 * Get system logs for a user
 * 
 * Query:
 * - privyUserId: string (Privy user ID)
 * - limit: number (optional, default 50)
 */
router.get('/logs', async (req: Request, res: Response) => {
    try {
        const { privyUserId, limit } = req.query;

        if (!privyUserId || typeof privyUserId !== 'string') {
            return res.status(400).json({
                error: 'Missing required query parameter: privyUserId'
            });
        }

        // Get user
        const user = await getOrCreateUser(privyUserId);

        const limitVal = limit ? parseInt(limit as string) : 50;

        // Fetch logs for this user
        const logs = await getSystemLogs(user.id, limitVal);

        return res.json({
            logs
        });
    } catch (error) {
        console.error('Error fetching system logs:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch system logs'
        });
    }
});

export default router;
