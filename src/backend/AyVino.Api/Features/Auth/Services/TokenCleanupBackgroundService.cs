using AyVino.Api.Features.Auth.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace AyVino.Api.Features.Auth.Services;

public class TokenCleanupBackgroundService(
    IServiceProvider serviceProvider,
    ILogger<TokenCleanupBackgroundService> logger) : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(24);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Iniciando servicio en segundo plano de limpieza de tokens.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Esperar intervalo
                await Task.Delay(CleanupInterval, stoppingToken);

                logger.LogInformation("Ejecutando limpieza de Refresh Tokens expirados/revocados...");

                using var scope = serviceProvider.CreateScope();
                var repository = scope.ServiceProvider.GetRequiredService<IRefreshTokenRepository>();

                // Limpiar tokens revocados o expirados de hace más de 7 días
                var cutoffDate = DateTime.UtcNow.AddDays(-7);
                var deletedCount = await repository.DeleteExpiredAndRevokedTokensAsync(cutoffDate, stoppingToken);

                logger.LogInformation("Limpieza completada. Se eliminaron {Count} tokens obsoletos.", deletedCount);
            }
            catch (OperationCanceledException)
            {
                // Se detiene el servicio normalmente al cancelarse el token
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Ocurrió un error inesperado al depurar tokens de refresco.");
            }
        }
    }
}
