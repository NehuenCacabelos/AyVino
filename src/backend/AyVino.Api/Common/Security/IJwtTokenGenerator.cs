using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Common.Security;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}

