import { request, type Game } from "~/lib/api";
import type { Colour } from "../modes";

export const createGameRequest = (colour: Colour) =>
  request<Game>("/games", { method: "POST", body: JSON.stringify({ colour }) });
