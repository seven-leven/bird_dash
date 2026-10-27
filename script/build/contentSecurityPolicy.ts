// The site's Content-Security-Policy (docs/plans/PLATFORM.md, phase 3b). GitHub Pages cannot
// send headers, so the policy goes in a <meta> tag that the build writes into index.html: the
// page may load scripts, styles, images, fonts and data from the site itself only, plus the
// inline theme script, allowed by its hash, which the build works out so it can never go stale.
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/** The contents of every inline `<script>` (one with no `src`) in the page. */
export function inlineScripts(html: string): string[] {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
}

/** A script's CSP hash source: `'sha256-…'` of its exact text. */
export const hashSource = (script: string): string =>
  `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`;

/** The policy for a page whose inline scripts are `scripts`. */
export function policyFor(scripts: string[]): string {
  return [
    "default-src 'self'",
    `script-src 'self' ${scripts.map(hashSource).join(' ')}`.trim(),
    "style-src 'self'",
    "img-src 'self'",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ');
}

/** The Vite plugin: put the policy first in the built page's <head>, before any script runs. */
export function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) =>
        html.replace(
          /<head>/,
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${
            policyFor(inlineScripts(html))
          }" />`,
        ),
    },
  };
}
