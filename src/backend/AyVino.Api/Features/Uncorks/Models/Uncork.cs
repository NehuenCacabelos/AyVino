namespace AyVino.Api.Features.Uncorks.Models;

public class Uncork
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int WineVintageId { get; set; }
    public int? CellarId { get; set; }
    public DateTime UncorkedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
