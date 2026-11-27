using System.Collections;
using System.Data;
using System.Data.Common;
using System.Diagnostics.CodeAnalysis;
using AyVino.Api.Features.Wines.Repositories;
using Dapper;

namespace AyVino.UnitTests;

public class WineSearchParametersTests
{
    [Fact]
    public void BuildCatalogSearchParameters_WithNullOptionalFilters_SetsExplicitDbTypeOnAllParameters()
    {
        var parameters = WineRepository.BuildCatalogSearchParameters(
            search: null,
            name: null,
            winery: null,
            year: null,
            wineType: null,
            currentUserId: null,
            isAdmin: false,
            grapeId: null,
            stateId: null,
            wineryId: null,
            origin: null,
            out _);

        Assert.NotNull(parameters);

        var recordedCommands = new List<RecordingDbCommand>();
        using var connection = new RecordingDbConnection(recordedCommands);
        const string sql = """
            SELECT @SearchKey, @SearchKeyPrefix, @SearchKeyPattern, @Threshold,
                   @Name, @NamePattern, @Winery, @WineryPattern,
                   @WineType, @Year, @GrapeId, @StateId, @WineryId, @SourceType,
                   @CurrentUserId, @IsAdmin, @HasSearchTerm, @HasOtherSearchTerms
            """;
        _ = connection.Query<int>(sql, parameters).ToList();

        var command = Assert.Single(recordedCommands);

        AssertParameterDbType(command, "SearchKey", DbType.String);
        AssertParameterDbType(command, "SearchKeyPrefix", DbType.String);
        AssertParameterDbType(command, "SearchKeyPattern", DbType.String);
        AssertParameterDbType(command, "Threshold", DbType.Double);
        AssertParameterDbType(command, "Name", DbType.String);
        AssertParameterDbType(command, "NamePattern", DbType.String);
        AssertParameterDbType(command, "Winery", DbType.String);
        AssertParameterDbType(command, "WineryPattern", DbType.String);
        AssertParameterDbType(command, "WineType", DbType.Int32);
        AssertParameterDbType(command, "Year", DbType.Int32);
        AssertParameterDbType(command, "GrapeId", DbType.Int32);
        AssertParameterDbType(command, "StateId", DbType.Int32);
        AssertParameterDbType(command, "WineryId", DbType.Int32);
        AssertParameterDbType(command, "SourceType", DbType.Int32);
        AssertParameterDbType(command, "CurrentUserId", DbType.Int32);
        AssertParameterDbType(command, "IsAdmin", DbType.Boolean);
        AssertParameterDbType(command, "HasSearchTerm", DbType.Boolean);
        AssertParameterDbType(command, "HasOtherSearchTerms", DbType.Boolean);
    }

    private static void AssertParameterDbType(RecordingDbCommand command, string name, DbType expectedDbType)
    {
        var parameter = command.RecordedParameters.SingleOrDefault(
            p => string.Equals(p.ParameterName.TrimStart('@'), name, StringComparison.Ordinal));
        Assert.True(
            parameter is not null,
            $"No se encontró '{name}'. Parámetros registrados: [{string.Join(", ", command.RecordedParameters.Select(p => $"{p.ParameterName}:{p.DbType}"))}]");
        Assert.Equal(expectedDbType, parameter.DbType);
    }

    private sealed class RecordingDbConnection(List<RecordingDbCommand> recordedCommands) : DbConnection
    {
        private string _connectionString = string.Empty;

        [AllowNull]
        public override string ConnectionString
        {
            get => _connectionString;
            set => _connectionString = value ?? string.Empty;
        }

        public override string Database => "test";
        public override string DataSource => "test";
        public override string ServerVersion => "17.0";
        public override ConnectionState State => ConnectionState.Open;

        public override void ChangeDatabase(string databaseName) { }
        public override void Close() { }
        public override void Open() { }

        protected override DbTransaction BeginDbTransaction(IsolationLevel isolationLevel) =>
            throw new NotSupportedException();

        protected override DbCommand CreateDbCommand()
        {
            var command = new RecordingDbCommand();
            recordedCommands.Add(command);
            return command;
        }
    }

    private sealed class RecordingDbCommand : DbCommand
    {
        private readonly RecordingParameterCollection _parameters = new();

        public IReadOnlyList<RecordingDbParameter> RecordedParameters => _parameters.RecordedItems;

        [AllowNull]
        public override string CommandText { get; set; } = string.Empty;
        public override int CommandTimeout { get; set; }
        public override CommandType CommandType { get; set; }
        public override bool DesignTimeVisible { get; set; }
        public override UpdateRowSource UpdatedRowSource { get; set; }
        protected override DbConnection? DbConnection { get; set; }
        protected override DbParameterCollection DbParameterCollection => _parameters;
        protected override DbTransaction? DbTransaction { get; set; }

        public override void Cancel() { }
        public override int ExecuteNonQuery() => 0;
        public override object? ExecuteScalar() => null;
        public override void Prepare() { }

