using Npgsql;

var connStr = Environment.GetEnvironmentVariable("E2E_DB_CONNECTION");

if (string.IsNullOrWhiteSpace(connStr))
{
    Console.Error.WriteLine("Error: La variable de entorno E2E_DB_CONNECTION no está definida o está vacía.");
    Environment.Exit(1);
    return;
}

if (args.Length == 0 || string.IsNullOrWhiteSpace(args[0]))
{
    Console.Error.WriteLine("Error: Debe proveer una sentencia SQL válida como argumento.");
    Environment.Exit(1);
    return;
}

var sql = string.Join(" ", args);

try
{
    await using var dataSource = NpgsqlDataSource.Create(connStr);
    await using var cmd = dataSource.CreateCommand(sql);

    if (sql.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
    {
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            for (int i = 0; i < reader.FieldCount; i++)
            {
                Console.Write($"{reader.GetName(i)}={reader.GetValue(i)} | ");
            }
            Console.WriteLine();
        }
    }
    else
    {
        var rows = await cmd.ExecuteNonQueryAsync();
        Console.WriteLine($"Rows affected: {rows}");
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine($"SQL Error: {ex.Message}");
    Environment.Exit(1);
}
