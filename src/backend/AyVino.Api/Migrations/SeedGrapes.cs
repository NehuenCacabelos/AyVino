using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261022004)]
public class SeedGrapes : Migration
{
    private static readonly (string Name, short ColorType)[] Grapes =
    [
        ("Malbec", 1),
        ("Cabernet Sauvignon", 1),
        ("Cabernet Franc", 1),
        ("Merlot", 1),
        ("Syrah", 1),
        ("Bonarda", 1),
        ("Pinot Noir", 1),
        ("Tannat", 1),
        ("Petit Verdot", 1),
        ("Tempranillo", 1),
        ("Sangiovese", 1),
        ("Criolla Grande", 3),
        ("Cereza", 3),
        ("Pinot Gris", 2),
        ("Chardonnay", 2),
        ("Sauvignon Blanc", 2),
        ("Torrontés Riojano", 2),
        ("Torrontés Sanjuanino", 2),
        ("Torrontés Mendocino", 2),
        ("Semillón", 2),
        ("Chenin Blanc", 2),
        ("Viognier", 2),
        ("Pedro Giménez", 2),
        ("Moscatel de Alejandría", 2),
        ("Moscatel Rosado", 3),
        ("Riesling", 2),
        ("Gewürztraminer", 2),
        ("Garnacha", 1),
        ("Barbera", 1),
        ("Pinot Meunier", 1),
        ("Marselan", 1),
        ("Touriga Nacional", 1),
        ("Ancellotta", 1),
        ("Verdejo", 2),
        ("Albariño", 2)
    ];

    public override void Up()
    {
        foreach (var (name, colorType) in Grapes)
        {
            var escapedName = name.Replace("'", "''");
            Execute.Sql($"""
                INSERT INTO grapes (name, color_type)
                SELECT '{escapedName}', {colorType}
                WHERE NOT EXISTS (
                    SELECT 1 FROM grapes WHERE LOWER(name) = LOWER('{escapedName}')
                );
                """);
        }
    }

    public override void Down()
    {
        // En rollback no eliminamos uvas para no violar constraints de wine_grapes.
    }
}
