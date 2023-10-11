import { createApp } from 'vue'
import App from './App.vue'
import VirtualScroller from 'vue-virtual-scroller'

/**
 * 
 * @param {string} selector
 */
window.mountVirtualScroller = function(selector) {
  const app = createApp(App)
  app.use(VirtualScroller)
  app.mount(selector)
}