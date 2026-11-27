export type Colour = "white" | "black";
export type ColourChoice = Colour | "random";
export type GameStatus = "waiting" | "in_progress" | "completed";

export type Game = {
  gameId: string;
  code: string;
  colour: Colour;
  status: GameStatus;
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
  "X-CSRF": "1",
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

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  await ensureSession();
  const res = await fetch(`/api${path}`, { ...init, headers });
  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & T;
  if (!res.ok) throw new ApiError(res.status, body.error ?? "unknown");
  return body;
}
