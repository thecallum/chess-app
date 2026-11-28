using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessApp.Api.Gateways.Migrations
{
    /// <inheritdoc />
    public partial class AddGameState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GameState",
                table: "Games",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GameState",
                table: "Games");
        }
    }
}
