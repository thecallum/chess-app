using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChessApp.Api.Gateways.Migrations
{
    /// <inheritdoc />
    public partial class ClockInMilliseconds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "WhiteTimeRemaining",
                table: "Games",
                newName: "WhiteTimeRemainingMs");

            migrationBuilder.RenameColumn(
                name: "BlackTimeRemaining",
                table: "Games",
                newName: "BlackTimeRemainingMs");

            // Existing games stored seconds.
            migrationBuilder.Sql(
                "UPDATE \"Games\" SET \"WhiteTimeRemainingMs\" = \"WhiteTimeRemainingMs\" * 1000, \"BlackTimeRemainingMs\" = \"BlackTimeRemainingMs\" * 1000;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE \"Games\" SET \"WhiteTimeRemainingMs\" = \"WhiteTimeRemainingMs\" / 1000, \"BlackTimeRemainingMs\" = \"BlackTimeRemainingMs\" / 1000;");

            migrationBuilder.RenameColumn(
                name: "WhiteTimeRemainingMs",
                table: "Games",
                newName: "WhiteTimeRemaining");

            migrationBuilder.RenameColumn(
                name: "BlackTimeRemainingMs",
                table: "Games",
                newName: "BlackTimeRemaining");
        }
    }
}
