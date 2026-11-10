using Dapper;

namespace AyVino.Api.Common.Data;

public static class DapperConfiguration
{
    public static void Configure()
    {
        DefaultTypeMap.MatchNamesWithUnderscores = true;
        SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
    }
}
