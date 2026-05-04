const services = [
  { name: "Web", url: process.env.SCANMENU_WEB_URL ?? "http://localhost:3000" },
  { name: "API Gateway", url: process.env.SCANMENU_API_URL ?? "http://localhost:4000/health" },
  { name: "Auth Service", url: process.env.SCANMENU_AUTH_URL ?? "http://localhost:4101/health" },
  { name: "Restaurant Service", url: process.env.SCANMENU_RESTAURANT_URL ?? "http://localhost:4102/health" },
  { name: "Order Service", url: process.env.SCANMENU_ORDER_URL ?? "http://localhost:4103/health" },
  { name: "Translation Service", url: process.env.SCANMENU_TRANSLATION_URL ?? "http://localhost:4104/health" }
];

async function checkService(service) {
  try {
    const response = await fetch(service.url, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return {
        name: service.name,
        status: "failed",
        message: `HTTP ${response.status}`
      };
    }

    return {
      name: service.name,
      status: "ok",
      message: "Running"
    };
  } catch (error) {
    return {
      name: service.name,
      status: "failed",
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

const results = await Promise.all(services.map(checkService));

console.log("\nScan Menu Health Check\n");

for (const result of results) {
  const icon = result.status === "ok" ? "✅" : "❌";
  console.log(`${icon} ${result.name}: ${result.message}`);
}

const hasFailed = results.some((result) => result.status !== "ok");

if (hasFailed) {
  process.exit(1);
}

console.log("\nAll services are running.\n");
