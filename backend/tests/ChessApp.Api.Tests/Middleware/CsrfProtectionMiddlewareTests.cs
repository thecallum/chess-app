using ChessApp.Api.Middleware;
using Microsoft.AspNetCore.Http;

namespace ChessApp.Api.Tests.Middleware;

public class CsrfProtectionMiddlewareTests
{
    private bool _nextCalled;

    private CsrfProtectionMiddleware NewMiddleware() => new(_ =>
    {
        _nextCalled = true;
        return Task.CompletedTask;
    });

    private static DefaultHttpContext NewContext(string path, string? headerValue = null)
    {
        var context = new DefaultHttpContext();
        context.Request.Path = path;
        if (headerValue is not null) context.Request.Headers[CsrfProtectionMiddleware.HeaderName] = headerValue;
        return context;
    }

    [Fact]
    public async Task Invoke_WhenApiRequestHasHeader_CallsNext()
    {
        // Arrange
        var context = NewContext("/api/games", "1");

        // Act
        await NewMiddleware().InvokeAsync(context);

        // Assert
        Assert.True(_nextCalled);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }

    [Fact]
    public async Task Invoke_WhenApiRequestHasNoHeader_Returns400()
    {
        // Arrange
        var context = NewContext("/api/games");

        // Act
        await NewMiddleware().InvokeAsync(context);

        // Assert
        Assert.False(_nextCalled);
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    [Fact]
    public async Task Invoke_WhenApiRequestHasWrongHeaderValue_Returns400()
    {
        // Arrange
        var context = NewContext("/api/games", "0");

        // Act
        await NewMiddleware().InvokeAsync(context);

        // Assert
        Assert.False(_nextCalled);
        Assert.Equal(StatusCodes.Status400BadRequest, context.Response.StatusCode);
    }

    [Theory]
    [InlineData("/api/hubs/game")]
    [InlineData("/")]
    [InlineData("/health")]
    public async Task Invoke_WhenPathDoesNotNeedHeader_CallsNext(string path)
    {
        // Arrange
        var context = NewContext(path);

        // Act
        await NewMiddleware().InvokeAsync(context);

        // Assert
        Assert.True(_nextCalled);
        Assert.Equal(StatusCodes.Status200OK, context.Response.StatusCode);
    }
}
