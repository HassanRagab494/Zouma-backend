import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Import API routes
import authRouter from "./routes/auth.js";
import clientsRouter from "./routes/clients.js";
import productsRouter from "./routes/products.js";
import ordersRouter from "./routes/orders.js";
import dashboardRouter from "./routes/dashboard.js";
import usersRouter from "./routes/users.js";

async function runServer() {
  const app = express();
  const PORT = 3000;

  // Basic CORS & JSON Parsing middleware
  app.use(cors());
  app.use(express.json());

  // API Route mountpoints
  app.use("/api/auth", authRouter);
  app.use("/api/clients", clientsRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);

  // Health check API point
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "Zouma Gift Shop Backend API Engine"
    });
  });

  // Serve Single-Page App (Vite integration)
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with active Vite middlewares.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in compiled production mode. Serving static package directory.");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve build files
    app.use(express.static(distPath));
    
    // Fallback any client route to index.html
    const fallbackPath = path.join(distPath, "index.html");
    app.get("*", (req, res) => {
      res.sendFile(fallbackPath);
    });
  }

  // Listens on port 3000 and bind to 0.0.0.0 for container accessibility
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zouma Gift Shop Management System is active and running on http://localhost:${PORT}`);
  });
}

runServer().catch((error) => {
  console.error("Critical crash during Zouma server bootstrap process:", error);
});
