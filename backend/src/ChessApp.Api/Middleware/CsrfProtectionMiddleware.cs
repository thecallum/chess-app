namespace ChessApp.Api.Middleware;

// Cross-site protection: browsers can't add a custom header cross-site without
// a CORS preflight, which we never allow. The hub has its own handshake.
public sealed class CsrfProtectionMiddleware
{
    public const string HeaderName = "X-CSRF";
    public const string HeaderValue = "1";

    private readonly RequestDelegate _next;

    public CsrfProtectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (RequiresHeader(context.Request.Path) && !HasHeader(context.Request))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return;
        }

        await _next(context);
    }

    private static bool RequiresHeader(PathString path) =>
        path.StartsWithSegments("/api") && !path.StartsWithSegments("/api/hubs");

    private static bool HasHeader(HttpRequest request) =>
        request.Headers.TryGetValue(HeaderName, out var value) && value == HeaderValue;
}

public static class CsrfProtectionMiddlewareExtensions
{
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder app) =>
        app.UseMiddleware<CsrfProtectionMiddleware>();
}
