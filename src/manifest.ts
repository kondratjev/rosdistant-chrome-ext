import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
  name: 'create-chrome-ext',
  description: '',
  version: '0.0.0',
  manifest_version: 3,
  icons: {
    '16': 'img/logo-16.png',
    '32': 'img/logo-32.png',
  },
  action: {
    default_popup: 'popup.html',
    default_icon: 'img/logo-32.png',
  },
  options_page: 'options.html',
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://edu.rosdistant.ru/*'],
      js: ['src/content/index.ts'],
      css: ['src/content/index.css'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-32.png', 'src/content/index.css'],
      matches: [],
    },
  ],
  permissions: ['storage', 'unlimitedStorage'],
});
