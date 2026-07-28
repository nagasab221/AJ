/**
 * Telegram notifications for the shop owner. Credentials are read server-side
 * only (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID); when they are missing every
 * function here quietly no-ops so bookings still succeed.
 */

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Escape user-supplied text for Telegram's HTML parse mode. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendTelegramMessage(html: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: html,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true }
      }),
      signal: AbortSignal.timeout(9000)
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!json?.ok) {
      console.error('[telegram] sendMessage failed:', json?.description ?? res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[telegram] sendMessage error:', err);
    return false;
  }
}
