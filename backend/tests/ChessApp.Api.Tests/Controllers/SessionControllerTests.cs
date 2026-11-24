using ChessApp.Api.Controllers;
using ChessApp.Api.Session;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ChessApp.Api.Tests.Controllers;

public class SessionControllerTests
{
    private static (SessionController Controller, DefaultHttpContext Context) NewController(string? existingCookie = null)
    {
        var context = new DefaultHttpContext();
        if (existingCookie is not null)
            context.Request.Headers.Cookie = $"{GuestSession.CookieName}={existingCookie}";

        var controller = new SessionController
        {
            ControllerContext = new ControllerContext { HttpContext = context },
        };
        return (controller, context);
    }

    [Fact]
    public void Create_WhenNoCookie_IssuesGuestCookieAndReturnsNoContent()
    {
        // Arrange
        var (controller, context) = NewController();

        // Act
        var result = controller.Create();

        // Assert
        Assert.IsType<NoContentResult>(result);
        var setCookie = context.Response.Headers.SetCookie.ToString();
        Assert.StartsWith($"{GuestSession.CookieName}=", setCookie);
        Assert.Contains("httponly", setCookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Create_WhenNoCookie_IssuesAGuidAsTheGuestId()
    {
        // Arrange
        var (controller, context) = NewController();

        // Act
        controller.Create();

        // Assert
        var setCookie = context.Response.Headers.SetCookie.ToString();
        var value = setCookie[(GuestSession.CookieName.Length + 1)..].Split(';')[0];
        Assert.True(Guid.TryParse(value, out _));
    }

    [Fact]
    public void Create_WhenCookieAlreadyExists_DoesNotReplaceIt()
    {
        // Arrange
        var (controller, context) = NewController(existingCookie: Guid.NewGuid().ToString());

        // Act
        var result = controller.Create();

        // Assert
        Assert.IsType<NoContentResult>(result);
        Assert.False(context.Response.Headers.ContainsKey("Set-Cookie"));
    }

    [Fact]
    public void Create_WhenCookieIsMalformed_IssuesNewCookie()
    {
        // Arrange
        var (controller, context) = NewController(existingCookie: "not-a-guid");

        // Act
        controller.Create();

        // Assert
        Assert.StartsWith($"{GuestSession.CookieName}=", context.Response.Headers.SetCookie.ToString());
    }
}
