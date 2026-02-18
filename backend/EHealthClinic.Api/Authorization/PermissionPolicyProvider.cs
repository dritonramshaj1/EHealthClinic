using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace EHealthClinic.Api.Authorization;

/// <summary>
/// Dynamically creates authorization policies from permission strings.
/// Allows using [Authorize(Policy = "patients.read")] on any controller
/// without pre-registering each policy in Program.cs.
/// </summary>
public sealed class PermissionPolicyProvider : IAuthorizationPolicyProvider
{
    private readonly AuthorizationOptions _options;

    public PermissionPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _options = options.Value;
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
        => Task.FromResult(_options.DefaultPolicy);

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
        => Task.FromResult(_options.FallbackPolicy);

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        // Check if a manually registered policy exists first
        var existingPolicy = _options.GetPolicy(policyName);
        if (existingPolicy is not null)
            return Task.FromResult<AuthorizationPolicy?>(existingPolicy);

        // Treat every unknown policy name as a permission string
        // e.g. [Authorize(Policy = "patients.read")] creates a policy on-the-fly
        var policy = new AuthorizationPolicyBuilder()
            .AddRequirements(new PermissionRequirement(policyName))
            .Build();

        return Task.FromResult<AuthorizationPolicy?>(policy);
    }
}
