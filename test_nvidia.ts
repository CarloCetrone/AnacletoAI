const NVIDIA_API_KEY = "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";

async function testFlux() {
  console.log("Testing Flux...");
  const res = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.2-klein-4b", {
    method: "POST",
    headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ prompt: "A frog", image: [""], width: 1024, height: 1024, seed: 1234, steps: 4 })
  });
  console.log("Flux Status:", res.status);
  const text = await res.text();
  console.log("Flux Response:", text.substring(0, 200));
}

async function testTrellis() {
  console.log("Testing Trellis...");
  const res = await fetch("https://ai.api.nvidia.com/v1/genai/microsoft/trellis", {
    method: "POST",
    headers: { "Authorization": `Bearer ${NVIDIA_API_KEY}`, "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ prompt: "A frog", slat_cfg_scale: 3, ss_cfg_scale: 7.5, slat_sampling_steps: 25, ss_sampling_steps: 25, seed: 1234 })
  });
  console.log("Trellis Status:", res.status);
  const text = await res.text();
  console.log("Trellis Response:", text.substring(0, 200));
}

await testFlux();
await testTrellis();

export {};
