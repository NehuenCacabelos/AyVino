using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261114001)]
public class M20261114001_AlterReviewRatingsAndRatingSumsToNumeric : Migration
{
    public override void Up()
    {
        // 1. reviews.rating: pasa de smallint a numeric(2,1)
        Execute.Sql("ALTER TABLE reviews DROP CONSTRAINT IF EXISTS ck_reviews_rating_range;");
        Execute.Sql("ALTER TABLE reviews ALTER COLUMN rating TYPE numeric(2,1) USING rating::numeric(2,1);");
        Execute.Sql("ALTER TABLE reviews ADD CONSTRAINT ck_reviews_rating_range CHECK (rating >= 1.0 AND rating <= 5.0);");

        // 2. wines.rating_sum y wine_vintages.rating_sum pasan a numeric(12,1)
        Execute.Sql("ALTER TABLE wines ALTER COLUMN rating_sum TYPE numeric(12,1) USING rating_sum::numeric(12,1);");
        Execute.Sql("ALTER TABLE wines ALTER COLUMN rating_sum SET DEFAULT 0.0;");

        Execute.Sql("ALTER TABLE wine_vintages ALTER COLUMN rating_sum TYPE numeric(12,1) USING rating_sum::numeric(12,1);");
        Execute.Sql("ALTER TABLE wine_vintages ALTER COLUMN rating_sum SET DEFAULT 0.0;");
    }

    public override void Down()
    {
        // 1. Revertir wine_vintages.rating_sum y wines.rating_sum a integer con redondeo explícito.
        // AVISO: Se pierde la precisión decimal acumulada en rating_sum al volver a integer.
        Execute.Sql("ALTER TABLE wine_vintages ALTER COLUMN rating_sum TYPE integer USING ROUND(rating_sum)::integer;");
        Execute.Sql("ALTER TABLE wine_vintages ALTER COLUMN rating_sum SET DEFAULT 0;");

        Execute.Sql("ALTER TABLE wines ALTER COLUMN rating_sum TYPE integer USING ROUND(rating_sum)::integer;");
        Execute.Sql("ALTER TABLE wines ALTER COLUMN rating_sum SET DEFAULT 0;");

        // 2. Revertir reviews.rating a smallint con redondeo explícito.
        // AVISO: Se pierde la precisión decimal de las calificaciones (ej. 4.3 se convierte en 4).
        Execute.Sql("ALTER TABLE reviews DROP CONSTRAINT IF EXISTS ck_reviews_rating_range;");
        Execute.Sql("ALTER TABLE reviews ALTER COLUMN rating TYPE smallint USING ROUND(rating)::smallint;");
        Execute.Sql("ALTER TABLE reviews ADD CONSTRAINT ck_reviews_rating_range CHECK (rating >= 1 AND rating <= 5);");
    }
}
