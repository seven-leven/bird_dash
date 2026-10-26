<!-- components/layout/AppFooter.vue
     The one footer, under the gallery and under every page (src/pages.ts): what this
     build is (version, its line's name, the drawings, the commit), the pages, the source,
     and how it is made. -->
<template>
  <footer
    class="mt-16 pt-6 pb-8 border-t text-center text-xs transition-colors
           border-slate-100 text-muted dark:border-slate-800/50"
  >
    <p class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
      <!-- Static per build -->
      <span v-once>Wildlife Illustrated &copy; {{ new Date().getFullYear() }}</span>
      <span class="with-icon" title="Version">
        <Icon name="tag" aria-hidden="true" />v{{ appVersion }}
        <!-- The line's name: a Dhivehi name from the drawings, in drawing order. -->
        <span
          v-if="appName"
          lang="dv-Latn"
          :title="`This line of work is named after the ${appName.species}, ${appName.script}`"
        >{{ appName.roman }}</span>
      </span>
      <span class="with-icon">
        <Icon name="image" aria-hidden="true" />{{ drawnLabel }}
      </span>
      <span class="with-icon font-mono" title="The commit this site was built from">
        <Icon name="commit" aria-hidden="true" />{{ appCommit }}
      </span>
      <a
        v-for="p in PAGES"
        :key="p.id"
        :href="`#${p.id}`"
        class="focus-ring rounded-control font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2"
        :aria-current="page === p.id ? 'page' : undefined"
      >
        {{ p.label }}
      </a>
      <a
        :href="SOURCE_URL"
        target="_blank"
        rel="noopener noreferrer"
        class="focus-ring inline-flex items-center gap-1 rounded-control underline underline-offset-2
               hover:text-slate-800 dark:hover:text-slate-200"
      >
        <Icon name="github" class="size-3" aria-hidden="true" />
        GitHub
        <span class="sr-only">(opens in a new tab)</span>
      </a>
    </p>
    <p class="mt-2">Built in the open with Vue, Vite and Tailwind. Thaana set in Faruma.</p>
  </footer>
</template>

<script setup lang="ts">
import Icon from '../icons/Icon.vue';
import { useUi } from '../../stores/ui.ts';
import { drawings } from '../../lib/formatCount.ts';
import { PAGES } from '../../pages.ts';

const SOURCE_URL = 'https://github.com/seven-leven/bird_dash';

const { page } = useUi();

// Injected at build time by vite.config.ts (worked out in script/version/version.ts).
const appVersion = __APP_VERSION__;
const appName = __APP_NAME__;
const appCommit = __APP_COMMIT__;
const drawnLabel = drawings(__APP_DRAWN__);
</script>
