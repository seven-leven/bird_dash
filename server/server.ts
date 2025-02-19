// server/server.ts
import { getConfig } from "./server_config.ts";
import { createHandler } from "./handler.ts";

if (import.meta.main) {
  const config = getConfig();
  const handler = createHandler(config);
  const server = Deno.serve({ port: config.port }, handler);
  console.log(`Server running at http://localhost:${config.port}`);

  // Graceful shutdown on SIGINT.
  Deno.addSignalListener("SIGINT", () => {
    console.log("\nShutting down...");
    server.shutdown();
    Deno.exit();
  });
}
