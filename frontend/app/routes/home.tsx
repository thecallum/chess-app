import { useState } from "react";
import { Button } from "~/components/ui/button";

export default function Home() {
  const [result, setResult] = useState<string>();

  async function loadWeather() {
    const response = await fetch("/api/weatherforecast");
    setResult(JSON.stringify(await response.json(), null, 2));
  }

  return (
    <main>
      <h1>Home</h1>
      <Button onClick={loadWeather}>Get weather</Button>
      {result && <pre>{result}</pre>}
    </main>
  );
}
