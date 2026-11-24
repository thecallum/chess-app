import { expect, test } from "@playwright/test";

test("creating a game with a friend shows the game page waiting for them", async ({
  page,
}) => {
  await page.goto("/play/setup");

  await page.getByRole("link", { name: /play a friend/i }).click();
  await page.getByText("Black", { exact: true }).click();
  await page.getByRole("button", { name: "Create game" }).click();

  await expect(page).toHaveURL(/\/play\/games\/.+/);
  await expect(
    page.getByRole("heading", { name: /waiting for your opponent/i }),
  ).toBeVisible();
  await expect(page.getByText(/you will play as black/i)).toBeVisible();
  await expect(page.getByLabel("Invite code")).not.toBeEmpty();
});
