import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import PlaySetup, { meta } from "./play.setup";

function renderSetup() {
  return render(
    <MemoryRouter>
      <PlaySetup />
    </MemoryRouter>,
  );
}

describe("PlaySetup", () => {
  it("offers play a friend as the only enabled mode", () => {
    // Arrange
    renderSetup();

    // Act
    const friend = screen.getByRole("link", { name: /play a friend/i });
    const online = screen.getByRole("button", { name: /play online/i });
    const computer = screen.getByRole("button", { name: /play the computer/i });

    // Assert
    expect(friend).toBeInTheDocument();
    expect(online).toBeDisabled();
    expect(computer).toBeDisabled();
  });

  it("links play a friend to its setup page", () => {
    // Arrange
    renderSetup();

    // Act
    const friend = screen.getByRole("link", { name: /play a friend/i });

    // Assert
    expect(friend).toHaveAttribute("href", "/play/setup/play-with-friends");
  });
});

describe("meta", () => {
  it("provides a title", () => {
    // Act
    const tags = meta();

    // Assert
    expect(tags).toContainEqual({ title: expect.stringMatching(/\S/) });
  });
});
