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
        .split('\n')
        .filter(line => line.trim() !== '')
        .map((line, index) => {
            try {
                return JSON.parse(line);
            } catch (parseError) {
                console.error(`Error parsing JSON on line ${index + 1}: ${line}`);
                console.error(parseError);
                return null;
            }
        })
        .filter(entry => entry !== null);

    console.log(`Successfully parsed ${wordsData.length} initial word entries.`);

    // Process each word entry to extract examples
    wordsData = wordsData.map(wordEntry => {
        if (wordEntry && typeof wordEntry.content === 'string') {
            let currentContent = wordEntry.content;
            const examples = [];
            const exampleSectionTitle = '### 列举例句';
            const exampleStartIndex = currentContent.split('\n').findIndex(line => line.trim() === exampleSectionTitle);

            if (exampleStartIndex !== -1) {
                const lines = currentContent.split('\n');
                let exampleEndIndex = lines.length;
                for (let i = exampleStartIndex + 1; i < lines.length; i++) {
                    if (lines[i].trim().startsWith('### ')) {
                        exampleEndIndex = i;
                        break;
                    }
                }

                for (let i = exampleStartIndex + 1; i < exampleEndIndex; i++) {
                    const lineContent = lines[i].trim();
                    const numMatch = lineContent.match(/^(\s*\d+\.\s+)(.*)$/); // Separate number from rest
                    
                    if (!numMatch) continue; // Not a numbered example line

                    let fullExampleText = numMatch[2].trim();
                    let sentence = fullExampleText; // Default: whole text is sentence
                    let translation = '';

                    // Patterns to identify and separate translation from sentence
                    // Ordered by likely specificity or commonness
                    const translationPatterns = [
                        { regex: /^(.*?)（(.*?)）$/, sIdx: 1, tIdx: 2 },         // Full-width parentheses
                        { regex: /^(.*?)\((.*?)\)$/, sIdx: 1, tIdx: 2 },      // Half-width parentheses
                        { regex: /^(.*?)中文：(.*?)$/, sIdx: 1, tIdx: 2 },   // "中文：" marker
                        { regex: /^(.*?)中文：\s*(.*?)$/, sIdx: 1, tIdx: 2 } // "中文：" marker with space
                    ];

                    for (const p of translationPatterns) {
                        const match = fullExampleText.match(p.regex);
                        if (match && match[p.sIdx] !== undefined && match[p.tIdx] !== undefined) {
                            const potentialSentence = match[p.sIdx].trim();
                            const potentialTranslation = match[p.tIdx].trim();
                            // Ensure that the pattern meaningfully splits the string
                            if (potentialSentence || fullExampleText.startsWith('中文：') || fullExampleText.startsWith('（') || fullExampleText.startsWith('(')) {
                                sentence = potentialSentence;
                                translation = potentialTranslation;
                                break; // Found a pattern
                            }
                        }
                    }
                    
                    // Additional cleanup: if sentence still contains "中文：" or starts with a parenthesis that wasn't caught as translation
                    const chineseMarkerIndex = sentence.indexOf('中文：');
                    if (chineseMarkerIndex !== -1) {
                         // If "中文：" is found, ensure what comes before it is kept as sentence,
                         // and what comes after (if not already in translation) becomes translation.
                        if (!translation && sentence.substring(chineseMarkerIndex + 3).trim()) {
                            translation = sentence.substring(chineseMarkerIndex + 3).trim();
                        }
                        sentence = sentence.substring(0, chineseMarkerIndex).trim();
                    }
                     // Cleanup for cases like "Sentence.（Translation）" where space before （ might be missing
                    const fullParenIndex = sentence.lastIndexOf('（');
                    if (fullParenIndex > 0 && sentence.endsWith('）') && !translation) {
                        const contentInParen = sentence.substring(fullParenIndex + 1, sentence.length - 1);
                        if (/[\u4e00-\u9fa5]/.test(contentInParen)) { // Basic Chinese character check
                            translation = contentInParen.trim();
                            sentence = sentence.substring(0, fullParenIndex).trim();
                        }
                    }
                    const halfParenIndex = sentence.lastIndexOf('(');
                     if (halfParenIndex > 0 && sentence.endsWith(')') && !translation) {
                        const contentInParen = sentence.substring(halfParenIndex + 1, sentence.length - 1);
                        if (/[\u4e00-\u9fa5]/.test(contentInParen)) { // Basic Chinese character check
                            translation = contentInParen.trim();
                            sentence = sentence.substring(0, halfParenIndex).trim();
                        }
                    }

                    sentence = sentence.replace(/\.$/, '').trim(); // Remove trailing period for cleaner voice output if desired, then re-trim.

                    if (sentence) { 
                        examples.push({ sentence, translation }); 
                    }
                }
                
                if (examples.length > 0) {
                    wordEntry.examples = examples;
                    const contentLines = currentContent.split('\n');
                    const contentBeforeExamples = contentLines.slice(0, exampleStartIndex).join('\n');
                    const contentAfterExamples = exampleEndIndex < contentLines.length ? contentLines.slice(exampleEndIndex).join('\n') : '';
                    currentContent = contentBeforeExamples.trim() + (contentAfterExamples ? '\n\n' + contentAfterExamples.trim() : '');
                }
            }

            // --- Extract Story --- 
            const storyLines = currentContent.split('\n');
            const storySectionTitle = '### 小故事';
            const storyStartIndex = storyLines.findIndex(line => line.trim() === storySectionTitle);
            let story = { english: '', chinese: '' };

            if (storyStartIndex !== -1) {
                let storyEndIndex = storyLines.length;
                for (let i = storyStartIndex + 1; i < storyLines.length; i++) {
                    if (storyLines[i].trim().startsWith('### ')) {
                        storyEndIndex = i;
                        break;
                    }
                }
                const storyBlockLines = storyLines.slice(storyStartIndex + 1, storyEndIndex).map(l => l.trim()).filter(l => l);
                
                if (storyBlockLines.length > 0) {
                    let englishStoryParts = [];
                    let chineseStoryParts = [];
                    let processingEnglish = true;
                    for (const line of storyBlockLines) {
                        if (line.startsWith('英文故事的中文翻译：') || line.startsWith('中文翻译：') || line.startsWith('中文：')) {
                            processingEnglish = false;
                            chineseStoryParts.push(line.replace(/^(英文故事的中文翻译：|中文翻译：|中文：)/, '').trim());
                            continue;
                        }
                        const fullParenMatch = line.match(/^(.*?)（(.*?)）$/);
                        const halfParenMatch = line.match(/^(.*?)\((.*?)\)$/);
                        if (processingEnglish) {
                            if (fullParenMatch && fullParenMatch[1].trim() && fullParenMatch[2].trim()){
                                englishStoryParts.push(fullParenMatch[1].trim());
                                chineseStoryParts.push(fullParenMatch[2].trim());
                                processingEnglish = false;
                            } else if (halfParenMatch && halfParenMatch[1].trim() && halfParenMatch[2].trim()){
                                englishStoryParts.push(halfParenMatch[1].trim());
                                chineseStoryParts.push(halfParenMatch[2].trim());
                                processingEnglish = false;
                            } else {
                                englishStoryParts.push(line);
                            }
                        } else {
                            chineseStoryParts.push(line);
                        }
                    }
                    story.english = englishStoryParts.join(' ').trim();
                    story.chinese = chineseStoryParts.join(' ').trim();
                    if (!story.english && story.chinese) { // Attempt to recover if English part was misidentified as Chinese
                        const parenMatch = story.chinese.match(/^(.*?)（(.*?)）$/) || story.chinese.match(/^(.*?)\((.*?)\)$/);
                        if (parenMatch && parenMatch[1].trim() && /[a-zA-Z]/.test(parenMatch[1])) { // Check if first part looks English
                            story.english = parenMatch[1].trim();
                            story.chinese = parenMatch[2].trim();
                        }
                    }
                }

                if (story.english || story.chinese) {
                    wordEntry.story = story;
                    const csLines = currentContent.split('\n'); // get fresh lines from potentially modified currentContent
                    const csStoryStartIdx = csLines.findIndex(l => l.trim() === storySectionTitle);
                    let csStoryEndIdx = csLines.length;
                     for (let i = csStoryStartIdx + 1; i < csLines.length; i++) {
                        if (csLines[i].trim().startsWith('### ')) {
                            csStoryEndIdx = i;
                            break;
                        }
                    }
                    const contentBeforeStory = csLines.slice(0, csStoryStartIdx).join('\n');
                    const contentAfterStory = csStoryEndIdx < csLines.length ? csLines.slice(csStoryEndIdx).join('\n') : '';
                    currentContent = contentBeforeStory.trim() + (contentAfterStory ? '\n\n' + contentAfterStory.trim() : '');
                }
            }
            wordEntry.content = currentContent.trim();
        }
        return wordEntry;
    });
    console.log(`Finished processing ${wordsData.length} words for examples.`);

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
2. 这个组件将负责加载和显示对应字母的单词数据。
3. 每个单词条目现在可能包含一个 'examples' 数组，格式为: [{ sentence: "...", translation: "..." }]
4. WordList.vue 也需要更新以渲染这些例句，并为英文句子应用 PlayableText 组件。
5. 示例 WordList.vue 组件结构 (部分，需要适配 examples):
   <template>
     <div>
       <!-- ... existing loading/error handling ... -->
       <ul v-else>
         <li v-for="(wordData, index) in words" :key="index">
           <div>
             <strong class="word-term">{{ wordData.word }}</strong>
             <button @click="speakWord(wordData.word)" class="play-audio-button">喇叭</button>
           </div>
           <div class="word-explanation" v-html="renderMarkdown(wordData.content)"></div>
           <!-- New section for examples -->
           <div v-if="wordData.examples && wordData.examples.length > 0" class="example-sentences">
             <h4>例句:</h4>
             <ul>
               <li v-for="(example, exIndex) in wordData.examples" :key="exIndex">
                 <PlayableText :text="example.sentence" />
                 <span v-if="example.translation"> ({{ example.translation }})</span>
               </li>
             </ul>
           </div>
         </li>
       </ul>
     </div>
   </template>
   // ... (script part should also be adapted if not already handling PlayableText correctly) ...
`);