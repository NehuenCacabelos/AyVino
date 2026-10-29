namespace AyVino.Api.Features.Wines.Enums;

public enum WineType
{
    Red = 1,
    White = 2,
    Rose = 3,
    Sparkling = 4,
    Orange = 5
}

public enum ApprovalStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

// Community: lo subió un usuario común (foto de botella), sin bodega vinculada todavía.
// Official: la bodega dueña ya está registrada y vinculada via WineryId (por carga propia
// o porque un admin/bodega "reclamó" el vino con /claim-wines).
public enum SourceType
{
    Community = 1,
    Official = 2
}