using System.Security.Claims;
using System.Text.Encodings.Web;
using ChessApp.Api.Session;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace ChessApp.Api.Auth;

public static class GuestAuthentication
{
    public const string Scheme = "Guest";

    // The signed-in guest's id. Only valid on requests that passed [Authorize].
    public static Guid PlayerId(this ClaimsPrincipal user) =>
        Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
}

// Turns the guest_id cookie into a ClaimsPrincipal. No cookie, or a malformed one,
// means no result, so [Authorize] answers 401.
public sealed class GuestAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public GuestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (GuestSession.Read(Context) is not { } playerId)
            return Task.FromResult(AuthenticateResult.NoResult());

        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, playerId.ToString())],
            GuestAuthentication.Scheme);
        var ticket = new AuthenticationTicket(new ClaimsPrincipal(identity), GuestAuthentication.Scheme);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
