export type Game = {
  gameId: string;
  code: string;
  role: "host" | "guest";
  colour: "white" | "black";
  status: "waiting" | "in_progress";
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

// The custom header is our cross-site protection (see architecture notes).
const headers = {
  "Content-Type": "application/json",
  "X-Requested-With": "chess-app",
};

let session: Promise<void> | undefined;

// Issues the guest cookie if there isn't one yet. Retried if it fails.
function ensureSession() {
  session ??= fetch("/api/session", { method: "POST", headers }).then((res) => {
    if (!res.ok) throw new ApiError(res.status, "session_failed");
  });
  session.catch(() => (session = undefined));
  return session;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureSession();
  const res = await fetch(`/api${path}`, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!res.ok) throw new ApiError(res.status, body.error ?? "unknown");
  return body;
}

export const createGame = (colour: "white" | "black" | "random") =>
  request<Game>("/games", { method: "POST", body: JSON.stringify({ colour }) });

export const joinGame = (code: string) =>
  request<Game>("/games/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

export const getGame = (id: string) => request<Game>(`/games/${id}`);

export function describeJoinError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "invalid_code":
        return "That invite code doesn't exist.";
      case "expired":
        return "That invite code has expired.";
      case "not_joinable":
        return "That game has already started.";
      case "game_full":
        return "That game is already full.";
    }
  }
  return "Something went wrong. Please try again.";
}
