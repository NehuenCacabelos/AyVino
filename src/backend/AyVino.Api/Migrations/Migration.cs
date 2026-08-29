using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829001)]
public class M20260829001_CreateUsersTable : Migration
{
    public override void Up()
    {
        // Tabla Usuarios
        Create.Table("Users")
            .WithColumn("Id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("Username").AsString(100).NotNullable()
            .WithColumn("Email").AsString(100).NotNullable()
            .WithColumn("Role").AsString(100).NotNullable()
            .WithColumn("RegisterDate").AsDateTime().NotNullable()
            .WithColumn("IsActive").AsBoolean().NotNullable()
            .WithColumn("Photo").AsString(100).Nullable()
            .WithColumn("Bio").AsString(1000).Nullable();

        // Índice explícito para búsquedas rápidas por Email
        Create.Index("IX_Users_Email")
            .OnTable("Users")
            .OnColumn("Email").Ascending();

        // Tabla Credenciales (Relación 1 a 1 con Usuarios)
        Create.Table("UserCredentials")
            .WithColumn("UserId").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("PasswordHash").AsString(100).NotNullable()
            .WithColumn("LastPasswordChange").AsDateTime().NotNullable()
            .WithColumn("FailedLoginAttempts").AsInt32().NotNullable()
            .WithColumn("BlockedUntil").AsDateTime().Nullable();

        // Clave Foránea con eliminación en cascada
        Create.ForeignKey("FK_UserCredentials_Users")
            .FromTable("UserCredentials").ForeignColumn("UserId")
            .ToTable("Users").PrimaryColumn("Id")
            .OnDelete(Rule.Cascade);
    }

    public override void Down()
    {
        Delete.ForeignKey("FK_UserCredentials_Users");
        Delete.Table("UserCredentials");

        Delete.Index("IX_Users_Email").OnTable("Users");
        Delete.Table("Users");
    }
}