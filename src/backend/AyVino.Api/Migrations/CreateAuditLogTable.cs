using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261027001)]
public class M20261027001_CreateAuditLogTable : Migration
{
    public override void Up()
    {
        Create.Table("audit_log")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("user_id").AsInt32().Nullable()
            .WithColumn("username").AsString(100).NotNullable()
            .WithColumn("action").AsInt16().NotNullable()
            .WithColumn("entity_type").AsString(50).NotNullable()
            .WithColumn("entity_id").AsInt32().Nullable()
            .WithColumn("details").AsString(int.MaxValue).Nullable()
            .WithColumn("created_at").AsCustom("timestamptz").NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.ForeignKey("fk_audit_log_user_id")
            .FromTable("audit_log").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.SetNull);

        Create.Index("ix_audit_log_created_at")
            .OnTable("audit_log")
            .OnColumn("created_at").Descending();

        Create.Index("ix_audit_log_entity")
            .OnTable("audit_log")
            .OnColumn("entity_type").Ascending()
            .OnColumn("entity_id").Ascending();

        Create.Index("ix_audit_log_user_id")
            .OnTable("audit_log")
            .OnColumn("user_id").Ascending();
    }

    public override void Down()
    {
        Delete.Table("audit_log");
    }
}
