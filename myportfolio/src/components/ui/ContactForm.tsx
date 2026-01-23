"use client";

export default function ContactForm() {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    const data = {
      name: form.name.value,
      contact: form.contact.value,
      service: form.service.value,
      message: form.message.value,
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      alert("Failed to send");
    } else {
      alert("Sent ✅");
      form.reset();
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Your name" required />
      <input name="contact" placeholder="Telegram / Phone / Email" required />
      <select name="service" required>
        <option value="">Select service</option>
        <option value="Web design">Web design</option>
        <option value="Motion design">Motion design</option>
        <option value="Branding">Branding</option>
      </select>
      <textarea name="message" required />
      <button type="submit">Send</button>
    </form>
  );
}
