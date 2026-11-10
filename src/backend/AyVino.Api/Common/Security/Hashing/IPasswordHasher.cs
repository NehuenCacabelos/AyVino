namespace AyVino.Api.Common.Security.Hashing;

public interface IPasswordHasher
{
    string DummyHash { get; }
    string HashPassword(string password);
    bool VerifyPassword(string password, string passwordHash);
}

