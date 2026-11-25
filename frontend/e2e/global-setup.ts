const api = "http://localhost:5081/api";
const headers = { "Content-Type": "application/json", "X-CSRF": "1" };

// Creating a game needs the database, which the API migrates on startup, so
// this only succeeds once the API is really ready.
async function canCreateGame() {
  try {
    const session = await fetch(`${api}/session`, { method: "POST", headers });
    const cookie = session.headers.get("set-cookie")?.split(";")[0];
    if (!session.ok || !cookie) return false;
    const game = await fetch(`${api}/games`, {
      method: "POST",
      headers: { ...headers, Cookie: cookie },
      body: JSON.stringify({ colour: "white" }),
    });
    return game.ok;
  } catch {
    return false;
  }
}

// Waits for the e2e API, and fails with the fix if it never comes up.
export default async function globalSetup() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await canCreateGame()) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    "The e2e API isn't ready on http://localhost:5081. Start it with `pnpm e2e:up`.",
  );
}
