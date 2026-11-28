import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionMenu } from "./connection-menu";

describe("ConnectionMenu", () => {
  it("shows the reconnecting state", () => {
    // Act
    render(<ConnectionMenu status="reconnecting" />);

    // Assert
    expect(
      screen.getByRole("dialog", { name: /reconnecting/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reload/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the disconnected state with a reload button", () => {
    // Act
    render(<ConnectionMenu status="disconnected" />);

    // Assert
    expect(
      screen.getByRole("dialog", { name: /disconnected/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument();
  });
});
