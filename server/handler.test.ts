// server/handler.test.ts
import { assertEquals, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import { createHandler } from "./handler.ts";

// Test: Reject non GET/HEAD requests.
Deno.test("handler returns 405 for non GET/HEAD requests", async () => {
  const config = { buildDir: "dummy", commonHeaders: {} };
  const handler = createHandler(config);
  const req = new Request("http://localhost/", { method: "POST" });
  const resp = await handler(req);
  assertEquals(resp.status, 405);
  assertEquals(await resp.text(), "Method Not Allowed");
});

// Test: Serve an existing file (e.g. index.html).
Deno.test("handler serves an existing file", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const indexPath = join(tempDir, "index.html");
    const content = "Hello World";
    await Deno.writeFile(indexPath, new TextEncoder().encode(content));

    const config = { buildDir: tempDir, commonHeaders: { "X-Test": "test" } };
    const handler = createHandler(config);
    // Requesting "/" should serve index.html.
    const req = new Request("http://localhost/", { method: "GET" });
    const resp = await handler(req);
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), content);

    // Verify the Content-Type header.
    const ct = resp.headers.get("Content-Type");
    if (ct) {
      assertStringIncludes(ct, "html");
    }
    // Check that the common header is present.
    assertEquals(resp.headers.get("X-Test"), "test");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test: SPA fallback when file not found and Accept header contains text/html.
Deno.test("handler uses SPA fallback for HTML requests when file not found", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    // Create an index.html for SPA fallback.
    const indexPath = join(tempDir, "index.html");
    const fallbackContent = "SPA Fallback";
    await Deno.writeFile(indexPath, new TextEncoder().encode(fallbackContent));

    const config = { buildDir: tempDir, commonHeaders: { "X-Test": "test" } };
    const handler = createHandler(config);
    // Request a non-existent file with Accept header containing text/html.
    const req = new Request("http://localhost/nonexistent.html", {
      method: "GET",
      headers: { Accept: "text/html" },
    });
    const resp = await handler(req);
    // SPA fallback should return status 200.
    assertEquals(resp.status, 200);
    assertEquals(await resp.text(), fallbackContent);
    // The fallback should have Content-Type set to text/html.
    assertEquals(resp.headers.get("Content-Type"), "text/html");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test: Return 404 when file not found and Accept header does not include text/html.
Deno.test("handler returns 404 when file is not found and no HTML accept header", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    // No file is created.
    const config = { buildDir: tempDir, commonHeaders: {} };
    const handler = createHandler(config);
    const req = new Request("http://localhost/nonexistent.txt", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const resp = await handler(req);
    assertEquals(resp.status, 404);
    assertEquals(await resp.text(), "Not Found");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

// Test: Directory traversal attempt (expected to yield 404 because URL normalization removes the "..")
Deno.test("handler returns 404 for directory traversal attempts", async () => {
  const tempDir = await Deno.makeTempDir();
  try {
    const config = { buildDir: tempDir, commonHeaders: {} };
    const handler = createHandler(config);
    // Although we write '/../secret.txt', the URL gets normalized to '/secret.txt'
    const req = new Request("http://localhost/../secret.txt", {
      method: "GET",
    });
    const resp = await handler(req);
    // Expect 404 Not Found because the file "secret.txt" is looked up inside buildDir
    assertEquals(resp.status, 404);
    assertEquals(await resp.text(), "Not Found");
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});
