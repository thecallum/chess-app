import { request, type Game } from "~/lib/api";

export const getGameByIdRequest = (id: string) => request<Game>(`/games/${id}`);
