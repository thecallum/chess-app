using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessApp.Api.Gateways.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Games",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WhiteClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    BlackClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    StartedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastMoveAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    WhiteTimeRemaining = table.Column<int>(type: "integer", nullable: false),
                    BlackTimeRemaining = table.Column<int>(type: "integer", nullable: false),
                    CurrentMove = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    GameInviteCode = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Games", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Games_GameInviteCode",
                table: "Games",
                column: "GameInviteCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Games");
        }
    }
}
