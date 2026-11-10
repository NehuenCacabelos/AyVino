using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260929001)]
public class M20260929001_CreateReviewsTable : Migration
{
    public override void Up()
    {
        Create.Table("reviews")
            .WithColumn("id").AsInt32().PrimaryKey().Identity()
            .WithColumn("user_id").AsInt32().NotNullable().ForeignKey("users", "id")
            .WithColumn("wine_vintage_id").AsInt32().NotNullable().ForeignKey("wine_vintages", "id")
            .WithColumn("rating").AsInt16().NotNullable()
            .WithColumn("comment").AsString(1000).Nullable()
            .WithColumn("created_at").AsDateTime().NotNullable()
            .WithColumn("updated_at").AsDateTime().Nullable();

        Create.UniqueConstraint("uq_reviews_user_wine_vintage")
            .OnTable("reviews")
            .Columns("user_id", "wine_vintage_id");

        Execute.Sql("ALTER TABLE reviews ADD CONSTRAINT ck_reviews_rating_range CHECK (rating >= 1 AND rating <= 5);");
    }

    public override void Down()
    {
        Delete.Table("reviews");
    }
}