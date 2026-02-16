using EHealthClinic.Api.Helpers;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;

    public NotificationsController(INotificationService notifications)
    {
        _notifications = notifications;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] int limit = 50)
    {
        var userId = User.GetUserId();
        var items = await _notifications.GetForUserAsync(userId, Math.Clamp(limit, 1, 200));
        return Ok(items);
    }

    [HttpPatch("{id}/read")]
    public async Task<ActionResult> MarkRead(string id)
    {
        await _notifications.MarkReadAsync(id);
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<ActionResult> MarkAllRead()
    {
        var userId = User.GetUserId();
        await _notifications.MarkAllReadAsync(userId);
        return NoContent();
    }
}
