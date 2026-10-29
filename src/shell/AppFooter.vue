<!-- shell/AppFooter.vue
     The one footer, under the gallery and under every page (the app places it). Two rows: the
     archive and how far it has come beside the pages, the docs and the source; then, small and
     muted, which build this is (version, its line's name, the commit; app/buildInfo.ts). Each
     row stacks on a phone. -->
<template>
  <footer class="mt-16 border-t border-rule pt-8 pb-10 text-sm transition-colors">
    <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <LogoMark class="size-6 shrink-0 text-strong" />
        <div>
          <p class="font-medium text-strong">Wildlife Illustrated</p>
          <p class="text-xs text-body">{{ progress }}</p>
        </div>
      </div>
      <nav aria-label="Site" class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <a
          v-for="p in pages"
          :key="p.id"
          :href="`#${p.id}`"
          class="footer-link focus-ring rounded-control"
          :aria-current="page === p.id ? 'page' : undefined"
        >
          {{ p.label }}
        </a>
        <!-- The docs site, served beside the gallery (docs/.vitepress). -->
        <a href="docs/" class="footer-link focus-ring rounded-control">Docs</a>
        <ExternalLink :href="REPO_URL" class="footer-link">GitHub</ExternalLink>
      </nav>
    </div>

    <div
      class="mt-6 flex flex-col gap-1 border-t border-rule pt-5 text-xs text-muted
             sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <!-- The line's name: a Dhivehi name from the drawings, in drawing order. -->
        <template v-if="build.name">
          <span
            lang="dv-Latn"
            :title="`This line of work is named after the ${build.name.species}, ${build.name.script}`"
          >{{ build.name.roman }}</span>
          ·
        </template>
        <span title="Version">v{{ build.version }}</span>
        ·
        <span class="font-mono" title="The commit this site was built from">{{ build.commit }}</span>
      </p>
      <p v-once>&copy; {{ new Date().getFullYear() }}</p>
    </div>
  </footer>
</template>

<script setup lang="ts">
import ExternalLink from '../ui/ExternalLink.vue';
import LogoMark from '../ui/LogoMark.vue';
import { useLayoutStore } from './layoutStore.ts';
import { drawnOf } from '../domain/countWords.ts';
import { REPO_URL } from '../domain/links.ts';

/** The build this is (app/buildInfo.ts). */
interface Build {
  version: string;
  /** The line's name: a Dhivehi name from the drawings, in drawing order. */
  name: { roman: string; script: string; species: string } | null;
  drawn: number;
  /** The items in the lists, drawn or not. */
  planned: number;
  commit: string;
}
const props = defineProps<{ build: Build }>();

const { pages, page } = useLayoutStore();

/** "18 of 276 drawn, by hand", as the rest of the site counts. */
const progress = `${drawnOf(props.build.drawn, props.build.planned)}, by hand`;
</script>
