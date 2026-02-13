using EHealthClinic.Api.Dtos;
using EHealthClinic.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EHealthClinic.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth)
    {
        _auth = auth;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req)
    {
        try
        {
            var result = await _auth.RegisterAsync(req);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req)
    {
        try
        {
            var result = await _auth.LoginAsync(req);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh([FromBody] RefreshRequest req)
    {
        try
        {
            var result = await _auth.RefreshAsync(req.RefreshToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { error = ex.Message });
        }
    }

    [HttpPost("revoke")]
    public async Task<ActionResult> Revoke([FromBody] RefreshRequest req)
    {
        await _auth.RevokeAsync(req.RefreshToken);
        return NoContent();
    }
}
