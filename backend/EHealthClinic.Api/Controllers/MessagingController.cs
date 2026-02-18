using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/messages")]
[Authorize]
public sealed class MessagingController : ControllerBase
{
    private readonly IMessagingService _messaging;
    private readonly IAuditService _audit;

    public MessagingController(IMessagingService messaging, IAuditService audit)
    {
        _messaging = messaging;
        _audit = audit;
    }

    [HttpGet("inbox")]
    [Authorize(Policy = "messages.read")]
    public async Task<IActionResult> GetInbox([FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var result = await _messaging.GetInboxAsync(userId, limit);
        return Ok(result);
    }

    [HttpGet("sent")]
    [Authorize(Policy = "messages.read")]
    public async Task<IActionResult> GetSent([FromQuery] int limit = 50)
    {
        var userId = GetUserId();
        var result = await _messaging.GetSentAsync(userId, limit);
        return Ok(result);
    }

    [HttpGet("thread/{threadId:guid}")]
    [Authorize(Policy = "messages.read")]
    public async Task<IActionResult> GetThread(Guid threadId)
    {
        var result = await _messaging.GetThreadAsync(threadId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = "messages.write")]
    public async Task<IActionResult> Send([FromBody] SendMessageRequest request)
    {
        request = request with { SenderId = GetUserId() };
        var result = await _messaging.SendAsync(request);
        return Ok(result);
    }

    [HttpPatch("{messageId}/read")]
    [Authorize(Policy = "messages.read")]
    public async Task<IActionResult> MarkAsRead(string messageId)
    {
        var userId = GetUserId();
        var ok = await _messaging.MarkAsReadAsync(messageId, userId);
        return ok ? NoContent() : NotFound();
    }

    [HttpGet("unread-count")]
    [Authorize(Policy = "messages.read")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _messaging.GetUnreadCountAsync(userId);
        return Ok(new { count });
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
