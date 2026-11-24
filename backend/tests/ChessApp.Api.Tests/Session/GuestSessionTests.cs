using ChessApp.Api.Session;
using Microsoft.AspNetCore.Http;
using Microsoft.Net.Http.Headers;

namespace ChessApp.Api.Tests.Session;

public class GuestSessionTests
{
    private static DefaultHttpContext ContextWithCookie(string? value, bool https = false)
    {
        var context = new DefaultHttpContext();
        if (value is not null) context.Request.Headers.Cookie = $"{GuestSession.CookieName}={value}";
        context.Request.IsHttps = https;
        return context;
    }

    private static SetCookieHeaderValue IssuedCookie(HttpContext context) =>
        SetCookieHeaderValue.Parse(context.Response.Headers.SetCookie.Single());

    // Read

    [Fact]
    public void Read_WithNoCookie_ReturnsNull()
    {
        // Arrange
        var context = ContextWithCookie(null);

        // Act
        var result = GuestSession.Read(context);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public void Read_WithValidGuid_ReturnsIt()
    {
        // Arrange
        var id = Guid.NewGuid();
        var context = ContextWithCookie(id.ToString());

        // Act
        var result = GuestSession.Read(context);

        // Assert
        Assert.Equal(id, result);
    }

    [Theory]
    [InlineData("")]
    [InlineData("abc")]
    [InlineData("12345")]
    public void Read_WithMalformedValue_ReturnsNull(string value)
    {
        // Arrange
        var context = ContextWithCookie(value);

        // Act
        var result = GuestSession.Read(context);

        // Assert
        Assert.Null(result);
    }

    // EnsureIssued

    [Fact]
    public void EnsureIssued_WithNoCookie_IssuesNewCookieMatchingReturnedId()
    {
        // Arrange
        var context = ContextWithCookie(null);

        // Act
        var id = GuestSession.EnsureIssued(context);

        // Assert
        Assert.NotEqual(Guid.Empty, id);
        var cookie = IssuedCookie(context);
        Assert.Equal(GuestSession.CookieName, cookie.Name.Value);
        Assert.Equal(id, Guid.Parse(cookie.Value.Value!));
    }

    [Fact]
    public void EnsureIssued_SetsExpectedCookieAttributes()
    {
        // Arrange
        var context = ContextWithCookie(null);

        // Act
        GuestSession.EnsureIssued(context);

        // Assert
        var cookie = IssuedCookie(context);
        Assert.True(cookie.HttpOnly);
        Assert.Equal(Microsoft.Net.Http.Headers.SameSiteMode.Lax, cookie.SameSite);
        var untilExpiry = cookie.Expires!.Value - DateTimeOffset.UtcNow;
        Assert.InRange(untilExpiry.TotalDays, 364, 366);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public void EnsureIssued_SetsSecureOnlyOverHttps(bool https)
    {
        // Arrange
        var context = ContextWithCookie(null, https);

        // Act
        GuestSession.EnsureIssued(context);

        // Assert
        Assert.Equal(https, IssuedCookie(context).Secure);
    }

    [Fact]
    public void EnsureIssued_WithExistingCookie_ReturnsSameIdAndSetsNothing()
    {
        // Arrange
        var existing = Guid.NewGuid();
        var context = ContextWithCookie(existing.ToString());

        // Act
        var id = GuestSession.EnsureIssued(context);

        // Assert
        Assert.Equal(existing, id);
        Assert.Equal(0, context.Response.Headers.SetCookie.Count);
    }

    [Fact]
    public void EnsureIssued_WithMalformedCookie_IssuesFreshCookie()
    {
        // Arrange
        var context = ContextWithCookie("not-a-guid");

        // Act
        var id = GuestSession.EnsureIssued(context);

        // Assert
        Assert.Equal(id, Guid.Parse(IssuedCookie(context).Value.Value!));
    }

    [Fact]
    public void EnsureIssued_CalledTwiceOnSeparateRequests_YieldsDifferentIds()
    {
        // Arrange
        var firstContext = ContextWithCookie(null);
        var secondContext = ContextWithCookie(null);

        // Act
        var first = GuestSession.EnsureIssued(firstContext);
        var second = GuestSession.EnsureIssued(secondContext);

        // Assert
        Assert.NotEqual(first, second);
    }
}
