<template>
  <div>
    <div v-if="loading" class="loading-message">正在加载单词列表...</div>
    <div v-else-if="error" class="error-message">
      加载单词列表失败: {{ error }}. 请检查网络连接或文件是否存在。
    </div>
    <ul v-else-if="words.length > 0" class="word-list">
      <li v-for="(wordData, index) in words" :key="index" class="word-item">
        <div>
          <strong class="word-term">{{ wordData.word }}</strong>
          <button @click="speakWord(wordData.word)" class="play-audio-button" title="播放单词读音">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
          </button>
        </div>
        <div class="word-explanation" v-if="wordData.content && wordData.content.trim() !== ''" v-html="renderMarkdown(wordData.content)"></div>
        
        <!-- Examples section (existing) -->
        <div v-if="wordData.examples && wordData.examples.length > 0" class="example-sentences">
          <h4 class="examples-title">例句:</h4>
          <ul class="example-list">
            <li v-for="(example, exIndex) in wordData.examples" :key="'ex-'+exIndex" class="example-item">
              <PlayableText :text="example.sentence" />
              <span v-if="example.translation" class="example-translation">（{{ example.translation }}）</span>
            </li>
          </ul>
        </div>

        <!-- New section for Story -->
        <div v-if="wordData.story && (wordData.story.english || wordData.story.chinese)" class="story-section">
          <h4 class="story-title">小故事:</h4>
          <div v-if="wordData.story.english" class="story-english">
            <PlayableText :text="wordData.story.english" />
          </div>
          <div v-if="wordData.story.chinese" class="story-chinese">
            <p>{{ wordData.story.chinese }}</p>
          </div>
        </div>

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
      error: null,
      synth: null, // Store SpeechSynthesis instance
    };
  },
  mounted() {
    this.loadWords();
    if (typeof window !== 'undefined') {
        this.synth = window.speechSynthesis;
    }
  },
  watch: {
    // 如果 letter prop 发生变化 (例如，在同一个组件实例被复用但 letter 不同时),
    // 重新加载数据。这在 VuePress 中不太可能直接发生，因为每个页面是独立的，
    // 但作为组件设计的良好实践。
    letter() {
      this.loadWords();
    }
  },
  updated() {
    this.$nextTick(() => {
      this.enhanceSpeakableSegments();
    });
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
      if (markdownText && markdownText.trim() !== '') {
        return md.render(markdownText);
      }
      return '';
    },
    speakWord(textToSpeak) {
      if (!this.synth) {
        console.warn('SpeechSynthesis API is not available.');
        return;
      }
      if (this.synth.speaking) {
        console.warn('SpeechSynthesis is already speaking.');
        this.synth.cancel(); // Optional: cancel current speech before starting new one
        // return; // Optional: or prevent new speech if already speaking
      }
      if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US'; // 设置为美式英语
        utterance.pitch = 1; // 0 to 2, default 1
        utterance.rate = 1; // 0.1 to 10, default 1
        
        // 尝试找到一个明确的美式英语声音 (可选但推荐)
        const voices = this.synth.getVoices();
        let americanVoice = voices.find(voice => voice.lang === 'en-US');
        
        // 有些浏览器/系统需要异步获取voices列表
        if (voices.length === 0 && this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                const updatedVoices = this.synth.getVoices();
                americanVoice = updatedVoices.find(voice => voice.lang === 'en-US');
                if (americanVoice) {
                    utterance.voice = americanVoice;
                }
                this.synth.speak(utterance);
                this.synth.onvoiceschanged = null; // 清理事件监听器
            };
        } else {
            if (americanVoice) {
                utterance.voice = americanVoice;
            }
            this.synth.speak(utterance);
        }

        utterance.onerror = (event) => {
          console.error('SpeechSynthesisUtterance.onerror', event);
        };
      } else {
        console.warn('No text provided to speak.');
      }
    },
    enhanceSpeakableSegments() {
      if (typeof window === 'undefined' || !this.$el) return;

      const existingButtons = this.$el.querySelectorAll('.speakable-segment-button');
      existingButtons.forEach(btn => btn.remove()); // Remove old buttons to prevent duplication

      const speakableSpans = this.$el.querySelectorAll('span.speakable-english-segment');
      
      speakableSpans.forEach(span => {
        const textToSpeak = span.dataset.textToSpeak;
        if (textToSpeak) {
          const button = document.createElement('button');
          button.classList.add('play-audio-button-inline', 'speakable-segment-button'); // Added speakable-segment-button for cleanup
          button.title = '播放读音';
          button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/><path d="M0 0h24v24H0z" fill="none"/></svg>`;
          button.style.marginLeft = '2px'; // Add a small margin
          
          button.onclick = (event) => {
            event.stopPropagation();
            this.speakWord(textToSpeak); // speakWord is already defined to use this.synth
          };
          
          // Insert button after the span
          span.parentNode.insertBefore(button, span.nextSibling);
        }
      });
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
  margin-right: 8px; /* 在单词和播放按钮之间添加一些间距 */
  /* margin-bottom: 0.5em; */ /* 之前为了让单词和冒号在同一行已注释掉 */
}
.word-explanation {
  color: #555;
  margin-top: 0.5em; /* 确保解释内容和单词/播放按钮行有间距 */
}
.word-explanation:empty {
    display: none; /* Hide if content is empty after extraction */
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

.play-audio-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 4px;
  vertical-align: middle; /* 让按钮和文字对齐 */
  color: #555;
}

.play-audio-button:hover {
  color: #007bff;
}

.example-sentences {
  margin-top: 1em;
  padding-left: 0.5em; /* Slightly indent example section */
}

.examples-title {
  font-size: 1.1em;
  font-weight: bold;
  color: #444;
  margin-bottom: 0.5em;
}

.example-list {
  list-style-type: decimal; /* Use numbers for example list */
  padding-left: 1.5em; /* Indent list items */
}

.example-item {
  margin-bottom: 0.5em;
  line-height: 1.6;
}

.example-translation {
  color: #666;
  font-size: 0.9em;
  margin-left: 5px;
}

/* Styles for Story Section */
.story-section {
  margin-top: 1em;
  padding-left: 0.5em;
  border-left: 3px solid #eee;
}

.story-title {
  font-size: 1.1em;
  font-weight: bold;
  color: #444;
  margin-bottom: 0.5em;
}

.story-english {
  margin-bottom: 0.5em;
  line-height: 1.6;
}

.story-chinese {
  color: #666;
  font-size: 0.9em;
  line-height: 1.5;
}
.story-chinese p {
    margin: 0;
}
</style> 