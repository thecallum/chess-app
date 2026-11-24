import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status });

// The session is cached at module level, so each test loads a fresh copy.
async function loadApi() {
  vi.resetModules();
  return import("./api");
}

describe("request", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a session before the first request", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock.mockImplementation(async () => json({}));

    // Act
    await request("/games");

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/session");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[1][0]).toBe("/api/games");
  });

  it("only creates the session once across requests", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock.mockImplementation(async () => json({}));

    // Act
    await request("/games");
    await request("/games/join");

    // Assert
    const sessionCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/session",
    );
    expect(sessionCalls).toHaveLength(1);
  });

  it("shares one session request between concurrent requests", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock.mockImplementation(async () => json({}));

    // Act
    await Promise.all([request("/games"), request("/games/join")]);

    // Assert
    const sessionCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/session",
    );
    expect(sessionCalls).toHaveLength(1);
  });

  it("sends the CSRF header with the session and the request", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock.mockImplementation(async () => json({}));

    // Act
    await request("/games");

    // Assert
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.headers).toMatchObject({ "X-CSRF": "1" });
    }
  });

  it("fails with session_failed, without sending the request, if the session can't be created", async () => {
    // Arrange
    const { request, ApiError } = await loadApi();
    fetchMock.mockImplementation(async () => json({}, 500));

    // Act
    const result = request("/games");

    // Assert
    await expect(result).rejects.toMatchObject({
      status: 500,
      code: "session_failed",
    });
    await expect(result).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries creating the session after it failed", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock.mockResolvedValueOnce(json({}, 500));
    await request("/games").catch(() => undefined);
    fetchMock.mockImplementation(async () => json({}));

    // Act
    await request("/games");

    // Assert
    const sessionCalls = fetchMock.mock.calls.filter(
      ([url]) => url === "/api/session",
    );
    expect(sessionCalls).toHaveLength(2);
  });

  it("returns the response body on success", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({ gameId: "g1" }));

    // Act
    const result = await request("/games");

    // Assert
    expect(result).toEqual({ gameId: "g1" });
  });

  it("throws an ApiError with the server's error code on failure", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(json({ error: "invalid_code" }, 404));

    // Act
    const result = request("/games/join");

    // Assert
    await expect(result).rejects.toMatchObject({
      status: 404,
      code: "invalid_code",
    });
  });

  it("uses the code unknown when the error response has no body", async () => {
    // Arrange
    const { request } = await loadApi();
    fetchMock
      .mockResolvedValueOnce(json({}))
      .mockResolvedValueOnce(new Response(null, { status: 502 }));

    // Act
    const result = request("/games");

    // Assert
    await expect(result).rejects.toMatchObject({
      status: 502,
      code: "unknown",
    });
  });
});
