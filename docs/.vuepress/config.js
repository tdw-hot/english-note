import { defineUserConfig } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
    bundler: viteBundler(),
    base: "/english-note/",
    // 站点配置
    lang: 'zh-CN',
    title: '英语语法笔记',
    description: '从0开始学习英语语法',

    locales: {
      '/': {
        lang: 'zh-CN',
        title: '英语语法',
        description: '从0开始学习英语语法',
      },
    },

    theme: defaultTheme({
      docsRepo: 'https://github.com/tdw-hot/english-note',
      docsBranch: 'master',
      docsDir: 'docs',
      editLinkPattern: ':repo/edit/:branch/:path',
      contributors: false,
      logo: "/logo/logo.svg",
      repo: "tdw-hot/english-note",
      darkMode: false,
      sidebar: [
        '/guide/grammar.md',
        '/guide/sentence.md',
        '/guide/giant.md',
        '/guide/adjectiveToNoun.md',
        '/guide/adverb.md',
        '/guide/preposition.md',
        '/guide/compare.md',
      ],
    }),
})
