using ChessApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ChessApp.Api.Gateways;

public sealed class ChessDbContext : DbContext
{
    public ChessDbContext(DbContextOptions<ChessDbContext> options) : base(options)
    {
    }

    public DbSet<Game> Games => Set<Game>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Game>(game =>
        {
            game.HasKey(g => g.Id);
            game.Property(g => g.Id).ValueGeneratedNever();

            // The unique index is what makes invite-code clashes detectable.
            game.HasIndex(g => g.GameInviteCode).IsUnique();

            game.Property(g => g.Status).HasConversion<string>().HasMaxLength(30);

            // Get-only properties aren't mapped by convention, so list them.
            game.Property(g => g.CreatedAt);
            game.Property(g => g.WhiteTimeRemaining);
            game.Property(g => g.BlackTimeRemaining);
        });
    }
}
