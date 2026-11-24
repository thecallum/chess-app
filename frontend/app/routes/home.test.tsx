import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import Home, { meta } from "./home";

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe("Home", () => {
  it("links the start button to game setup", () => {
    // Arrange
    renderHome();

    // Act
    const startButton = screen.getByRole("link", { name: /start a game/i });

    // Assert
    expect(startButton).toHaveAttribute("href", "/play/setup");
  });

  it("explains how it works in three steps", () => {
    // Arrange
    renderHome();

    // Act
    const section = screen.getByRole("region", { name: /how it works/i });
    const steps = within(section).getAllByRole("listitem");

    // Assert
    expect(steps).toHaveLength(3);
  });
});

describe("meta", () => {
  it("provides a title and description", () => {
    // Act
    const tags = meta();

    // Assert
    expect(tags).toContainEqual({
      title: expect.stringMatching(/\S/),
    });
    expect(tags).toContainEqual({
      name: "description",
      content: expect.stringMatching(/\S/),
    });
  });
});
