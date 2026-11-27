using FluentMigrator;

namespace AyVino.Api.Migrations;

[Migration(20261030001)]
public class M20261030001_EnsureUsersPhotoAndBioColumns : Migration
{
    public override void Up()
    {
        Execute.Sql("""
            DO $$
            BEGIN
                -- Garantiza la existencia de la columna photo en la tabla users
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'photo'
                ) THEN
                    ALTER TABLE users ADD COLUMN photo VARCHAR(100) NULL;
                END IF;

                -- Garantiza la existencia de la columna bio en la tabla users
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' AND column_name = 'bio'
                ) THEN
                    ALTER TABLE users ADD COLUMN bio VARCHAR(1000) NULL;
                END IF;
            END $$;
            """);
    }

    public override void Down()
    {
        Execute.Sql("ALTER TABLE users DROP COLUMN IF EXISTS photo;");
        Execute.Sql("ALTER TABLE users DROP COLUMN IF EXISTS bio;");
    }
}

