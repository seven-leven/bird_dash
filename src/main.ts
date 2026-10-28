// src/main.ts
import { createApp } from 'vue';
import './styles/main.css';
import App from './app/App.vue';
import { showCrash } from './browser/showCrash.ts';
import { reloadPage } from './browser/reloadPage.ts';

const app = createApp(App);
// What App.vue's own boundary cannot catch (an error in App itself) still leaves a message.
app.config.errorHandler = (err) => {
  console.error(err);
  showCrash(
    document.querySelector('#app'),
    err instanceof Error ? err.message : String(err),
    reloadPage,
  );
};
app.mount('#app');
