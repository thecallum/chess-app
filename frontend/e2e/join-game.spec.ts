import { expect, test } from "@playwright/test";

test("a friend can join a game with its invite code", async ({
  page,
  browser,
}) => {
  // The host creates a game.
  await page.goto("/play/setup/play-with-friends");
  await page.getByRole("button", { name: "Create game" }).click();
  await expect(page).toHaveURL(/\/play\/games\/.+/);
  const code = await page.getByLabel("Invite code").inputValue();

  // The guest is a separate browser context, so it gets its own session.
  const guestContext = await browser.newContext();
  const guest = await guestContext.newPage();
  await guest.goto("/play/setup/play-with-friends");
  await guest.getByLabel("Invite code").fill(code);
  await guest.getByRole("button", { name: "Join game" }).click();

  await expect(guest).toHaveURL(/\/play\/games\/.+/);
  await expect(guest.getByText(/you are playing (white|black)/i)).toBeVisible();

  await guestContext.close();
});
