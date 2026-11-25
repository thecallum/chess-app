import { describe, expect, it } from "vitest";
import { ApiError } from "~/lib/api";
import { describeJoinError } from "./describe-join-error";

describe("describeJoinError", () => {
  it("says the code doesn't exist for an invalid code", () => {
    // Arrange
    const error = new ApiError(404, "invalid_code");

    // Act
    const message = describeJoinError(error);

    // Assert
    expect(message).toBe("That invite code doesn't exist.");
  });

  it("gives a generic message for any other server rejection", () => {
    // Arrange
    const error = new ApiError(409, "game_full");

    // Act
    const message = describeJoinError(error);

    // Assert
    expect(message).toBe("Unable to join game.");
  });

  it("asks the user to try again for an unexpected error", () => {
    // Arrange
    const error = new Error("network down");

    // Act
    const message = describeJoinError(error);

    // Assert
    expect(message).toBe("Something went wrong. Please try again.");
  });
});
