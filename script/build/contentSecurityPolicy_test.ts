import { test } from 'vitest';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { assert, assertEquals, assertStringIncludes } from '@std/assert';
import {
  contentSecurityPolicy,
  hashSource,
  inlineScripts,
  policyFor,
} from './contentSecurityPolicy.ts';

const PAGE = `<!DOCTYPE html>
<html>
  <head>
    <script>setTheme()</script>
    <script type="module" src="/src/main.ts"></script>
  </head>
</html>`;

type Transform = { handler: (html: string) => string };
const transform = (html: string) =>
  (contentSecurityPolicy().transformIndexHtml as Transform).handler(html);

test('only scripts written into the page count as inline; a script with a src does not', () => {
  assertEquals(inlineScripts(PAGE), ['setTheme()']);
});

test("a script's hash is the base64 SHA-256 of its exact text", () => {
  const digest = createHash('sha256').update('setTheme()').digest('base64');
  assertEquals(hashSource('setTheme()'), `'sha256-${digest}'`);
});

test('the policy allows the site itself and the hashed inline scripts, and nothing else', () => {
  const policy = policyFor(['setTheme()']);
  assertStringIncludes(policy, "default-src 'self'");
  assertStringIncludes(policy, `script-src 'self' ${hashSource('setTheme()')};`);
  assertStringIncludes(policy, "object-src 'none'");
  assertStringIncludes(policyFor([]), "script-src 'self';");
});

test('the build puts the policy first in <head>, before any script', () => {
  const html = transform(PAGE);
  const meta = html.indexOf('http-equiv="Content-Security-Policy"');
  assert(meta > html.indexOf('<head>') && meta < html.indexOf('<script'));
  assertStringIncludes(html, hashSource('setTheme()'));
});

test("the real index.html's theme script is allowed by the hash the build gives it", async () => {
  const html = await readFile('./index.html', 'utf8');
  const [theme] = inlineScripts(html);
  assertStringIncludes(theme!, "localStorage.getItem('theme')");
  assertStringIncludes(transform(html), hashSource(theme!));
});
