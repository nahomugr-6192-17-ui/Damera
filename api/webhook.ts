// ============================================================
// api/webhook.ts — DameraBot Telegram Webhook Handler
// Serverless function deployed on Vercel to handle /start
// and open Damera as a Telegram Mini App.
// ============================================================

export default async function handler(req: any, res: any) {
  // Allow GET for simple health check in browser
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: '🔥 DameraBot Webhook is active and listening for Telegram updates.'
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Verify Webhook Secret Token (if configured)
  const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (configuredSecret) {
    const incomingSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (incomingSecret !== configuredSecret) {
      console.warn('[Webhook] Unauthorized: invalid or missing secret token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // 2. Validate Bot Token
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error('[Webhook] Error: TELEGRAM_BOT_TOKEN environment variable is not set');
    // Return 200 to prevent Telegram from repeatedly retrying when env var is missing
    return res.status(200).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN not configured' });
  }

  // 3. Parse incoming update from Telegram
  try {
    const update = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const message = update?.message;

    if (message && typeof message.text === 'string') {
      const text = message.text.trim();

      // Check if message is /start (handles "/start" and deep-linking e.g. "/start app")
      if (text.startsWith('/start')) {
        const chatId = message.chat.id;

        const welcomeText =
`🔥 Welcome to Damera!
A game by Papa Smurf 🌲
Gather wood, race against time, and keep the ዳመራ burning!
Can you save the fire before time runs out? 😉`;

        const payload = {
          chat_id: chatId,
          text: welcomeText,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🎮 START PLAYING',
                  web_app: {
                    url: 'https://damera.pro.et'
                  }
                }
              ]
            ]
          }
        };

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!data.ok) {
          console.error('[Webhook] Telegram sendMessage failed:', data);
        }
      }
    }

    // Always acknowledge Telegram updates with HTTP 200 to prevent duplicate retries
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[Webhook] Exception handling update:', error);
    // Return 200 to Telegram so it does not retry failed updates indefinitely
    return res.status(200).json({ ok: true, error: 'Handled with error' });
  }
}
