namespace ChessApp.Api.Hubs.Responses;

// The live state of a game, sent to its players over the game hub.
public sealed record GameStateResponse(
    Guid GameId,
    string Status,
    string GameState,
    int CurrentMove,
    int WhiteTimeRemainingMs,
    int BlackTimeRemainingMs,
    DateTime? LastMoveAt,
    string? Result,
    string? Winner);
