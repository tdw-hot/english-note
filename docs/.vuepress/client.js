import { defineClientConfig } from '@vuepress/client'
import WordList from './components/WordList.vue'
import PlayableText from './components/PlayableText.vue'

export default defineClientConfig({
  enhance({ app, router, siteData }) {
    app.component('WordList', WordList)
    app.component('PlayableText', PlayableText)
  },
}) 