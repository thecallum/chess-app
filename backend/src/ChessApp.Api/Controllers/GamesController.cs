using ChessApp.Api.Auth;
using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using ChessApp.Api.UseCases.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChessApp.Api.Controllers;

public sealed record CreateGameRequest(ColourChoice Colour = ColourChoice.Random);

public sealed record JoinGameRequest(string? Code);

[ApiController]
[Authorize]
[Route("api/games")]
public sealed class GamesController : ControllerBase
{
    private readonly ICreateGameUseCase _createGameUseCase;
    private readonly IJoinGameUseCase _joinGameUseCase;
    private readonly IGetGameUseCase _getGameUseCase;

    public GamesController(ICreateGameUseCase createGameUseCase, IJoinGameUseCase joinGameUseCase, IGetGameUseCase getGameUseCase)
    {
        _createGameUseCase = createGameUseCase;
        _joinGameUseCase = joinGameUseCase;
        _getGameUseCase = getGameUseCase;
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateGameRequest request)
    {
        var playerId = User.PlayerId();

        var game = await _createGameUseCase.ExecuteAsync(playerId, request.Colour);
        var response = GameResponseFactory.Create(game, playerId);

        return Ok(response);
    }

    [HttpPost("join")]
    public async Task<IActionResult> Join(JoinGameRequest request)
    {
        var playerId = User.PlayerId();

        var result = await _joinGameUseCase.ExecuteAsync(playerId, request.Code ?? "");

        if (result.Error == JoinError.InvalidCode) return NotFound(new { error = "invalid_code" });

        if (result.Error == JoinError.NotJoinable) return Conflict(new { error = "not_joinable" });

        if (result.Error is not null) return Conflict(new { error = "game_full" });

        var response = GameResponseFactory.Create(result.Game!, playerId);

        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var playerId = User.PlayerId();

        var result = await _getGameUseCase.ExecuteAsync(playerId, id);

        if (result.Error == GetGameError.NotFound) return NotFound(new { error = "not_found" });

        if (result.Error is not null) return StatusCode(StatusCodes.Status403Forbidden, new { error = "access_denied" });

        var response = GameResponseFactory.Create(result.Game!, playerId);

        return Ok(response);
    }
}
