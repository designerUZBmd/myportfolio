import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("CONTACT BODY:", body);

    const { name, contact, service, message } = body;

    if (!name || !contact || !service || !message) {
      console.error("Missing fields");
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    console.log("BOT TOKEN:", process.env.TELEGRAM_BOT_TOKEN);
    console.log("CHAT ID:", process.env.TELEGRAM_CHAT_ID);

    const tgRes = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: Number(process.env.TELEGRAM_CHAT_ID),
          text: `New inquiry\nName: ${name}\nContact: ${contact}\nService: ${service}\nMessage: ${message}`,
        }),
      }
    );

    const tgData = await tgRes.json();
    console.log("TELEGRAM STATUS:", tgRes.status);
    console.log("TELEGRAM RESPONSE:", tgData);

    if (!tgRes.ok) {
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
