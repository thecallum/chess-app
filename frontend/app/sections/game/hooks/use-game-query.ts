import { useQuery } from "@tanstack/react-query";
import { getGameByIdRequest } from "../requests/get-game-by-id-request";

// Loads the game once over HTTP. Live state comes from the game hub after that.
export const useGameQuery = (gameId: string | undefined) =>
  useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGameByIdRequest(gameId!),
    enabled: !!gameId,
    // A missing or forbidden game won't appear on a retry, so show it straight away.
    retry: false,
  });
