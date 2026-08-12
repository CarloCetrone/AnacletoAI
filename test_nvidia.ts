const NVIDIA_API_KEY = "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";

async function testFlux() {
  console.log("Testing Flux...");
  const res = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b", {
    method: "POST",
    headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
        prompt: "A detailed photograph of an apple on a table",
        width: 1024,
        height: 1024,
        seed: 12345,
        steps: 4
      })
  });
  console.log("Flux Status:", res.status);
  const json = await res.json().catch(() => null);
  console.log("Flux JSON Response keys:", json ? Object.keys(json) : "Not JSON");
  if (json && json.detail) console.log("Flux Error:", json.detail);
}

async function testTrellis() {
  console.log("Testing Trellis...");
  const res = await fetch("https://ai.api.nvidia.com/v1/genai/microsoft/trellis", {
    method: "POST",
    headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
        prompt: "A red apple"
      })
  });
  console.log("Trellis Status:", res.status);
  const json = await res.json().catch(() => null);
  console.log("Trellis JSON Response keys:", json ? Object.keys(json) : "Not JSON");
  if (json && json.detail) console.log("Trellis Error:", json.detail);
}

await testFlux();
await testTrellis();

export {};
