using System.Text.Json.Serialization;
using ChessApp.Api.Gateways;
using ChessApp.Api.Hubs;
using ChessApp.Api.UseCases;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSignalR();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IGameGateway, InMemoryGameGateway>();
builder.Services.AddScoped<CreateGame>();
builder.Services.AddScoped<JoinGame>();
builder.Services.AddScoped<GetGame>();

var app = builder.Build();

// Cross-site protection: browsers can't add a custom header cross-site without
// a CORS preflight, which we never allow. The hub has its own handshake.
app.Use(async (context, next) =>
{
    var path = context.Request.Path;
    if (path.StartsWithSegments("/api") && !path.StartsWithSegments("/api/hubs")
        && !context.Request.Headers.ContainsKey("X-Requested-With"))
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }
    await next();
});

app.MapControllers();

// Under /api so the frontend host can route to the backend.
app.MapHub<GameHub>("/api/hubs/game");

app.Run();
