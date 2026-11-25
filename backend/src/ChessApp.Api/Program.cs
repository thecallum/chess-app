using System.Text.Json.Serialization;
using ChessApp.Api.Auth;
using ChessApp.Api.Gateways;
using ChessApp.Api.Gateways.Interfaces;
using ChessApp.Api.Hubs;
using ChessApp.Api.Middleware;
using ChessApp.Api.UseCases;
using ChessApp.Api.UseCases.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSignalR();

builder.Services.AddAuthentication(GuestAuthentication.Scheme)
    .AddScheme<AuthenticationSchemeOptions, GuestAuthenticationHandler>(GuestAuthentication.Scheme, null);
builder.Services.AddAuthorization();

builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddDbContext<ChessDbContext>((services, options) =>
    options.UseNpgsql(services.GetRequiredService<IConfiguration>().GetConnectionString("Default")
        ?? throw new InvalidOperationException("Missing connection string ConnectionStrings:Default.")));
builder.Services.AddScoped<IGamesGateway, GamesGateway>();
builder.Services.AddHostedService<DatabaseMigrator>();
builder.Services.AddScoped<ICreateGameUseCase, CreateGameUseCase>();
builder.Services.AddScoped<IJoinGameUseCase, JoinGameUseCase>();
builder.Services.AddScoped<IGetGameUseCase, GetGameUseCase>();

var app = builder.Build();

app.UseCsrfProtection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Under /api so the frontend host can route to the backend.
app.MapHub<GameHub>("/api/hubs/game");

app.Run();

// Lets the API tests start the app in-process.
public partial class Program;
