using System.Data;
using AyVino.Api.Features.Wines.Enums;
using AyVino.Api.Features.Wines.Utils;
using Dapper;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261031001)]
public class M20261031001_AddLabelKeyToWines : Migration
{
    public override void Up()
    {
        Alter.Table("wines")
            .AddColumn("label_key").AsString(300).Nullable();

        Create.Index("IX_Wines_LabelKey")
            .OnTable("wines")
            .OnColumn("label_key")
            .Ascending();

        Execute.WithConnection((connection, transaction) =>
        {
            const string query = """
                SELECT w.id, w.name, w.wine_type, w.winery_id, w.winery_name_text, win.name AS registered_winery_name
                FROM wines w
                LEFT JOIN wineries win ON w.winery_id = win.id;
                """;

            var rows = connection.Query(query, transaction: transaction);
            const string updateSql = "UPDATE wines SET label_key = @LabelKey WHERE id = @Id;";

            foreach (var row in rows)
            {
                int id = (int)row.id;
                string name = (string)(row.name ?? string.Empty);
                int wineType = (int)row.wine_type;
                int? wineryId = (int?)row.winery_id;
                string? wineryNameText = (string?)row.winery_name_text;
                string? registeredWineryName = (string?)row.registered_winery_name;

                var key = WineLabelNormalizer.BuildLabelKey(
                    name,
                    registeredWineryName,
                    wineryNameText,
                    wineryId,
                    (WineType)wineType);

                connection.Execute(updateSql, new { LabelKey = key, Id = id }, transaction: transaction);
            }
        });
    }

    public override void Down()
    {
        Delete.Index("IX_Wines_LabelKey").OnTable("wines");
        Delete.Column("label_key").FromTable("wines");
    }
}
