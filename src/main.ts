/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins';

// Components
import App from './App.vue';

import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import '@/mocks/mock';

const app = createApp(App);

registerPlugins(app);

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('./views/HomeView.vue') },
    {
      path: '/login',
      component: () => import('./views/LoginView.vue'),
    },
  ],
});
app.use(router);

app.mount('#app');
