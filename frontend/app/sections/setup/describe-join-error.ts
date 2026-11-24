import { ApiError } from "~/lib/api";

export function describeJoinError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "invalid_code") return "That invite code doesn't exist.";

    // Not joinable, game full, or anything else the server rejects.
    return "Unable to join game.";
  }
  return "Something went wrong. Please try again.";
}
