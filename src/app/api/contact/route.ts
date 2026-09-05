import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, contact, service, message } = body;

    if (!name || !contact || !service || !message) {
      console.error("Missing fields");
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

    if (!botToken || !chatId) {
      console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing");
      return NextResponse.json(
        { error: "Telegram service is not configured" },
        { status: 500 }
      );
    }

    const escapeHtml = (text: string) =>
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const formattedMessage =
      `📬 <b>Yangi xabar (Portfolio)</b>\n\n` +
      `👤 <b>Ism:</b> ${escapeHtml(name)}\n` +
      `📞 <b>Aloqa:</b> ${escapeHtml(contact)}\n` +
      `🎯 <b>Xizmat:</b> ${escapeHtml(service)}\n` +
      `💬 <b>Xabar:</b>\n${escapeHtml(message)}`;

    const tgRes = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: formattedMessage,
          parse_mode: "HTML",
        }),
      }
    );

    const tgData = await tgRes.json();

    if (!tgRes.ok) {
      console.error("Telegram error:", tgData);
      return NextResponse.json(
        { error: "Telegram error", tgData },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CONTACT API CRASH:", err);
    return NextResponse.json(
      { error: "Server crash" },
      { status: 500 }
    );
  }
}
