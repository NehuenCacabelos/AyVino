using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261030002)]
public class SeedPairings : Migration
{
    public static readonly (string Name, short Category)[] Pairings =
    [
        // Carnes (13) - Meat = 1
        ("Asado de tira a las brasas", 1),
        ("Bife de chorizo", 1),
        ("Ojo de bife a la leña", 1),
        ("Mollejas y achuras crocantes", 1),
        ("Choripán tradicional", 1),
        ("Matrimonio (chorizo y morcilla)", 1),
        ("Cordero patagónico al asador", 1),
        ("Bondiola y cortes de cerdo a la brasa", 1),
        ("Locro criollo tradicional", 1),
        ("Puchero de bodegón", 1),
        ("Pastel de papas tradicional", 1),
        ("Empanadas de carne a cuchillo", 1),
        ("Milanesa frita tradicional", 1),

        // Pescados (4) - Fish = 2
        ("Salmón rosado y trucha patagónica", 2),
        ("Pescado de río a la parrilla (Surubí / Pacú)", 2),
        ("Merluza negra patagónica", 2),
        ("Sushi y cocina nikkei", 2),

        // Mariscos (1) - Seafood = 3
        ("Paella y arroces con mariscos", 3),

        // Pastas (2) - Pasta = 6
        ("Fideos con tuco y estofado", 6),
        ("Pastas rellenas con hongos y cordero", 6),

        // Vegetariano (1) - Vegetarian = 7
        ("Risotto de hongos y setas silvestres", 7),

        // Quesos (1) - Cheese = 4
        ("Tabla de quesos maduros y duros (Sobremesa)", 4),

        // Otros (2) - Other = 9
        ("Guiso de lentejas de olla", 9),
        ("Pizza porteña al molde de muzzarella", 9)
    ];

    public override void Up()
    {
        foreach (var (name, category) in Pairings)
        {
            var escapedName = name.Replace("'", "''");
            Execute.Sql($"""
                INSERT INTO pairings (name, category)
                SELECT '{escapedName}', {category}
                WHERE NOT EXISTS (
                    SELECT 1 FROM pairings WHERE LOWER(name) = LOWER('{escapedName}')
                );
                """);
        }
    }

    public override void Down()
    {
        // En rollback no eliminamos maridajes para preservar integridad de wine_pairings.
    }
}
