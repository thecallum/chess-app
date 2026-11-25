import { request, type Game } from "~/lib/api";

export const getGame = (id: string) => request<Game>(`/games/${id}`);
