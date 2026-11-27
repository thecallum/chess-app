namespace ChessApp.Api.Controllers.Responses;

// A game as seen by one of its players, for creating, joining and loading it.
public sealed record GameResponse(
    Guid GameId,
    string Code,
    string Colour,
    string Status);
