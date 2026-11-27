namespace ChessApp.Api.Controllers.Responses;

// A game as seen by one of its players.
public sealed record GameResponse(Guid GameId, string Code, string Colour, string Status, string GameState);
