import { expect, test } from "@playwright/test";

test("starting a game from the homepage shows the game modes", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("main")
    .getByRole("link", { name: "Start a game" })
    .click();

  await expect(page).toHaveURL("/play/setup");
  await expect(
    page.getByRole("link", { name: /play a friend/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /play online/i }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /play the computer/i }),
  ).toBeDisabled();
});
