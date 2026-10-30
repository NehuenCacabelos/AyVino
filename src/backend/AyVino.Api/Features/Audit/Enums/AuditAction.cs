namespace AyVino.Api.Features.Audit.Enums;

public enum AuditAction : short
{
    WineryStatusChanged = 1,
    WineryDeleted = 2,
    CityStatusChanged = 3,
    VintageStatusChanged = 4,
    VintageDeleted = 5,
    UserStatusChanged = 6,
    UserDeleted = 7,
    UserRoleChanged = 8,
    GrapeCreated = 9,
    GrapeUpdated = 10,
    GrapeDeleted = 11,
    PairingCreated = 12,
    PairingUpdated = 13,
    PairingDeleted = 14,
    WineUpdatedByAdmin = 15,
    WineDeleted = 16,
    ReviewDeletedByAdmin = 17,
    WineMerged = 18
}
