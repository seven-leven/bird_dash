// build_test.ts
import { assertEquals } from "@std/assert";
import { BUILD_DIR } from "./build_config.ts";

// Helper: remove build directory if it already exists.
async function cleanupBuildDir() {
  try {
    await Deno.remove(BUILD_DIR, { recursive: true });
  } catch (_error) {
    // Ignore if directory does not exist.
  }
}

Deno.test("build script should complete and create build directory", async () => {
  // Cleanup before starting the test.
  await cleanupBuildDir();

  // Run the build script as a subprocess using the new Deno.Command API.
  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-net",
      "--allow-run",
      "--allow-env",
      "bundler/build.ts",
    ],
    // Explicitly pass the parent's environment variables.
    env: Deno.env.toObject(),
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await command.output();
  const _output = new TextDecoder().decode(stdout);
  const errorOutput = new TextDecoder().decode(stderr);

  // Assert the script exited successfully.
  assertEquals(
    code,
    0,
    `Build script failed with exit code ${code}. Error: ${errorOutput}`,
  );

  // Check if BUILD_DIR now exists and is a directory.
  let stats;
  try {
    stats = await Deno.stat(BUILD_DIR);
  } catch (_error) {
    throw new Error(
      "Expected build directory was not created after running the build script.",
    );
  }
  assertEquals(
    stats.isDirectory,
    true,
    "The BUILD_DIR path exists but is not a directory.",
  );
});


