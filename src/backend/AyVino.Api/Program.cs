using AyVino.Api.Common.Data;
using AyVino.Api.Common.Middleware;
using AyVino.Api.Features.Users.Endpoints;
using AyVino.Api.Features.Users.Repositories;
using AyVino.Api.Features.Users.Services;
using AyVino.Api.Features.Bodegas.Endpoints;
using AyVino.Api.Features.Bodegas.Repositories;
using AyVino.Api.Features.Bodegas.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();

// Exception Handling & RFC 7807 ProblemDetails
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// Infrastructure & Data Access
builder.Services.AddSingleton<IDbConnectionFactory, NpgsqlConnectionFactory>();

// Feature: Users
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IBodegaRepository, BodegaRepository>();
builder.Services.AddScoped<IBodegaService, BodegaService>();

var app = builder.Build();

// Global Exception Handler Middleware
app.UseExceptionHandler();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Feature Endpoints
app.MapUserEndpoints();
app.MapBodegaEndpoints();

app.Run();
