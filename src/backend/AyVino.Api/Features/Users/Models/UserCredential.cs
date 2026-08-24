namespace AyVino.Api.Features.Users.Models;

public record UserCredential
{
    public int UsuarioId { get; init; }
    public string PasswordHash { get; init; } = string.Empty;
    public DateTime UltimoCambioPassword { get; init; } = DateTime.UtcNow;
    public int IntentosFallidos { get; init; } = 0;
    public DateTime? BloqueadoHasta { get; init; }
}

