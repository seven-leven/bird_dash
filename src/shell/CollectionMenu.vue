<!-- shell/CollectionMenu.vue
     The collections as one button where tabs do not fit (docs/DESIGN.md §10): it names
     the current collection, and opens the list of all of them. A disclosure, not an
     ARIA menu: a button that shows and hides a list of buttons, so Tab, Enter and
     Escape work as everywhere else. -->
<template>
  <div class="relative" ref="root" @keydown.escape="close(true)">
    <button
      ref="button"
      class="nav-item focus-ring flex items-center gap-1.5 px-2.5 py-1.5 max-md:min-h-9
             font-medium text-stone-900 dark:text-stone-100"
      :aria-expanded="open"
      :aria-controls="menuId"
      @click="open = !open"
    >
      <CollectionIcon v-if="page === 'gallery' && active" :collection="active" class="size-4" />
      <span class="truncate max-w-32">{{ currentPage?.label ?? active?.label }}</span>
      <Icon
        name="chevronDown"
        class="size-3 text-muted transition-transform duration-fast"
        :class="open && 'rotate-180'"
      />
      <span class="sr-only">, choose a collection</span>
    </button>

    <ul
      v-if="open"
      :id="menuId"
      class="absolute left-0 top-full mt-1.5 z-50 min-w-48 p-1 rounded-card border shadow-float
             bg-white border-stone-200 dark:bg-stone-900 dark:border-stone-800"
    >
      <li v-for="col in collections" :key="col.id">
        <button
          class="nav-item focus-ring w-full flex items-center gap-2 px-3 py-2 text-left min-h-9"
          :aria-current="page === 'gallery' && col.id === active?.id ? 'page' : undefined"
          @click="choose(col.id)"
        >
          <CollectionIcon :collection="col" class="size-4" />
          {{ col.label }}
        </button>
      </li>
      <li
        v-for="(p, i) in pages"
        :key="p.id"
        :class="i === 0 && 'mt-1 border-t pt-1 border-stone-100 dark:border-stone-800'"
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
import { nextTick, onUnmounted, ref, useId, useTemplateRef, watch } from 'vue';
import Icon from '../ui/Icon.vue';
import CollectionIcon from '../ui/CollectionIcon.vue';
import { useLayoutStore } from './layoutStore.ts';
import type { Collection } from '../domain/toCollectionItems.ts';

defineProps<{
  collections: Collection[];
  /** The collection on screen, once one is. */
  active?: Collection;
}>();
const emit = defineEmits<{ select: [collectionId: string] }>();

const { pages, page, currentPage } = useLayoutStore();

const open = ref(false);
const rootEl = useTemplateRef<HTMLElement>('root');
const buttonEl = useTemplateRef<HTMLButtonElement>('button');
const menuId = useId();

/** Close the list; `refocus` returns focus to the button (after Escape). */
function close(refocus = false): void {
  if (!open.value) return;
  open.value = false;
  if (refocus) nextTick(() => buttonEl.value?.focus());
}

function choose(id: string): void {
  emit('select', id);
  close(true);
}

// A press anywhere outside closes the list, as a click-away should.
const onPointerDown = (e: PointerEvent) => {
  if (!rootEl.value?.contains(e.target as Node)) close();
};
watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown);
  else document.removeEventListener('pointerdown', onPointerDown);
});
onUnmounted(() => document.removeEventListener('pointerdown', onPointerDown));
</script>
