namespace AyVino.Api.Features.Users.Models;

public record User
{
    public int Id { get; init; }
    public string NombreUsuario { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Rol { get; init; } = "Usuario";
    public DateTime FechaRegistro { get; init; } = DateTime.UtcNow;
    public bool Activo { get; init; } = true;
    public string? FotoPerfil { get; init; }
    public string? Bio { get; init; }
}
