<!-- shell/AppFooter.vue
     The one footer, under the gallery and under every page (the app places it): what this
     build is (version, its line's name, the drawings, the commit; app/buildInfo.ts), the
     pages, the docs, the source, and how it is made. -->
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
        v-for="p in pages"
        :key="p.id"
        :href="`#${p.id}`"
        class="focus-ring rounded-control font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2"
        :aria-current="page === p.id ? 'page' : undefined"
      >
        {{ p.label }}
      </a>
      <!-- The docs site, served beside the gallery (docs/.vitepress). -->
      <a
        href="docs/"
        class="focus-ring rounded-control font-medium text-accent-700 dark:text-accent-400 hover:underline underline-offset-2"
      >
        Docs
      </a>
      <ExternalLink
        :href="REPO_URL"
        icon="github"
        class="underline underline-offset-2 hover:text-slate-800 dark:hover:text-slate-200"
      >
        GitHub
      </ExternalLink>
    </p>
    <p class="mt-2">Built in the open with Vue, Vite and Tailwind. Thaana set in Faruma.</p>
  </footer>
</template>

<script setup lang="ts">
import ExternalLink from '../ui/ExternalLink.vue';
import Icon from '../ui/Icon.vue';
import { useLayoutStore } from './layoutStore.ts';
import { drawings } from '../domain/countWords.ts';
import { REPO_URL } from '../domain/links.ts';

/** The build this is (app/buildInfo.ts). */
interface Build {
  version: string;
  /** The line's name: a Dhivehi name from the drawings, in drawing order. */
  name: { roman: string; script: string; species: string } | null;
  drawn: number;
  commit: string;
}
const props = defineProps<{ build: Build }>();

const { pages, page } = useLayoutStore();

const appVersion = props.build.version;
const appName = props.build.name;
const appCommit = props.build.commit;
const drawnLabel = drawings(props.build.drawn);
</script>
