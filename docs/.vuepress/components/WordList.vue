<template>
  <div>
    <div v-if="loading" class="loading-message">正在加载单词列表...</div>
    <div v-else-if="error" class="error-message">
      加载单词列表失败: {{ error }}. 请检查网络连接或文件是否存在。
    </div>
    <ul v-else-if="words.length > 0" class="word-list">
      <li v-for="(wordData, index) in words" :key="index" class="word-item">
        <strong class="word-term">{{ wordData.word }}</strong>:
        <div class="word-explanation" v-html="renderMarkdown(wordData.content)"></div>
      </li>
    </ul>
    <div v-else class="no-words-message">没有找到以 {{ letter.toUpperCase() }} 开头的单词。</div>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

export default {
  props: {
    letter: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      words: [],
      loading: true,
      error: null
    };
  },
  async mounted() {
    this.loadWords();
  },
  watch: {
    // 如果 letter prop 发生变化 (例如，在同一个组件实例被复用但 letter 不同时),
    // 重新加载数据。这在 VuePress 中不太可能直接发生，因为每个页面是独立的，
    // 但作为组件设计的良好实践。
    letter() {
      this.loadWords();
    }
  },
  methods: {
    async loadWords() {
      this.loading = true;
      this.error = null;
      try {
        // VuePress 的 public 文件会从根路径提供服务
        // gptwords.json 预处理后会生成 /words/words_a.json, /words/words_b.json 等
        const response = await fetch(`/words/words_${this.letter.toLowerCase()}.json`);
        if (!response.ok) {
          throw new Error(`请求失败，状态码: ${response.status}`);
        }
        const data = await response.json();
        // 假设数据直接就是单词数组，并且每个对象有 'word' 和 'explanation' 字段
        // 更正：现在我们知道解释在 content 字段
        this.words = data;
      } catch (e) {
        this.error = e.message;
        console.error(`加载首字母为 '${this.letter}' 的单词失败:`, e);
      } finally {
        this.loading = false;
      }
    },
    renderMarkdown(markdownText) {
      if (markdownText) {
        return md.render(markdownText);
      }
      return '';
    }
  }
};
</script>

<style scoped>
.loading-message,
.error-message,
.no-words-message {
  padding: 1em;
  text-align: center;
  color: #666;
}
.error-message {
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
  border-radius: 4px;
}
.word-list {
  list-style-type: none;
  padding: 0;
}
.word-item {
  padding: 0.8em 0.5em;
  border-bottom: 1px solid #eee;
}
.word-item:last-child {
  border-bottom: none;
}
.word-term {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5em;
}
.word-explanation {
  color: #555;
  /* margin-left: 0.5em; */ /* 如果单词和解释在同一行，这个有用 */
}

/* 为Markdown渲染的内容添加一些基本样式 */
.word-explanation >>> h1,
.word-explanation >>> h2,
.word-explanation >>> h3,
.word-explanation >>> h4,
.word-explanation >>> h5,
.word-explanation >>> h6 {
  margin-top: 0.8em;
  margin-bottom: 0.4em;
  font-weight: bold;
}
.word-explanation >>> h1 { font-size: 1.6em; }
.word-explanation >>> h2 { font-size: 1.4em; }
.word-explanation >>> h3 { font-size: 1.2em; }

.word-explanation >>> p {
  margin-bottom: 0.6em;
  line-height: 1.6;
}

.word-explanation >>> ul,
.word-explanation >>> ol {
  margin-left: 1.5em;
  margin-bottom: 0.6em;
}

.word-explanation >>> li {
  margin-bottom: 0.2em;
}

.word-explanation >>> code {
  background-color: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

.word-explanation >>> pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
}

.word-explanation >>> pre code {
  padding: 0;
  background-color: transparent;
}
</style> 