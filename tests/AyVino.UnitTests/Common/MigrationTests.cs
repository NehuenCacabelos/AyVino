using System.Reflection;
using AyVino.Api.Migrations;
using FluentMigrator;
using FluentMigrator.Expressions;
using FluentMigrator.Infrastructure;
using Microsoft.Extensions.DependencyInjection;

namespace AyVino.UnitTests.Common;

public class MigrationTests
{
    [Fact]
    public void Migrations_HaveUniqueAscendingVersions()
    {
        var assembly = typeof(M20260809001_CreateStatesTable).Assembly;
        var migrations = assembly.GetTypes()
            .Where(t => typeof(IMigration).IsAssignableFrom(t) && !t.IsAbstract)
            .Select(t => t.GetCustomAttribute<MigrationAttribute>())
            .Where(a => a != null)
            .Select(a => a!.Version)
            .ToList();

        Assert.NotEmpty(migrations);
        Assert.Equal(migrations.Count, migrations.Distinct().Count());
        Assert.True(migrations.All(v => v > 0));
    }

    [Fact]
    public void Migrations_DownExpressions_DeleteForeignKeyMustSpecifyForeignTable()
    {
        var assembly = typeof(M20260809001_CreateStatesTable).Assembly;
        var migrationTypes = assembly.GetTypes()
            .Where(t => typeof(IMigration).IsAssignableFrom(t) && !t.IsAbstract && t.GetCustomAttribute<MigrationAttribute>() != null)
            .ToList();

        var serviceProvider = new ServiceCollection().BuildServiceProvider();

        foreach (var type in migrationTypes)
        {
            var migration = (IMigration)Activator.CreateInstance(type)!;
            var context = new MigrationContext(null!, serviceProvider, null);
            migration.GetDownExpressions(context);

            foreach (var expr in context.Expressions)
            {
                if (expr is DeleteForeignKeyExpression fk)
                {
                    Assert.False(
                        string.IsNullOrWhiteSpace(fk.ForeignKey.ForeignTable),
                        $"La migración {type.Name} tiene un DeleteForeignKey con tabla foránea vacía.");
                }
            }
        }
    }
}
