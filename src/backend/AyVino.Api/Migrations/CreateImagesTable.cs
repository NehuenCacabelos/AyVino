using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261029001)]
public class M20261029001_CreateImagesTable : Migration
{
    public override void Up()
    {
        Create.Table("images")
            .WithColumn("id").AsGuid().PrimaryKey().NotNullable()
            .WithColumn("provider").AsString().NotNullable()
            .WithColumn("external_id").AsString().NotNullable()
            .WithColumn("mime_type").AsString().NotNullable()
            .WithColumn("size_bytes").AsInt64().NotNullable()
            .WithColumn("width").AsInt32().Nullable()
            .WithColumn("height").AsInt32().Nullable()
            .WithColumn("created_at").AsCustom("timestamptz").NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.Index("ix_images_provider_external_id")
            .OnTable("images")
            .OnColumn("provider").Ascending()
            .OnColumn("external_id").Ascending()
            .WithOptions().Unique();
    }

    public override void Down()
    {
        Delete.Index("ix_images_provider_external_id").OnTable("images");
        Delete.Table("images");
    }
}
