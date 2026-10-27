// The docs theme: VitePress's own, dressed in the site's tokens (style.css), with the
// site's logo mark beside the title and the manifesto's live sections as components.
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import LogoMark from '../../../src/ui/LogoMark.vue';
import AccentRamps from './AccentRamps.vue';
import IconSheet from './IconSheet.vue';
import './style.css';

export default {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-title-before': () => h(LogoMark, { class: 'wi-logo' }),
    }),
  enhanceApp({ app }) {
    // The live sections of DESIGN.md (`<!-- live: Name -->`, script/docs/liveBlocks.ts).
    app.component('AccentRamps', AccentRamps);
    app.component('IconSheet', IconSheet);
  },
} satisfies Theme;
