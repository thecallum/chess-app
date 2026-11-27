namespace ChessApp.Api.UseCases.Interfaces;

public interface ISendMoveUseCase
{
    Task<SendMoveResult> ExecuteAsync(Guid playerId, Guid gameId, string move);
}
