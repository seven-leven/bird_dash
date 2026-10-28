<!-- components/layout/CollectionMenu.vue
     The collections as one button where tabs do not fit (docs/DESIGN.md §10): it names
     the current collection, and opens the list of all of them. A disclosure, not an
     ARIA menu: a button that shows and hides a list of buttons, so Tab, Enter and
     Escape work as everywhere else. -->
<template>
  <div class="relative" ref="rootRef" @keydown.escape="close(true)">
    <button
      ref="buttonRef"
      class="nav-item focus-ring flex items-center gap-1.5 px-2.5 py-1.5 max-md:min-h-9
             font-medium text-slate-900 dark:text-slate-100"
      :aria-expanded="open"
      aria-controls="collection-menu"
      @click="open = !open"
    >
      <CollectionIcon v-if="page === 'gallery' && activeCollection" :collection="activeCollection" class="size-4" />
      <span class="truncate max-w-32">{{ currentPage?.label ?? activeCollection?.label }}</span>
      <Icon
        name="chevronDown"
        class="size-3 text-muted transition-transform duration-fast"
        :class="open && 'rotate-180'"
      />
      <span class="sr-only">, choose a collection</span>
    </button>

    <ul
      v-if="open"
      id="collection-menu"
      class="absolute left-0 top-full mt-1.5 z-50 min-w-48 p-1 rounded-card border shadow-float
             bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800"
    >
      <li v-for="col in collections" :key="col.id">
        <button
          class="nav-item focus-ring w-full flex items-center gap-2 px-3 py-2 text-left min-h-9"
          :aria-current="page === 'gallery' && col.id === activeCollection?.id ? 'page' : undefined"
          @click="choose(col.id)"
        >
          <CollectionIcon :collection="col" class="size-4" />
          {{ col.label }}
        </button>
      </li>
      <li
        v-for="(p, i) in pages"
        :key="p.id"
        :class="i === 0 && 'mt-1 border-t pt-1 border-slate-100 dark:border-slate-800'"
      >
        <a
          :href="`#${p.id}`"
          class="nav-item focus-ring w-full flex items-center px-3 py-2 min-h-9"
          :aria-current="page === p.id ? 'page' : undefined"
          @click="close()"
        >
          {{ p.label }}
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue';
import Icon from '../ui/Icon.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { useCollectionsStore } from '../gallery/collectionsStore.ts';
import { useActions } from '../app/actions.ts';
import { useLayoutStore } from './layoutStore.ts';

const { collections, activeCollection } = useCollectionsStore();
const { selectCollection } = useActions();
const { pages, page, currentPage } = useLayoutStore();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);

/** Close the list; `refocus` returns focus to the button (after Escape). */
function close(refocus = false): void {
  if (!open.value) return;
  open.value = false;
  if (refocus) nextTick(() => buttonRef.value?.focus());
}

function choose(id: string): void {
  selectCollection(id);
  close(true);
}

// A press anywhere outside closes the list, as a click-away should.
const onPointerDown = (e: PointerEvent) => {
  if (!rootRef.value?.contains(e.target as Node)) close();
};
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown);
  else document.removeEventListener('pointerdown', onPointerDown);
});
onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown));
</script>
