import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Game } from "~/lib/api";
import { GameInProgress } from "./game-in-progress";

const game: Game = {
  gameId: "088f2076-e370-463a-ae70-5410f1f34d46",
  code: "AE4905C80F4B4B32BA34C8F4C843DABF",
  role: "host",
  colour: "white",
  status: "in_progress",
};

describe("GameInProgress", () => {
  it.each(["white", "black"] as const)(
    "shows that the player is playing %s",
    (colour) => {
      // Act
      render(<GameInProgress game={{ ...game, colour }} />);

      // Assert
      expect(
        screen.getByText(new RegExp(`you are playing ${colour}`, "i")),
      ).toBeInTheDocument();
    },
  );

  it("tells the host their opponent joined", () => {
    // Act
    render(<GameInProgress game={{ ...game, role: "host" }} />);

    // Assert
    expect(
      screen.getByRole("heading", { name: /your opponent joined/i }),
    ).toBeInTheDocument();
  });

  it("tells the guest they joined the game", () => {
    // Act
    render(<GameInProgress game={{ ...game, role: "guest" }} />);

    // Assert
    expect(
      screen.getByRole("heading", { name: /you joined the game/i }),
    ).toBeInTheDocument();
  });
});
