-- Add Telegram fields to users table
ALTER TABLE public.users 
ADD COLUMN telegram_bot_token TEXT,
ADD COLUMN telegram_chat_id TEXT;
