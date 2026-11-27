using System.Data;
using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261114003)]
public class M20261114003_RenameTastingsToUncorks : Migration
{
    public override void Up()
    {
        // 1. Eliminar check constraint de rating en tastings
        Execute.Sql("ALTER TABLE tastings DROP CONSTRAINT IF EXISTS ck_tastings_rating_range;");

        // 2. Eliminar columnas rating y comment de tastings (la reseña es la única fuente de puntaje y comentario)
        Delete.Column("rating").FromTable("tastings");
        Delete.Column("comment").FromTable("tastings");

        // 3. Renombrar columna tasted_at -> uncorked_at
        Rename.Column("tasted_at").OnTable("tastings").To("uncorked_at");

        // 4. Renombrar índice de usuario y fecha
        Execute.Sql("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_tastings_user_id_tasted_at') THEN
                    ALTER INDEX ix_tastings_user_id_tasted_at RENAME TO ix_uncorks_user_id_uncorked_at;
                ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_tastings_user_tasted_at') THEN
                    ALTER INDEX ix_tastings_user_tasted_at RENAME TO ix_uncorks_user_uncorked_at;
                END IF;
            END $$;
            """);

        // 5. Renombrar tabla tastings -> uncorks
        Rename.Table("tastings").To("uncorks");
    }

    public override void Down()
    {
        // 1. Renombrar tabla uncorks -> tastings
        Rename.Table("uncorks").To("tastings");

        // 2. Renombrar índice de vuelta
        Execute.Sql("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_uncorks_user_id_uncorked_at') THEN
                    ALTER INDEX ix_uncorks_user_id_uncorked_at RENAME TO ix_tastings_user_id_tasted_at;
                ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'ix_uncorks_user_uncorked_at') THEN
                    ALTER INDEX ix_uncorks_user_uncorked_at RENAME TO ix_tastings_user_tasted_at;
                END IF;
            END $$;
            """);

        // 3. Renombrar columna uncorked_at -> tasted_at
        Rename.Column("uncorked_at").OnTable("tastings").To("tasted_at");

        // 4. Re-agregar columnas rating y comment como nulables sin defaults
        Alter.Table("tastings")
            .AddColumn("rating").AsCustom("numeric(2,1)").Nullable()
            .AddColumn("comment").AsString(1000).Nullable();

        // 5. Re-agregar check constraint
        Execute.Sql("ALTER TABLE tastings ADD CONSTRAINT ck_tastings_rating_range CHECK (rating IS NULL OR (rating >= 1.0 AND rating <= 5.0));");
    }
}
