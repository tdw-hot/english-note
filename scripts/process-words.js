const fs = require('fs');
const path = require('path');

const wordsFilePath = path.resolve(__dirname, '../docs/.vuepress/gptwords.json');
const outputDir = path.resolve(__dirname, '../docs/.vuepress/public/words');
const pagesOutputDir = path.resolve(__dirname, '../docs/words');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(pagesOutputDir)) {
    fs.mkdirSync(pagesOutputDir, { recursive: true });
}

// 读取巨大的 JSON 文件
// 注意：对于非常大的文件，需要使用流式处理或者分块读取，
// 但 Node.js 的 require() 或 fs.readFileSync() 对于 JSON 文件有内存限制。
// 假设 gptwords.json 是一个巨大的 JSON 数组。
// 如果是其他格式，此处的读取和解析逻辑需要调整。
let wordsData = [];
try {
    // 修改为按行读取和解析 JSON Lines 格式
    console.log(`Reading ${wordsFilePath}...`);
    const fileContent = fs.readFileSync(wordsFilePath, 'utf8');
    console.log('Parsing JSON data (JSON Lines format)...');
    wordsData = fileContent
        .split('\n') // 按换行符分割成多行
        .filter(line => line.trim() !== '') // 过滤掉空行
        .map((line, index) => { // 解析每一行
            try {
                return JSON.parse(line);
            } catch (parseError) {
                console.error(`Error parsing JSON on line ${index + 1}: ${line}`);
                console.error(parseError);
                return null; // 或者抛出错误，取决于是否希望忽略错误行
            }
        })
        .filter(entry => entry !== null); // 过滤掉解析失败的行

    console.log(`Successfully parsed ${wordsData.length} words.`);
} catch (error) {
    console.error('Error reading or processing gptwords.json:', error);
    console.error('Please ensure gptwords.json is a valid JSON array and node has enough memory.');
    process.exit(1);
}


// 按首字母分组单词
const groupedWords = {};
wordsData.forEach(wordEntry => {
    // 假设每个 entry 是一个对象，并且有一个 'word' 字段
    // 并且 'word' 字段的值是字符串
    if (wordEntry && typeof wordEntry.word === 'string' && wordEntry.word.length > 0) {
        const firstLetter = wordEntry.word[0].toUpperCase();
        if (firstLetter >= 'A' && firstLetter <= 'Z') {
            if (!groupedWords[firstLetter]) {
                groupedWords[firstLetter] = [];
            }
            groupedWords[firstLetter].push(wordEntry);
        } else {
            // 处理非字母开头的单词（可选）
            if (!groupedWords['#']) { //  用 '#' 分组非字母开头的
                groupedWords['#'] = [];
            }
            groupedWords['#'].push(wordEntry);
        }
    }
});

// 为每个字母生成 JSON 文件和 Markdown 页面
const sidebarEntries = [];

for (const letter in groupedWords) {
    if (groupedWords.hasOwnProperty(letter)) {
        const words = groupedWords[letter];
        const jsonFileName = `words_${letter.toLowerCase()}.json`;
        const jsonFilePath = path.join(outputDir, jsonFileName);
        const mdFileName = `${letter.toLowerCase()}.md`;
        const mdFilePath = path.join(pagesOutputDir, mdFileName);

        // 写入 JSON 文件
        fs.writeFileSync(jsonFilePath, JSON.stringify(words, null, 2));
        console.log(`Generated ${jsonFilePath} with ${words.length} words.`);

        // 生成 Markdown 文件内容
        const mdContent = `---
title: 以 ${letter} 开头的单词
---

# 以 ${letter} 开头的单词

<WordList letter="${letter.toLowerCase()}" />
`;
        fs.writeFileSync(mdFilePath, mdContent);
        console.log(`Generated ${mdFilePath}.`);
        sidebarEntries.push(`/words/${mdFileName}`);
    }
}

// 对 sidebarEntries 按字母排序 (a-z, 然后 #)
sidebarEntries.sort((a, b) => {
    const nameA = path.basename(a, '.md');
    const nameB = path.basename(b, '.md');
    if (nameA === '#') return 1;
    if (nameB === '#') return -1;
    return nameA.localeCompare(nameB);
});


console.log('\\nSuccessfully processed all words.');
console.log('\\nUpdate your docs/.vuepress/config.js with the following sidebar entries for words:');
console.log('Example for sidebar in config.js:');
const sidebarConfig = `{
  text: '单词列表',
  collapsible: true,
  children: [
${sidebarEntries.map(entry => `    '${entry}',`).join('\\n')}
  ]
}`;
console.log(sidebarConfig);

// 提醒用户手动创建 Vue 组件
console.log(`
重要提示:
1. 你需要在 VuePress 项目中创建一个名为 WordList.vue 的全局组件。
   例如，在 docs/.vuepress/components/WordList.vue
2. 这个组件将负责加载和显示对应字母的单词数据 (例如，从 /words/words_a.json 加载)。
3. 示例 WordList.vue 组件结构:
   <template>
     <div>
       <div v-if="loading">Loading words...</div>
       <div v-else-if="error">Error loading words.</div>
       <ul v-else>
         <li v-for="(wordData, index) in words" :key="index">
           <strong>{{ wordData.word }}</strong>: {{ wordData.explanation }}
         </li>
       </ul>
     </div>
   </template>

   <script>
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
       try {
         const response = await fetch(\`/words/words_\${this.letter}.json\`);
         if (!response.ok) {
           throw new Error(\`HTTP error! status: \${response.status}\`);
         }
         this.words = await response.json();
       } catch (e) {
         this.error = e.toString();
         console.error(\`Failed to load words for letter \${this.letter}:\`, e);
       } finally {
         this.loading = false;
       }
     }
   };
   </script>
`); 