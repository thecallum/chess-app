using System.Net;
using ChessApp.Api.Session;
using ChessApp.Api.Tests.Gateways;

namespace ChessApp.Api.Tests.Api;

[Collection(PostgresCollection.Name)]
public class SessionApiTests : ApiTestBase
{
    public SessionApiTests(PostgresFixture postgres) : base(postgres)
    {
    }

    [Fact]
    public async Task CreateSession_IssuesGuestCookie()
    {
        // Arrange
        var client = Factory.NewClient();

        // Act
        var response = await client.PostAsync("/api/session", content: null);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var cookies = response.Headers.GetValues("Set-Cookie");
        Assert.Contains(cookies, c => c.StartsWith($"{GuestSession.CookieName}="));
    }

    [Fact]
    public async Task CreateSession_WhenAlreadySignedIn_KeepsExistingCookie()
    {
        // Arrange
        var client = await Factory.NewPlayerAsync();

        // Act
        var response = await client.PostAsync("/api/session", content: null);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.False(response.Headers.Contains("Set-Cookie"));
    }

    [Fact]
    public async Task CreateSession_WithoutCsrfHeader_Returns400()
    {
        // Arrange
        var client = Factory.CreateClient();

        // Act
        var response = await client.PostAsync("/api/session", content: null);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
