using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261022001)]
public class M20261022001_AddGeorefIdToStatesAndCities : Migration
{
    private static readonly (string Code, string Name)[] Provinces =
    [
        ("02", "Ciudad Autónoma de Buenos Aires"),
        ("06", "Buenos Aires"),
        ("10", "Catamarca"),
        ("14", "Córdoba"),
        ("18", "Corrientes"),
        ("22", "Chaco"),
        ("26", "Chubut"),
        ("30", "Entre Ríos"),
        ("34", "Formosa"),
        ("38", "Jujuy"),
        ("42", "La Pampa"),
        ("46", "La Rioja"),
        ("50", "Mendoza"),
        ("54", "Misiones"),
        ("58", "Neuquén"),
        ("62", "Río Negro"),
        ("66", "Salta"),
        ("70", "San Juan"),
        ("74", "San Luis"),
        ("78", "Santa Cruz"),
        ("82", "Santa Fe"),
        ("86", "Santiago del Estero"),
        ("90", "Tucumán"),
        ("94", "Tierra del Fuego, Antártida e Islas del Atlántico Sur")
    ];

    public override void Up()
    {
        Alter.Table("states")
            .AddColumn("georef_id").AsString(10).Nullable();

        foreach (var (code, name) in Provinces)
        {
            Update.Table("states")
                .Set(new { georef_id = code })
                .Where(new { name });
        }

        Create.Index("IX_States_GeorefId")
            .OnTable("states")
            .OnColumn("georef_id")
            .Ascending()
            .WithOptions().Unique();

        Alter.Table("cities")
            .AddColumn("georef_id").AsString(10).Nullable();

        Create.Index("IX_Cities_GeorefId")
            .OnTable("cities")
            .OnColumn("georef_id")
            .Ascending()
            .WithOptions().Unique();
    }

    public override void Down()
    {
        Delete.Index("IX_Cities_GeorefId").OnTable("cities");
        Delete.Column("georef_id").FromTable("cities");

        Delete.Index("IX_States_GeorefId").OnTable("states");
        Delete.Column("georef_id").FromTable("states");
    }
}