        protected override DbParameter CreateDbParameter() => new RecordingDbParameter();

        protected override DbDataReader ExecuteDbDataReader(CommandBehavior behavior) =>
            new EmptyDbDataReader();
    }

    private sealed class RecordingParameterCollection : DbParameterCollection
    {
        public List<RecordingDbParameter> Items { get; } = [];
        public List<RecordingDbParameter> RecordedItems { get; } = [];

        public override int Count => Items.Count;
        public override object SyncRoot => ((ICollection)Items).SyncRoot;

        public override int Add(object value)
        {
            var parameter = (RecordingDbParameter)value;
            Items.Add(parameter);
            RecordedItems.Add(parameter);
            return Items.Count - 1;
        }

        public override void AddRange(Array values)
        {
            foreach (var value in values)
            {
                if (value is not null)
                {
                    Add(value);
                }
            }
        }

        public override void Clear() => Items.Clear();
        public override bool Contains(object value) => Items.Contains((RecordingDbParameter)value);
        public override bool Contains(string value) => Items.Any(p => p.ParameterName == value);
        public override void CopyTo(Array array, int index) => ((ICollection)Items).CopyTo(array, index);
        public override IEnumerator GetEnumerator() => Items.GetEnumerator();
        public override int IndexOf(object value) => Items.IndexOf((RecordingDbParameter)value);
        public override int IndexOf(string parameterName) => Items.FindIndex(p => p.ParameterName == parameterName);
        public override void Insert(int index, object value) => Items.Insert(index, (RecordingDbParameter)value);
        public override void Remove(object value) => Items.Remove((RecordingDbParameter)value);
        public override void RemoveAt(int index) => Items.RemoveAt(index);
        public override void RemoveAt(string parameterName) => Items.RemoveAll(p => p.ParameterName == parameterName);

        protected override DbParameter GetParameter(int index) => Items[index];
        protected override DbParameter GetParameter(string parameterName) => Items.Single(p => p.ParameterName == parameterName);
        protected override void SetParameter(int index, DbParameter value) => Items[index] = (RecordingDbParameter)value;
        protected override void SetParameter(string parameterName, DbParameter value)
        {
            var idx = IndexOf(parameterName);
            if (idx >= 0) Items[idx] = (RecordingDbParameter)value;
        }
    }

    private sealed class RecordingDbParameter : DbParameter
    {
        public override DbType DbType { get; set; } = DbType.Object;
        public override ParameterDirection Direction { get; set; }
        public override bool IsNullable { get; set; }
        [AllowNull]
        public override string ParameterName { get; set; } = string.Empty;
        public override int Size { get; set; }
        [AllowNull]
        public override string SourceColumn { get; set; } = string.Empty;
        public override bool SourceColumnNullMapping { get; set; }
        public override object? Value { get; set; }

        public override void ResetDbType() => DbType = DbType.Object;
    }

    private sealed class EmptyDbDataReader : DbDataReader
    {
        public override int FieldCount => 0;
        public override int RecordsAffected => 0;
        public override bool HasRows => false;
        public override bool IsClosed => false;
        public override int Depth => 0;

        public override object this[int ordinal] => throw new IndexOutOfRangeException();
        public override object this[string name] => throw new IndexOutOfRangeException();

        public override bool GetBoolean(int ordinal) => throw new NotSupportedException();
        public override byte GetByte(int ordinal) => throw new NotSupportedException();
        public override long GetBytes(int ordinal, long dataOffset, byte[]? buffer, int bufferOffset, int length) => throw new NotSupportedException();
        public override char GetChar(int ordinal) => throw new NotSupportedException();
        public override long GetChars(int ordinal, long dataOffset, char[]? buffer, int bufferOffset, int length) => throw new NotSupportedException();
        public override string GetDataTypeName(int ordinal) => throw new NotSupportedException();
        public override DateTime GetDateTime(int ordinal) => throw new NotSupportedException();
        public override decimal GetDecimal(int ordinal) => throw new NotSupportedException();
        public override double GetDouble(int ordinal) => throw new NotSupportedException();
        public override Type GetFieldType(int ordinal) => throw new NotSupportedException();
        public override float GetFloat(int ordinal) => throw new NotSupportedException();
        public override Guid GetGuid(int ordinal) => throw new NotSupportedException();
        public override short GetInt16(int ordinal) => throw new NotSupportedException();
        public override int GetInt32(int ordinal) => throw new NotSupportedException();
        public override long GetInt64(int ordinal) => throw new NotSupportedException();
        public override string GetName(int ordinal) => throw new NotSupportedException();
        public override int GetOrdinal(string name) => throw new NotSupportedException();
        public override string GetString(int ordinal) => throw new NotSupportedException();
        public override object GetValue(int ordinal) => throw new NotSupportedException();
        public override int GetValues(object[] values) => 0;
        public override bool IsDBNull(int ordinal) => true;
        public override bool NextResult() => false;
        public override bool Read() => false;
        public override IEnumerator GetEnumerator() => Array.Empty<object>().GetEnumerator();
    }
}
