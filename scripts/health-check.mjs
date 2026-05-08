import net from "node:net";

const services = [
  { name: "Web", url: process.env.BABILI_WEB_URL ?? "http://localhost:3000" },
  {
    name: "API Gateway",
    url: process.env.BABILI_API_URL ?? "http://localhost:4000/health",
  },
  {
    name: "Auth Service",
    url: process.env.BABILI_AUTH_URL ?? "http://localhost:4101/health",
  },
  {
    name: "Restaurant Service",
    url: process.env.BABILI_RESTAURANT_URL ?? "http://localhost:4102/health",
  },
  {
    name: "Order Service",
    url: process.env.BABILI_ORDER_URL ?? "http://localhost:4103/health",
  },
  {
    name: "Translation Service",
    url: process.env.BABILI_TRANSLATION_URL ?? "http://localhost:4104/health",
  },
  {
    name: "PostgreSQL",
    tcp: {
      host: process.env.BABILI_POSTGRES_HOST ?? "localhost",
      port: Number(process.env.BABILI_POSTGRES_PORT ?? 5432),
    },
  },
  {
    name: "Redis",
    tcp: {
      host: process.env.BABILI_REDIS_HOST ?? "localhost",
      port: Number(process.env.BABILI_REDIS_PORT ?? 6379),
    },
  },
];

async function checkService(service) {
  if ("tcp" in service) {
    return checkTcpService(service);
  }

  try {
    const response = await fetch(service.url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        name: service.name,
        status: "failed",
        message: `HTTP ${response.status}`,
      };
    }

    return {
      name: service.name,
      status: "ok",
      message: "Running",
    };
  } catch (error) {
    return {
      name: service.name,
      status: "failed",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function checkTcpService(service) {
  return new Promise((resolve) => {
    const socket = net.createConnection(service.tcp);
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({
        name: service.name,
        status: "failed",
        message: "Connection timed out",
      });
    }, 5000);

    socket.once("connect", () => {
      clearTimeout(timeout);
      socket.end();
      resolve({
        name: service.name,
        status: "ok",
        message: "Running",
      });
    });

    socket.once("error", (error) => {
      clearTimeout(timeout);
      resolve({
        name: service.name,
        status: "failed",
        message: error.message || error.code || "Connection failed",
      });
    });
  });
}

const results = await Promise.all(services.map(checkService));

console.log("\nBabili Health Check\n");

for (const result of results) {
  const icon = result.status === "ok" ? "✅" : "❌";
  console.log(`${icon} ${result.name}: ${result.message}`);
}

const hasFailed = results.some((result) => result.status !== "ok");

if (hasFailed) {
  process.exit(1);
}

console.log("\nAll services are running.\n");
