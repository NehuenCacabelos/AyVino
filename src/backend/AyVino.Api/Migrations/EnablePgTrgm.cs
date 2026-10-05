using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261005002)]
public class M20261005002_EnablePgTrgm : Migration
{
    public override void Up()
    {
        Execute.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

        // Índices GIN para que la búsqueda por similitud no haga full scan cuando crezca la tabla.
        Execute.Sql("CREATE INDEX ix_wines_name_trgm ON wines USING gin (name gin_trgm_ops);");
        Execute.Sql("CREATE INDEX ix_wines_winery_name_text_trgm ON wines USING gin (winery_name_text gin_trgm_ops);");
        Execute.Sql("CREATE INDEX ix_wineries_name_trgm ON wineries USING gin (name gin_trgm_ops);");
    }

    public override void Down()
    {
        Execute.Sql("DROP INDEX IF EXISTS ix_wineries_name_trgm;");
        Execute.Sql("DROP INDEX IF EXISTS ix_wines_winery_name_text_trgm;");
        Execute.Sql("DROP INDEX IF EXISTS ix_wines_name_trgm;");
        Execute.Sql("DROP EXTENSION IF EXISTS pg_trgm;");
    }
}