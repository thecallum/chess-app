using ChessApp.Api.Session;
using Microsoft.AspNetCore.Mvc;

namespace ChessApp.Api.Controllers;

[ApiController]
[Route("api/session")]
public sealed class SessionController : ControllerBase
{
    // Issues the guest cookie if there isn't one. Never replaces an existing one.
    [HttpPost]
    public IActionResult Create()
    {
        GuestSession.EnsureIssued(HttpContext);
        return NoContent();
    }
}
