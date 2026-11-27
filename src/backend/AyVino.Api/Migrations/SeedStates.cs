using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20260809002)]
public class M20260809002_SeedStates : Migration
{
    public override void Up()
    {
        Insert.IntoTable("states").Row(new { name = "Buenos Aires" });
        Insert.IntoTable("states").Row(new { name = "Catamarca" });
        Insert.IntoTable("states").Row(new { name = "Chaco" });
        Insert.IntoTable("states").Row(new { name = "Chubut" });
        Insert.IntoTable("states").Row(new { name = "Córdoba" });
        Insert.IntoTable("states").Row(new { name = "Corrientes" });
        Insert.IntoTable("states").Row(new { name = "Entre Ríos" });
        Insert.IntoTable("states").Row(new { name = "Formosa" });
        Insert.IntoTable("states").Row(new { name = "Jujuy" });
        Insert.IntoTable("states").Row(new { name = "La Pampa" });
        Insert.IntoTable("states").Row(new { name = "La Rioja" });
        Insert.IntoTable("states").Row(new { name = "Mendoza" });
        Insert.IntoTable("states").Row(new { name = "Misiones" });
        Insert.IntoTable("states").Row(new { name = "Neuquén" });
        Insert.IntoTable("states").Row(new { name = "Río Negro" });
        Insert.IntoTable("states").Row(new { name = "Salta" });
        Insert.IntoTable("states").Row(new { name = "San Juan" });
        Insert.IntoTable("states").Row(new { name = "San Luis" });
        Insert.IntoTable("states").Row(new { name = "Santa Cruz" });
        Insert.IntoTable("states").Row(new { name = "Santa Fe" });
        Insert.IntoTable("states").Row(new { name = "Santiago del Estero" });
        Insert.IntoTable("states").Row(new { name = "Tierra del Fuego, Antártida e Islas del Atlántico Sur" });
        Insert.IntoTable("states").Row(new { name = "Tucumán" });
        Insert.IntoTable("states").Row(new { name = "Ciudad Autónoma de Buenos Aires" });
    }

    public override void Down()
    {
        Delete.FromTable("states").AllRows();
    }
}