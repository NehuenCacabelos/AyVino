using AyVino.Api.Features.Users.Models;

namespace AyVino.Api.Common.Security.Jwt;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user);
}

