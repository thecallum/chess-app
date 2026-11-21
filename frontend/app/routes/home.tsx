import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState<string>();

  async function loadWeather() {
    const response = await fetch("/api/weatherforecast");
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main>
      <h1>Home</h1>
      <button onClick={loadWeather}>Get weather</button>
      {result && <pre>{result}</pre>}
    </main>
  );
}
