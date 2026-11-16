using FluentMigrator;

namespace AyVino.Api.Migrations;

public record GrapeSensorySeedItem(string Name, short TypicalBody, short TypicalTannins, short TypicalAcidity);

[Migration(20261114004)]
public class SeedGrapeSensoryValues : Migration
{
    public static readonly IReadOnlyList<GrapeSensorySeedItem> GrapeValues =
    [
        // Tintas (17)
        new("Malbec", 40, 40, 30),
        new("Cabernet Sauvignon", 50, 50, 40),
        new("Cabernet Franc", 30, 30, 40),
        new("Merlot", 40, 30, 30),
        new("Syrah", 40, 40, 30),
        new("Bonarda", 30, 20, 30),
        new("Pinot Noir", 20, 20, 40),
        new("Tannat", 50, 50, 40),
        new("Petit Verdot", 50, 50, 40),
        new("Tempranillo", 40, 40, 30),
        new("Sangiovese", 30, 40, 50),
        new("Garnacha", 40, 20, 30),
        new("Barbera", 30, 20, 50),
        new("Pinot Meunier", 20, 20, 40),
        new("Marselan", 40, 40, 30),
        new("Touriga Nacional", 40, 40, 40),
        new("Ancellotta", 30, 30, 40),

        // De piel rosada (3)
        new("Criolla Grande", 10, 10, 20),
        new("Cereza", 10, 10, 20),
        new("Moscatel Rosado", 20, 10, 30),

        // Blancas (15)
        new("Pinot Gris", 30, 10, 30),
        new("Chardonnay", 40, 10, 30),
        new("Sauvignon Blanc", 20, 10, 50),
        new("Torrontés Riojano", 30, 10, 20),
        new("Torrontés Sanjuanino", 20, 10, 20),
        new("Torrontés Mendocino", 20, 10, 20),
        new("Semillón", 40, 10, 30),
        new("Chenin Blanc", 30, 10, 50),
        new("Viognier", 40, 10, 20),
        new("Pedro Giménez", 20, 10, 20),
        new("Moscatel de Alejandría", 20, 10, 20),
        new("Riesling", 20, 10, 50),
        new("Gewürztraminer", 40, 10, 20),
        new("Verdejo", 30, 10, 40),
        new("Albariño", 20, 10, 50)
    ];

    public override void Up()
    {
        foreach (var item in GrapeValues)
        {
            var escapedName = item.Name.Replace("'", "''");
            Execute.Sql($"""
                UPDATE grapes
                SET typical_body = COALESCE(typical_body, {item.TypicalBody}),
                    typical_tannins = COALESCE(typical_tannins, {item.TypicalTannins}),
                    typical_acidity = COALESCE(typical_acidity, {item.TypicalAcidity})
                WHERE LOWER(name) = LOWER('{escapedName}');
                """);
        }
    }

    public override void Down()
    {
        // Down no borra nada según especificación.
    }
}
