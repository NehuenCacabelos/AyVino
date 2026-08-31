using System.IdentityModel.Tokens.Jwt;
using System.Text;
using AyVino.Api.Common.Data;
using AyVino.Api.Common.Middleware;
using AyVino.Api.Common.Constants;
using AyVino.Api.Common.Security.Hashing;
using AyVino.Api.Common.Security.Jwt;
using AyVino.Api.Features.Auth.Endpoints;
using AyVino.Api.Features.Auth.Services;
using AyVino.Api.Features.Auth.Repositories;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
using AyVino.Api.Features.Users.Endpoints;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Wineries.Endpoints;
using AyVino.Api.Features.Wineries.Repositories;
using AyVino.Api.Features.Wineries.Services;
using AyVino.Api.Features.Locations.Endpoints;
using AyVino.Api.Features.Locations.Repositories;
using AyVino.Api.Features.Locations.Services;
using AyVino.Api.Features.Grapes.Endpoints;
using AyVino.Api.Features.Grapes.Repositories;
using AyVino.Api.Features.Grapes.Services;
using FluentMigrator.Runner;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Scalar.AspNetCore;

// 1. Configuraciones iniciales de serialización / mapeo
JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;




var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Rate Limiting configuration
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("AuthLimit", context =>
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: ipAddress,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 15,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

// Exception Handling & RFC 7807 ProblemDetails
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Authentication & JWT Bearer
var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]
    ?? throw new InvalidOperationException("Configuración JWT 'SecretKey' no encontrada.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("Configuración JWT 'Issuer' no encontrada.");
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("Configuración JWT 'Audience' no encontrada.");

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection(JwtSettings.SectionName));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization(options => {
    // Policy para usuarios Administradores
    options.AddPolicy(AppPolicies.RequireAdmin, policy => 
        policy.RequireRole(AppRoles.Admin));
    // Policy para usuarios Comunes
    options.AddPolicy(AppPolicies.RequireUser, policy => 
        policy.RequireRole(AppRoles.User));
    // Policy para usuarios Bodegas
    options.AddPolicy(AppPolicies.RequireWinery, policy => 
        policy.RequireRole(AppRoles.Winery));
});


// Infrastructure & Security Services (Singletons)
builder.Services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

// Features: Repositories & Services (Scoped)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHostedService<TokenCleanupBackgroundService>();
builder.Services.AddScoped<IWineryRepository, WineryRepository>();
builder.Services.AddScoped<IWineryService, WineryService>();
builder.Services.AddScoped<ILocationRepository, LocationRepository>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IGrapeRepository, GrapeRepository>();
builder.Services.AddScoped<IGrapeService, GrapeService>();

// FluentMigrator configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");

builder.Services.AddFluentMigratorCore()
    .ConfigureRunner(rb => rb
        .AddPostgres()
        .WithGlobalConnectionString(connectionString)
        .ScanIn(typeof(Program).Assembly).For.Migrations())
    .AddLogging(lb => lb.AddFluentMigratorConsole());


var app = builder.Build();

// Run migrations on startup
using (var scope = app.Services.CreateScope())
{
    var runner = scope.ServiceProvider.GetRequiredService<IMigrationRunner>();
    try {
        runner.MigrateUp();
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogCritical(ex, "Error crítico durante la ejecución de las migraciones de base de datos.");
        throw;
    }
}

// Global Exception Handler Middleware
app.UseExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();

}

app.UseHttpsRedirection();

// Rate Limiter Middleware
app.UseRateLimiter();

// Authentication & Authorization Middlewares
app.UseAuthentication();
app.UseAuthorization();

// Feature Endpoints
app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapWineryEndpoints();
app.MapLocationEndpoints();
app.MapGrapeEndpoints();

app.Run();

