using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829002)]
public class M20260829002_CreateLocationsTable : Migration
{
    public override void Up()
    {
        Create.Table("locations")
            .WithColumn("id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("country").AsString(100).NotNullable()
            .WithColumn("state").AsString(100).Nullable()
            .WithColumn("city").AsString(100).Nullable();
    }

    public override void Down()
    {
        Delete.Table("locations");
    }
}