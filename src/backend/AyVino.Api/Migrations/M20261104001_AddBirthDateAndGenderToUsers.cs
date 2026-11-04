using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261104001)]
public class M20261104001_AddBirthDateAndGenderToUsers : Migration
{
    public override void Up()
    {
        Alter.Table("users")
            .AddColumn("birth_date").AsDate().Nullable()
            .AddColumn("gender").AsInt16().Nullable();
    }

    public override void Down()
    {
        Delete.Column("gender").FromTable("users");
        Delete.Column("birth_date").FromTable("users");
    }
}
