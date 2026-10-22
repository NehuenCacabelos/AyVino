using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Dapper;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261022002)]
public class M20261022002_SeedDepartmentsAndLocations : Migration
{
    private sealed record DepartmentSeed(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("nombre")] string Nombre,
        [property: JsonPropertyName("provincia_id")] string ProvinciaId);

    public override void Up()
    {
        Execute.WithConnection((connection, transaction) =>
        {
            var stateMap = connection.Query<(int Id, string GeorefId)>(
                "SELECT id AS Id, georef_id AS GeorefId FROM states WHERE georef_id IS NOT NULL;",
                transaction: transaction)
                .ToDictionary(s => s.GeorefId, s => s.Id);

            var departments = LoadDepartments();

            const string insertCitySql = """
                INSERT INTO cities (name, state_id, status, georef_id)
                VALUES (@Name, @StateId, 1, @GeorefId)
                RETURNING id;
                """;

            const string insertLocationSql = """
                INSERT INTO locations (city_id)
                VALUES (@CityId);
                """;

            foreach (var dept in departments)
            {
                if (!stateMap.TryGetValue(dept.ProvinciaId, out var stateId))
                {
                    continue;
                }

                var cityId = connection.ExecuteScalar<int>(
                    insertCitySql,
                    new { Name = dept.Nombre, StateId = stateId, GeorefId = dept.Id },
                    transaction: transaction);

                connection.Execute(
                    insertLocationSql,
                    new { CityId = cityId },
                    transaction: transaction);
            }
        });
    }

    public override void Down()
    {
        Execute.Sql("""
            DELETE FROM locations WHERE city_id IN (SELECT id FROM cities WHERE georef_id IS NOT NULL);
            DELETE FROM cities WHERE georef_id IS NOT NULL;
            """);
    }

    private static List<DepartmentSeed> LoadDepartments()
    {
        var assembly = Assembly.GetExecutingAssembly();
        const string resourceName = "AyVino.Api.Features.Locations.Data.departamentos_georef.json";

        using var stream = assembly.GetManifestResourceStream(resourceName);
        if (stream != null)
        {
            using var reader = new StreamReader(stream);
            var json = reader.ReadToEnd();
            return JsonSerializer.Deserialize<List<DepartmentSeed>>(json) ?? [];
        }

        // Fallback al sistema de archivos local en caso de ejecución no empaquetada
        var fallbackPath = Path.Combine(AppContext.BaseDirectory, "Features", "Locations", "Data", "departamentos_georef.json");
        if (File.Exists(fallbackPath))
        {
            var json = File.ReadAllText(fallbackPath);
            return JsonSerializer.Deserialize<List<DepartmentSeed>>(json) ?? [];
        }

        throw new FileNotFoundException($"No se encontró el recurso embebido ni el archivo de departamentos: {resourceName}");
    }
}
