using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EHealthClinic.Api.Hubs;

/// <summary>
/// SignalR hub for real-time notifications. Clients receive "ReceiveNotification" when a new notification is created.
/// User is identified by JWT (NameIdentifier = UserId) so we can send to specific users.
/// </summary>
[Authorize]
public sealed class NotificationsHub : Hub
{
    // Server pushes via IHubContext from NotificationService; no client-invoked methods required.
}
