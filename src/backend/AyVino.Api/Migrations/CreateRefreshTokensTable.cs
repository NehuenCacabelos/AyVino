using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260830001)]
public class M20260830001_CreateRefreshTokensTable : Migration
{
    public override void Up()
    {
        Create.Table("refresh_tokens")
            .WithColumn("token").AsString(500).PrimaryKey().NotNullable()
            .WithColumn("user_id").AsInt32().NotNullable()
            .WithColumn("expires_at").AsDateTime().NotNullable()
            .WithColumn("created_at").AsDateTime().NotNullable()
            .WithColumn("created_by_ip").AsString(100).Nullable()
            .WithColumn("revoked_at").AsDateTime().Nullable()
            .WithColumn("revoked_by_ip").AsString(100).Nullable()
            .WithColumn("replaced_by_token").AsString(500).Nullable();

        Create.ForeignKey("fk_refresh_tokens_users")
            .FromTable("refresh_tokens").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.Index("ix_refresh_tokens_user_id")
            .OnTable("refresh_tokens")
            .OnColumn("user_id").Ascending();
    }

    public override void Down()
    {
        Delete.ForeignKey("fk_refresh_tokens_users").OnTable("refresh_tokens");
        Delete.Index("ix_refresh_tokens_user_id").OnTable("refresh_tokens");
        Delete.Table("refresh_tokens");
    }
}
