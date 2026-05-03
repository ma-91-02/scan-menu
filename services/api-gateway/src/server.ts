import cors from "cors";
import express from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

const port = Number(process.env.API_GATEWAY_PORT ?? 4000);

const services = {
  auth: process.env.AUTH_SERVICE_URL ?? "http://localhost:4101",
  restaurants: process.env.RESTAURANT_SERVICE_URL ?? "http://localhost:4102",
  orders: process.env.ORDER_SERVICE_URL ?? "http://localhost:4103",
  translations: process.env.TRANSLATION_SERVICE_URL ?? "http://localhost:4104"
};

const proxyOptions = {
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody
  }
};

export function createApp(targets = services) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      data: {
        service: "api-gateway",
        status: "ok"
      }
    });
  });

  app.use("/auth", createProxyMiddleware({ target: targets.auth, ...proxyOptions }));
  app.use(
    "/restaurants",
    createProxyMiddleware({ target: targets.restaurants, ...proxyOptions })
  );
  app.use("/orders", createProxyMiddleware({ target: targets.orders, ...proxyOptions }));
  app.use(
    "/translations",
    createProxyMiddleware({ target: targets.translations, ...proxyOptions })
  );

  return app;
}

const app = createApp();

if (!process.env.SCANMENU_SKIP_LISTEN) {
  app.listen(port, () => {
    console.log(`Scan Menu API Gateway listening on http://localhost:${port}`);
  });
}
