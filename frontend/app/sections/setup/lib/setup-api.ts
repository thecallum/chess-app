import { ApiError, request, type Game } from "~/lib/api";
import type { Colour } from "../modes";

export const createGame = (colour: Colour) =>
  request<Game>("/games", { method: "POST", body: JSON.stringify({ colour }) });

export const joinGame = (code: string) =>
  request<Game>("/games/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export function describeJoinError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "invalid_code") return "That invite code doesn't exist.";

    // Not joinable, game full, or anything else the server rejects.
    return "Unable to join game.";
  }
  return "Something went wrong. Please try again.";
}
