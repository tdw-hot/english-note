<template>
  <span class="playable-text-container">
    <slot>{{ text }}</slot>
    <button @click.stop.prevent="speakText(text)" class="play-audio-button-inline" title="播放读音">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/><path d="M0 0h24v24H0z" fill="none"/></svg>
    </button>
  </span>
</template>

<script>
export default {
  name: 'PlayableText',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      synth: null
    };
  },
  mounted() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
    }
  },
  methods: {
    speakText(textToSpeak) {
      if (!this.synth) {
        console.warn('SpeechSynthesis API is not available.');
        return;
      }
      if (this.synth.speaking) {
        this.synth.cancel(); // Cancel current speech before starting new one
      }
      if (textToSpeak) {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'en-US';
        utterance.pitch = 1;
        utterance.rate = 1;

        const voices = this.synth.getVoices();
        let americanVoice = voices.find(voice => voice.lang === 'en-US');

        if (voices.length === 0 && this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            const updatedVoices = this.synth.getVoices();
            americanVoice = updatedVoices.find(voice => voice.lang === 'en-US');
            if (americanVoice) {
              utterance.voice = americanVoice;
            }
            this.synth.speak(utterance);
            this.synth.onvoiceschanged = null;
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
    }
  }
};
</script>

<style scoped>
.playable-text-container {
  /* display: inline-flex; */ /* 调整对齐方式 */
  /* align-items: center; */
}

.play-audio-button-inline {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 2px 0 4px; /* 微调内边距 */
  margin-left: 2px; /* 与文本的间距 */
  vertical-align: middle; /* 尝试让按钮和文字更好地对齐 */
  color: #555;
  display: inline-block; /* 确保按钮不会导致换行 */
  line-height: 1; /* 调整行高 */
}

.play-audio-button-inline:hover {
  color: #007bff;
}

.play-audio-button-inline svg {
  vertical-align: middle; /* SVG图标垂直居中 */
}
</style> 