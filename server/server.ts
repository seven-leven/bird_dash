import { getConfig } from "./server_config.ts";
import { createHandler } from "./handler.ts";

if (import.meta.main) {
  const config = getConfig();
  const handler = createHandler(config);
  const server = Deno.serve({ port: config.port }, handler);
  console.log(`Server running at http://localhost:${config.port}`);

  const shutdown = () => {
    console.log("\nShutting down...");
    server.shutdown();
    Deno.exit();
  };

  // Always listen for SIGINT.
  Deno.addSignalListener("SIGINT", shutdown);

  // On Windows, use SIGBREAK instead of SIGTERM.
  if (Deno.build.os === "windows") {
    Deno.addSignalListener("SIGBREAK", shutdown);
  } else {
    Deno.addSignalListener("SIGTERM", shutdown);
  }
}
