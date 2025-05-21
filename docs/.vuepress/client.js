import { defineClientConfig } from '@vuepress/client'
import WordList from './components/WordList.vue'

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    app.component('WordList', WordList)
  },
}) 