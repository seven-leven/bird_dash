<!-- The icon set, live: every icon in src/ui/icons.ts, in its group, drawn by the site's
     own <Icon>. On GitHub the same place shows the list of names. -->
<template>
  <div class="wi-icons">
    <section v-for="group in ICON_GROUPS" :key="group.label" class="wi-icon-group">
      <h4>{{ group.label }}</h4>
      <ul>
        <li v-for="name in group.icons" :key="name">
          <Icon :name="name" class="wi-icon" />
          <code>{{ name }}</code>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import Icon from '../../../src/ui/Icon.vue';
import { ICON_GROUPS } from '../../../src/ui/icons.ts';
</script>
