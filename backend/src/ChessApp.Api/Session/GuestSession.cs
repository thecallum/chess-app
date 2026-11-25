namespace ChessApp.Api.Session;

// Guest identity: a random GUID in an HttpOnly cookie, issued by its own request.
public static class GuestSession
{
    public const string CookieName = "guest_id";

    public static Guid? Read(HttpContext context) =>
        Guid.TryParse(context.Request.Cookies[CookieName], out var id) ? id : null;

    // TODO: review the cookie config before deploying:
    public static Guid EnsureIssued(HttpContext context)
    {
        if (Read(context) is { } existing) return existing;

        var id = Guid.NewGuid();
        context.Response.Cookies.Append(CookieName, id.ToString(), new CookieOptions
        {
            HttpOnly = true,
            SameSite = SameSiteMode.Lax,
            Secure = context.Request.IsHttps,
            Expires = DateTimeOffset.UtcNow.AddYears(1),
            IsEssential = true,
        });
        return id;
    }
}
