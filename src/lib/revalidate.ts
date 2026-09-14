export async function triggerRevalidate(options: { path?: string; tag?: string } = {}) {
  try {
    await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
  } catch (e) {
    console.warn("Revalidation call failed:", e);
  }
}
