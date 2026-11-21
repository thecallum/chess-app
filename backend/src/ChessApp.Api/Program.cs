using ChessApp.Api.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();

var app = builder.Build();

// Under /api so the frontend host can route to the backend.
app.MapHub<GameHub>("/api/hubs/game");

app.Run();
