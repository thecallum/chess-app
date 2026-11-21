using ChessApp.Api.Models;
using ChessApp.Api.Session;
using ChessApp.Api.UseCases;
using Microsoft.AspNetCore.Mvc;

namespace ChessApp.Api.Controllers;

public sealed record CreateGameRequest(ColourChoice Colour = ColourChoice.Random);

public sealed record JoinGameRequest(string? Code);

// A game as seen by one of its players.
public sealed record GameResponse(Guid GameId, string Code, string Role, string Colour, string Status)
{
    public static GameResponse For(Game game, Guid playerId) => new(
        game.Id,
        game.Code,
        game.HostId == playerId ? "host" : "guest",
        game.ColourOf(playerId).ToString().ToLowerInvariant(),
        game.Status == GameStatus.WaitingForOpponent ? "waiting" : "in_progress");
}

[ApiController]
[Route("api/games")]
public sealed class GamesController : ControllerBase
{
    [HttpPost]
    public IActionResult Create(CreateGameRequest request, [FromServices] CreateGame createGame)
    {
        if (GuestSession.Read(HttpContext) is not { } playerId) return Unauthorized();

        return Ok(GameResponse.For(createGame.Execute(playerId, request.Colour), playerId));
    }

    [HttpPost("join")]
    public IActionResult Join(JoinGameRequest request, [FromServices] JoinGame joinGame)
    {
        if (GuestSession.Read(HttpContext) is not { } playerId) return Unauthorized();

        var result = joinGame.Execute(playerId, request.Code ?? "");
        return result.Error switch
        {
            null => Ok(GameResponse.For(result.Game!, playerId)),
            JoinError.InvalidCode => NotFound(new { error = "invalid_code" }),
            JoinError.Expired => StatusCode(StatusCodes.Status410Gone, new { error = "expired" }),
            _ => Conflict(new { error = "game_full" }),
        };
    }

    [HttpGet("{id:guid}")]
    public IActionResult Get(Guid id, [FromServices] GetGame getGame)
    {
        if (GuestSession.Read(HttpContext) is not { } playerId) return Unauthorized();

        return getGame.Execute(playerId, id) is { } game
            ? Ok(GameResponse.For(game, playerId))
            : NotFound(new { error = "not_found" });
    }
}
