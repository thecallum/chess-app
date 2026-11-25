FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ChessApp.sln ./
COPY src/ChessApp.Api/*.csproj src/ChessApp.Api/
COPY tests/ChessApp.Api.Tests/*.csproj tests/ChessApp.Api.Tests/
RUN dotnet restore
COPY . .
RUN dotnet publish src/ChessApp.Api -c Release -o /out/api --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out/api .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "ChessApp.Api.dll"]
