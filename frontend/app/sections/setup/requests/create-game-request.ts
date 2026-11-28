import { request, type ColourChoice, type Game } from "~/lib/api";

export const createGameRequest = (colour: ColourChoice) =>
  request<Game>("/games", { method: "POST", body: JSON.stringify({ colour }) });
