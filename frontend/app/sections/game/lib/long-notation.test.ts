import { describe, expect, it } from "vitest";
import { toLongNotation } from "./long-notation";

describe("toLongNotation", () => {
  it("formats a move without promotion", () => {
    // Act
    const notation = toLongNotation({ from: "e2", to: "e4" });

    // Assert
    expect(notation).toBe("{e2 - e4}");
  });

  it("formats a promotion in lower case", () => {
    // Act
    const notation = toLongNotation({ from: "e7", to: "e8", promotion: "Q" });

    // Assert
    expect(notation).toBe("{e7 - e8 - =q}");
  });
});
