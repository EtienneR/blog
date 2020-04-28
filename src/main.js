// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import DefaultLayout from '~/layouts/Default.vue'
import 'bootstrap/dist/css/bootstrap.css';
require("gridsome-plugin-remark-prismjs-all/themes/tomorrow.css");
require("prismjs/plugins/line-numbers/prism-line-numbers.css");

export default function (Vue, { router, head, isClient }) {
  head.htmlAttrs = { lang: 'fr' }
  // Set default layout as a global component
  Vue.component('Layout', DefaultLayout)
}
