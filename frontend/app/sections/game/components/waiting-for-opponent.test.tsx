import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Game } from "~/lib/api";
import { WaitingForOpponent } from "./waiting-for-opponent";

// A game just created by this player, as the API returns it on first load.
const game: Game = {
  gameId: "088f2076-e370-463a-ae70-5410f1f34d46",
  code: "AE4905C80F4B4B32BA34C8F4C843DABF",
  colour: "white",
  status: "waiting",
};

describe("WaitingForOpponent", () => {
  it.each(["white", "black"] as const)(
    "shows that the player will play %s",
    (colour) => {
      // Act
      render(<WaitingForOpponent game={{ ...game, colour }} />);

      // Assert
      expect(
        screen.getByText(new RegExp(`you will play as ${colour}`, "i")),
      ).toBeInTheDocument();
    },
  );

  it("shows that it is waiting for the opponent", () => {
    // Act
    render(<WaitingForOpponent game={game} />);

    // Assert
    expect(
      screen.getByRole("heading", { name: /waiting for your opponent/i }),
    ).toBeInTheDocument();
  });

  it("shows the invite code to share", () => {
    // Act
    render(<WaitingForOpponent game={game} />);

    // Assert
    expect(screen.getByLabelText(/invite code/i)).toHaveValue(game.code);
  });
});
