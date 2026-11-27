using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessApp.Api.Gateways.Migrations
{
    /// <inheritdoc />
    public partial class AddMoves : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "Moves",
                table: "Games",
                type: "text[]",
                nullable: false,
                // Existing games get an empty move list.
                defaultValueSql: "'{}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Moves",
                table: "Games");
        }
    }
}
