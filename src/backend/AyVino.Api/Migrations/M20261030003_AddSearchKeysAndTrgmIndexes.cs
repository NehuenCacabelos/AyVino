using AyVino.Api.Features.Wines;
using Dapper;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261030003)]
public class M20261030003_AddSearchKeysAndTrgmIndexes : Migration
{
    public override void Up()
    {
        Alter.Table("wines")
            .AddColumn("name_key").AsString().Nullable();

        Alter.Table("wines")
            .AddColumn("winery_text_key").AsString().Nullable();

        Alter.Table("wineries")
            .AddColumn("name_key").AsString().Nullable();

        Execute.WithConnection((connection, transaction) =>
        {
            var wineries = connection.Query<(int Id, string Name)>(
                "SELECT id AS Id, name AS Name FROM wineries;",
                transaction: transaction);

            const string updateWinerySql = """
                UPDATE wineries
                SET name_key = @NameKey
                WHERE id = @Id;
                """;

            foreach (var winery in wineries)
            {
                var key = WineLabelNormalizer.ToSearchKey(winery.Name);
                connection.Execute(updateWinerySql, new { Id = winery.Id, NameKey = key }, transaction: transaction);
            }

            var wines = connection.Query<(int Id, string Name, string? WineryNameText)>(
                "SELECT id AS Id, name AS Name, winery_name_text AS WineryNameText FROM wines;",
                transaction: transaction);

            const string updateWineSql = """
                UPDATE wines
                SET name_key = @NameKey,
                    winery_text_key = @WineryTextKey
                WHERE id = @Id;
                """;

            foreach (var wine in wines)
            {
                var (nameKey, wineryTextKey) = WineLabelNormalizer.ComputeWineKeys(wine.Name, wine.WineryNameText);
                connection.Execute(updateWineSql, new { Id = wine.Id, NameKey = nameKey, WineryTextKey = wineryTextKey }, transaction: transaction);
            }
        });

        Execute.Sql("CREATE INDEX IF NOT EXISTS ix_wines_name_key_trgm ON wines USING gin (name_key gin_trgm_ops);");
        Execute.Sql("CREATE INDEX IF NOT EXISTS ix_wines_winery_text_key_trgm ON wines USING gin (winery_text_key gin_trgm_ops);");
        Execute.Sql("CREATE INDEX IF NOT EXISTS ix_wineries_name_key_trgm ON wineries USING gin (name_key gin_trgm_ops);");
    }

    public override void Down()
    {
        Execute.Sql("DROP INDEX IF EXISTS ix_wineries_name_key_trgm;");
        Execute.Sql("DROP INDEX IF EXISTS ix_wines_winery_text_key_trgm;");
        Execute.Sql("DROP INDEX IF EXISTS ix_wines_name_key_trgm;");

        Delete.Column("name_key").FromTable("wineries");
        Delete.Column("winery_text_key").FromTable("wines");
        Delete.Column("name_key").FromTable("wines");
    }
}
