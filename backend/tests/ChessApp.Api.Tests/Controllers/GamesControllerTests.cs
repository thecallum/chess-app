using System.Security.Claims;
using System.Text.Json;
using ChessApp.Api.Controllers;
using ChessApp.Api.Controllers.Responses;
using ChessApp.Api.Models;
using ChessApp.Api.UseCases;
using ChessApp.Api.UseCases.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace ChessApp.Api.Tests.Controllers;

public class GamesControllerTests
{
    private readonly Mock<ICreateGameUseCase> _createGame = new();
    private readonly Mock<IJoinGameUseCase> _joinGame = new();
    private readonly Mock<IGetGameUseCase> _getGame = new();
    private readonly Guid _playerId = Guid.NewGuid();

    // The controller reads the player's id from the signed-in user, so give it one.
    private GamesController NewController() => new(_createGame.Object, _joinGame.Object, _getGame.Object)
    {
        ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, _playerId.ToString())], "Test")),
            },
        },
    };

    private static string ErrorCodeOf(ObjectResult result) =>
        JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(result.Value))
            .GetProperty("error").GetString()!;

    // Create

    [Fact]
    public async Task Create_WhenCalled_GeneratesNewGame()
    {
        // Arrange
        var game = new Game(_playerId, PieceColour.Black, "ABC");
        _createGame.Setup(u => u.ExecuteAsync(_playerId, ColourChoice.Black)).ReturnsAsync(game);

        // Act
        var result = await NewController().Create(new CreateGameRequest(ColourChoice.Black));

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<GameResponse>(ok.Value);
        Assert.Equal(game.Id, response.GameId);
        Assert.Equal("ABC", response.Code);
        Assert.Equal("black", response.Colour);
        _createGame.Verify(u => u.ExecuteAsync(_playerId, ColourChoice.Black), Times.Once);
    }

    // Get

    [Fact]
    public async Task Get_WhenNotFound_Returns404Response()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _getGame.Setup(u => u.ExecuteAsync(_playerId, gameId))
            .ReturnsAsync(new GetGameResult(null, GetGameError.NotFound));

        // Act
        var result = await NewController().Get(gameId);

        // Assert
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("not_found", ErrorCodeOf(notFound));
    }

    [Fact]
    public async Task Get_WhenNoAccess_ReturnsForbiddenResponse()
    {
        // Arrange
        var gameId = Guid.NewGuid();
        _getGame.Setup(u => u.ExecuteAsync(_playerId, gameId))
            .ReturnsAsync(new GetGameResult(null, GetGameError.AccessDenied));

        // Act
        var result = await NewController().Get(gameId);

        // Assert
        var forbidden = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
        Assert.Equal("access_denied", ErrorCodeOf(forbidden));
    }

    [Fact]
    public async Task Get_WhenExists_ReturnsOkResponse()
    {
        // Arrange
        var game = new Game(_playerId, PieceColour.White, "ABC");
        _getGame.Setup(u => u.ExecuteAsync(_playerId, game.Id))
            .ReturnsAsync(new GetGameResult(game, null));

        // Act
        var result = await NewController().Get(game.Id);

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<GameResponse>(ok.Value);
        Assert.Equal(game.Id, response.GameId);
        Assert.Equal("white", response.Colour);
    }

    // Join
    // The old "WhenNotFound" and "WhenInvalidCode" are the same case: an unknown code is InvalidCode.

    [Fact]
    public async Task Join_WhenInvalidCode_Returns404()
    {
        // Arrange
        _joinGame.Setup(u => u.ExecuteAsync(_playerId, "NOPE"))
            .ReturnsAsync(new JoinGameResult(null, JoinError.InvalidCode));

        // Act
        var result = await NewController().Join(new JoinGameRequest("NOPE"));

        // Assert
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Equal("invalid_code", ErrorCodeOf(notFound));
    }

    [Fact]
    public async Task Join_WhenNotJoinable_ReturnsConflictResponse()
    {
        // Arrange
        _joinGame.Setup(u => u.ExecuteAsync(_playerId, "ABC"))
            .ReturnsAsync(new JoinGameResult(null, JoinError.NotJoinable));

        // Act
        var result = await NewController().Join(new JoinGameRequest("ABC"));

        // Assert
        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal("not_joinable", ErrorCodeOf(conflict));
    }

    [Fact]
    public async Task Join_WhenGameFull_ReturnsConflictResponse()
    {
        // Arrange
        _joinGame.Setup(u => u.ExecuteAsync(_playerId, "ABC"))
            .ReturnsAsync(new JoinGameResult(null, JoinError.GameFull));

        // Act
        var result = await NewController().Join(new JoinGameRequest("ABC"));

        // Assert
        var conflict = Assert.IsType<ConflictObjectResult>(result);
        Assert.Equal("game_full", ErrorCodeOf(conflict));
    }

    [Fact]
    public async Task Join_WhenMatchingCode_JoinsGame()
    {
        // Arrange
        var game = new Game(Guid.NewGuid(), PieceColour.White, "ABC");
        game.BlackClientId = _playerId;
        _joinGame.Setup(u => u.ExecuteAsync(_playerId, "ABC"))
            .ReturnsAsync(new JoinGameResult(game, null));

        // Act
        var result = await NewController().Join(new JoinGameRequest("ABC"));

        // Assert
        var ok = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<GameResponse>(ok.Value);
        Assert.Equal(game.Id, response.GameId);
        Assert.Equal("black", response.Colour);
    }

    [Fact]
    public async Task Join_WhenCodeMissing_PassesEmptyCodeToUseCase()
    {
        // Arrange
        _joinGame.Setup(u => u.ExecuteAsync(_playerId, ""))
            .ReturnsAsync(new JoinGameResult(null, JoinError.InvalidCode));

        // Act
        var result = await NewController().Join(new JoinGameRequest(null));

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
        _joinGame.Verify(u => u.ExecuteAsync(_playerId, ""), Times.Once);
    }
}
