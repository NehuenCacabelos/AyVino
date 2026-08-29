using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260829002)]
public class M20260829002_CreateLocationsTable : Migration
{
    public override void Up()
    {
        Create.Table("Locations")
            .WithColumn("Id").AsInt32().PrimaryKey().Identity().NotNullable()
            .WithColumn("Country").AsString(100).NotNullable()
            .WithColumn("Province").AsString(100).Nullable()
            .WithColumn("City").AsString(100).Nullable();
    }

    public override void Down()
    {
        Delete.Table("Locations");
    }
}