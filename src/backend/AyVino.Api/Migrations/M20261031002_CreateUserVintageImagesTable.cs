using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261031002)]
public class M20261031002_CreateUserVintageImagesTable : Migration
{
    public override void Up()
    {
        Create.Table("user_vintage_images")
            .WithColumn("user_id").AsInt32().NotNullable()
            .WithColumn("wine_vintage_id").AsInt32().NotNullable()
            .WithColumn("image_id").AsGuid().NotNullable()
            .WithColumn("created_at").AsDateTime().NotNullable().WithDefault(SystemMethods.CurrentUTCDateTime);

        Create.PrimaryKey("PK_UserVintageImages")
            .OnTable("user_vintage_images").Columns("user_id", "wine_vintage_id");

        Create.ForeignKey("FK_UserVintageImages_Users")
            .FromTable("user_vintage_images").ForeignColumn("user_id")
            .ToTable("users").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_UserVintageImages_WineVintages")
            .FromTable("user_vintage_images").ForeignColumn("wine_vintage_id")
            .ToTable("wine_vintages").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.ForeignKey("FK_UserVintageImages_Images")
            .FromTable("user_vintage_images").ForeignColumn("image_id")
            .ToTable("images").PrimaryColumn("id")
            .OnDelete(Rule.Cascade);

        Create.Index("IX_UserVintageImages_ImageId")
            .OnTable("user_vintage_images").OnColumn("image_id");
    }

    public override void Down()
    {
        Delete.Table("user_vintage_images");
    }
}
