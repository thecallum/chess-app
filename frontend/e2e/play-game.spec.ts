import {
  expect,
  test,
  type APIRequestContext,
  type Browser,
  type Page,
} from "@playwright/test";

// Calls the API directly, so the spec skips the setup screens (other specs
// cover those). Each browser context's request shares that player's cookies.
async function post(request: APIRequestContext, path: string, data?: object) {
  const response = await request.post(`/api${path}`, {
    headers: { "X-CSRF": "1" },
    data,
  });
  expect(response.ok()).toBe(true);
  return response.status() === 204 ? undefined : response.json();
}

// Resolves when the page's hub connection receives its first game state.
// Listens from before the page loads, so the message can't arrive unseen.
function firstGameState(page: Page) {
  return new Promise<void>((resolve) => {
    page.on("websocket", (socket) =>
      socket.on("framereceived", (frame) => {
        if (String(frame.payload).includes('"GameState"')) resolve();
      }),
    );
  });
}

// White (the host) creates a game, black (a guest in their own browser
// context) joins it, and both open the game page.
async function startGame(page: Page, browser: Browser) {
  await post(page.request, "/session");
  const game = await post(page.request, "/games", { colour: "white" });

  const guest = await browser.newContext();
  await post(guest.request, "/session");
  await post(guest.request, "/games/join", { code: game.code });

  const white = page;
  const black = await guest.newPage();
  await white.goto(`/play/games/${game.gameId}`);
  await black.goto(`/play/games/${game.gameId}`);
  await expect(white.getByRole("heading", { name: "Your move" })).toBeVisible();
  await expect(
    black.getByRole("heading", { name: "Opponent's move" }),
  ).toBeVisible();

  return { white, black, guest };
}

// Clicks a piece and then its target on the real board.
async function move(page: Page, from: string, to: string) {
  await page.locator(`[data-square="${from}"]`).click();
  await page.locator(`[data-square="${to}"]`).click();
}

const piece = (page: Page, square: string, pieceType: string) =>
  page.locator(`[data-square="${square}"] [data-piece="${pieceType}"]`);

const clock = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator("..");

// "4:57" => 297.
async function clockSeconds(page: Page, label: string) {
  const time = await clock(page, label).locator("p").nth(1).textContent();
  const [minutes, seconds] = (time ?? "").split(":").map(Number);
  return minutes * 60 + seconds;
}

test("the host sees the game start as soon as their friend joins", async ({
  page,
  browser,
}) => {
  // The host creates a game as white and opens it.
  await post(page.request, "/session");
  const game = await post(page.request, "/games", { colour: "white" });
  const hostConnected = firstGameState(page);
  await page.goto(`/play/games/${game.gameId}`);
  await expect(
    page.getByRole("heading", { name: /waiting for your opponent/i }),
  ).toBeVisible();

  // The host's first game state means their page is connected, so the join
  // below arrives as a live update rather than in the first state.
  await hostConnected;

  // The guest joins with the code from their own session.
  const guest = await browser.newContext();
  await post(guest.request, "/session");
  await post(guest.request, "/games/join", { code: game.code });

  // Without reloading, the host's page swaps the invite for the game.
  await expect(
    page.getByRole("heading", { name: /waiting for your opponent/i }),
  ).toBeHidden();
  await expect(page.getByRole("heading", { name: "Your move" })).toBeVisible();

  await guest.close();
});

test("two players see each other's moves", async ({ page, browser }) => {
  const { white, black, guest } = await startGame(page, browser);

  // White plays e4, and black sees it and is to move.
  await move(white, "e2", "e4");
  await expect(piece(black, "e4", "wP")).toBeVisible();
  await expect(black.getByRole("heading", { name: "Your move" })).toBeVisible();

  // Black replies e5, and white sees it and is to move.
  await move(black, "e7", "e5");
  await expect(piece(white, "e5", "bP")).toBeVisible();
  await expect(white.getByRole("heading", { name: "Your move" })).toBeVisible();

  await guest.close();
});

test("both players see the result when the game ends in checkmate", async ({
  page,
  browser,
}) => {
  const { white, black, guest } = await startGame(page, browser);

  // Fool's mate. Each move is waited for on the other side before replying.
  await move(white, "f2", "f3");
  await expect(black.getByRole("heading", { name: "Your move" })).toBeVisible();
  await move(black, "e7", "e5");
  await expect(white.getByRole("heading", { name: "Your move" })).toBeVisible();
  await move(white, "g2", "g4");
  await expect(black.getByRole("heading", { name: "Your move" })).toBeVisible();
  await move(black, "d8", "h4");

  const whiteMenu = white.getByRole("dialog", { name: "Game over" });
  await expect(
    whiteMenu.getByText("Black wins", { exact: true }),
  ).toBeVisible();
  await expect(whiteMenu.getByText("By checkmate")).toBeVisible();

  const blackMenu = black.getByRole("dialog", { name: "Game over" });
  await expect(blackMenu.getByText("Black wins (you)")).toBeVisible();
  await expect(blackMenu.getByText("By checkmate")).toBeVisible();

  await guest.close();
});

test("a player who reloads mid-game carries on where they left off", async ({
  page,
  browser,
}) => {
  const { white, black, guest } = await startGame(page, browser);
  await move(white, "e2", "e4");
  await expect(black.getByRole("heading", { name: "Your move" })).toBeVisible();
  await move(black, "e7", "e5");
  await expect(white.getByRole("heading", { name: "Your move" })).toBeVisible();

  await white.reload();

  // The position, the turn and the running clock come back from the server.
  await expect(piece(white, "e4", "wP")).toBeVisible();
  await expect(piece(white, "e5", "bP")).toBeVisible();
  await expect(white.getByRole("heading", { name: "Your move" })).toBeVisible();
  await expect(clock(white, "White (you)")).toHaveClass(/bg-primary/);

  // And the game carries on.
  await move(white, "g1", "f3");
  await expect(piece(black, "f3", "wN")).toBeVisible();

  await guest.close();
});

test("both players see the same time on the running clock", async ({
  page,
  browser,
}) => {
  const { white, black, guest } = await startGame(page, browser);
  await move(white, "e2", "e4");
  await expect(clock(white, "Black (opponent)")).toHaveClass(/bg-primary/);
  await expect(clock(black, "Black (you)")).toHaveClass(/bg-primary/);

  // Let black's clock run for a few seconds.
  const start = await clockSeconds(black, "Black (you)");
  await expect
    .poll(() => clockSeconds(black, "Black (you)"), { timeout: 10_000 })
    .toBeLessThanOrEqual(start - 3);

  // The two screens tick separately, so read them together, allow a second
  // between them, and retry in case one ticks over mid-read.
  await expect
    .poll(async () => {
      const [onWhite, onBlack] = await Promise.all([
        clockSeconds(white, "Black (opponent)"),
        clockSeconds(black, "Black (you)"),
      ]);
      return Math.abs(onWhite - onBlack);
    })
    .toBeLessThanOrEqual(1);

  await guest.close();
});
