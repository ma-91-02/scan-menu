import { spawn } from "node:child_process";

const commands = [
  ["shared", ["run", "dev", "-w", "@babili/shared"]],
  ["translation-service", ["run", "dev", "-w", "@babili/translation-service"]],
  ["restaurant-service", ["run", "dev", "-w", "@babili/restaurant-service"]],
  ["order-service", ["run", "dev", "-w", "@babili/order-service"]],
  ["auth-service", ["run", "dev", "-w", "@babili/auth-service"]],
  ["api-gateway", ["run", "dev", "-w", "@babili/api-gateway"]],
];

const defaults = {
  API_GATEWAY_PORT: "4000",
  AUTH_SERVICE_PORT: "4101",
  RESTAURANT_SERVICE_PORT: "4102",
  ORDER_SERVICE_PORT: "4103",
  TRANSLATION_SERVICE_PORT: "4104",
  AUTH_SERVICE_URL: "http://localhost:4101",
  RESTAURANT_SERVICE_URL: "http://localhost:4102",
  ORDER_SERVICE_URL: "http://localhost:4103",
  TRANSLATION_SERVICE_URL: "http://localhost:4104",
  DATABASE_URL: "postgresql://babili:babili_dev_password@localhost:5432/babili",
  REDIS_URL: "redis://localhost:6379",
  AUTH_TOKEN_SECRET: "dev-auth-token-secret-change-me",
  SESSION_SECRET: "dev-session-secret-change-me",
  PUBLIC_WEB_URL: "http://localhost:3000",
  PUBLIC_API_URL: "http://localhost:4000",
  SMTP_HOST: "smtp.hostinger.com",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_FROM: "Babili <noreply@your-ma.com>",
};

const children = commands.map(([name, args]) => {
  const child = spawn("npm", args, {
    cwd: process.cwd(),
    env: { ...defaults, ...process.env, NODE_ENV: "development" },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      return;
    }
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
