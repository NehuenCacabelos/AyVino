using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829001)]
public class M20260829001_CreateUsersTable : Migration
{
    public override void Up()
    {
        // Tabla Usuarios
        Create.Table("users")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("username").AsString(100).NotNullable()
            .WithColumn("email").AsString(100).NotNullable().Unique()
            .WithColumn("role").AsString(100).NotNullable()
            .WithColumn("register_date").AsDateTime().NotNullable()
            .WithColumn("is_active").AsBoolean().NotNullable()
            .WithColumn("photo").AsString(100).Nullable()
            .WithColumn("bio").AsString(1000).Nullable();

        // Índice explícito para búsquedas rápidas por Email
        Create.Index("ix_users_email")
            .OnTable("users")
            .OnColumn("email").Ascending();

        // Tabla Credenciales (Relación 1 a 1 con Usuarios)
        Create.Table("user_credentials")
            .WithColumn("user_id").AsInt32().PrimaryKey().NotNullable()
            .WithColumn("password_hash").AsString(500).NotNullable()
            .WithColumn("last_password_change").AsDateTime().NotNullable()
            .WithColumn("failed_login_attempts").AsInt32().NotNullable()
            .WithColumn("blocked_until").AsDateTime().Nullable();

        // Clave Foránea con eliminación en cascada
        Create.ForeignKey("fk_user_credentials_users")
            .FromTable("user_credentials").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);
    }

    public override void Down()
    {
        Delete.ForeignKey("fk_user_credentials_users").OnTable("user_credentials");
        Delete.Table("user_credentials");


        Delete.Index("ix_users_email").OnTable("users");
        Delete.Table("users");
    }
}