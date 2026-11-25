import { request, type Game } from "~/lib/api";

export const joinGameRequest = (code: string) =>
  request<Game>("/games/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
