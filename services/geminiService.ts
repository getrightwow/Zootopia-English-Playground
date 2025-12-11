import { GoogleGenAI, Type, Modality } from "@google/genai";
import { WordData, TtsAccent } from "../types";

// Helper to safely get API Key without crashing
const getApiKey = () => {
  try {
    // Check various locations where env might be injected
    const key = process?.env?.API_KEY || (window as any).process?.env?.API_KEY;
    return key && key.length > 0 ? key : null;
  } catch (e) {
    return null;
  }
};

const FALLBACK_VOCABULARY: Record<string, WordData[]> = {
  'Animals (动物)': [
    { word: "panda", translation: "熊猫", example: "The panda loves bamboo.", phonetic: "/ˈpændə/" },
    { word: "tiger", translation: "老虎", example: "The tiger is big and yellow.", phonetic: "/ˈtaɪɡər/" },
    { word: "elephant", translation: "大象", example: "The elephant has a long nose.", phonetic: "/ˈelɪfənt/" },
    { word: "monkey", translation: "猴子", example: "The monkey likes bananas.", phonetic: "/ˈmʌŋki/" },
    { word: "rabbit", translation: "兔子", example: "The rabbit has long ears.", phonetic: "/ˈræbɪt/" },
    { word: "cat", translation: "猫", example: "The cat is sleeping on the sofa.", phonetic: "/kæt/" },
    { word: "dog", translation: "狗", example: "My dog is very friendly.", phonetic: "/dɒɡ/" },
    { word: "duck", translation: "鸭子", example: "The duck can swim.", phonetic: "/dʌk/" },
    { word: "pig", translation: "猪", example: "The pig is pink and fat.", phonetic: "/pɪɡ/" },
    { word: "bird", translation: "鸟", example: "The bird flies in the sky.", phonetic: "/bɜːrd/" },
    { word: "bear", translation: "熊", example: "The bear is brown.", phonetic: "/beər/" },
    { word: "giraffe", translation: "长颈鹿", example: "The giraffe is very tall.", phonetic: "/dʒɪˈrɑːf/" },
    { word: "lion", translation: "狮子", example: "The lion is the king.", phonetic: "/ˈlaɪən/" },
    { word: "cow", translation: "奶牛", example: "The cow gives us milk.", phonetic: "/kaʊ/" },
    { word: "sheep", translation: "绵羊", example: "The sheep has white wool.", phonetic: "/ʃiːp/" },
    { word: "horse", translation: "马", example: "The horse runs fast.", phonetic: "/hɔːrs/" },
    { word: "hen", translation: "母鸡", example: "The hen lays eggs.", phonetic: "/hen/" },
    { word: "zebra", translation: "斑马", example: "The zebra is black and white.", phonetic: "/ˈziːbrə/" },
    { word: "mouse", translation: "老鼠", example: "The mouse is small.", phonetic: "/maʊs/" },
    { word: "kangaroo", translation: "袋鼠", example: "The kangaroo jumps high.", phonetic: "/ˌkæŋɡəˈruː/" }
  ],
  'Food (食物)': [
    { word: "rice", translation: "米饭", example: "I eat rice every day.", phonetic: "/raɪs/" },
    { word: "noodles", translation: "面条", example: "I like beef noodles.", phonetic: "/ˈnuːdlz/" },
    { word: "bread", translation: "面包", example: "I have bread for breakfast.", phonetic: "/bred/" },
    { word: "milk", translation: "牛奶", example: "Drink some milk.", phonetic: "/mɪlk/" },
    { word: "egg", translation: "鸡蛋", example: "I want a fried egg.", phonetic: "/eɡ/" },
    { word: "water", translation: "水", example: "Please drink some water.", phonetic: "/ˈwɔːtər/" },
    { word: "fish", translation: "鱼肉", example: "My cat loves fish.", phonetic: "/fɪʃ/" },
    { word: "chicken", translation: "鸡肉", example: "Fried chicken is yummy.", phonetic: "/ˈtʃɪkɪn/" },
    { word: "beef", translation: "牛肉", example: "I like beef.", phonetic: "/biːf/" },
    { word: "cake", translation: "蛋糕", example: "Happy birthday! Have some cake.", phonetic: "/keɪk/" },
    { word: "hamburger", translation: "汉堡包", example: "I want a hamburger.", phonetic: "/ˈhæmbɜːɡər/" },
    { word: "hot dog", translation: "热狗", example: "The hot dog is delicious.", phonetic: "/hɒt dɒɡ/" },
    { word: "sandwich", translation: "三明治", example: "I made a sandwich.", phonetic: "/ˈsænwɪtʃ/" },
    { word: "apple", translation: "苹果", example: "An apple is red.", phonetic: "/ˈæpl/" },
    { word: "banana", translation: "香蕉", example: "Monkeys love bananas.", phonetic: "/bəˈnɑːnə/" },
    { word: "orange", translation: "橙子", example: "This is an orange.", phonetic: "/ˈɔːrɪndʒ/" },
    { word: "grape", translation: "葡萄", example: "The grapes are purple.", phonetic: "/ɡreɪp/" },
    { word: "watermelon", translation: "西瓜", example: "Watermelon is sweet.", phonetic: "/ˈwɔːtərmelən/" },
    { word: "ice cream", translation: "冰淇淋", example: "I love chocolate ice cream.", phonetic: "/ˌaɪs ˈkriːm/" },
    { word: "juice", translation: "果汁", example: "I want some orange juice.", phonetic: "/dʒuːs/" }
  ],
  'Family (家庭)': [
    { word: "family", translation: "家庭", example: "I love my family.", phonetic: "/ˈfæməli/" },
    { word: "father", translation: "爸爸", example: "My father is a doctor.", phonetic: "/ˈfɑːðər/" },
    { word: "mother", translation: "妈妈", example: "My mother is beautiful.", phonetic: "/ˈmʌðər/" },
    { word: "parents", translation: "父母", example: "My parents are happy.", phonetic: "/ˈperənts/" },
    { word: "brother", translation: "兄弟", example: "This is my brother.", phonetic: "/ˈbrʌðər/" },
    { word: "sister", translation: "姐妹", example: "My sister is cute.", phonetic: "/ˈsɪstər/" },
    { word: "grandfather", translation: "祖父/外祖父", example: "My grandfather is old.", phonetic: "/ˈɡrænfɑːðər/" },
    { word: "grandmother", translation: "祖母/外祖母", example: "My grandmother makes good food.", phonetic: "/ˈɡrænmʌðər/" },
    { word: "uncle", translation: "叔叔/舅舅", example: "My uncle is tall.", phonetic: "/ˈʌŋkl/" },
    { word: "aunt", translation: "阿姨/姑姑", example: "My aunt is nice.", phonetic: "/ænt/" },
    { word: "cousin", translation: "堂(表)兄弟姐妹", example: "He is my cousin.", phonetic: "/ˈkʌzn/" },
    { word: "baby", translation: "婴儿", example: "The baby is crying.", phonetic: "/ˈbeɪbi/" },
    { word: "man", translation: "男人", example: "He is a strong man.", phonetic: "/mæn/" },
    { word: "woman", translation: "女人", example: "She is a kind woman.", phonetic: "/ˈwʊmən/" },
    { word: "boy", translation: "男孩", example: "The boy is running.", phonetic: "/bɔɪ/" },
    { word: "girl", translation: "女孩", example: "The girl is singing.", phonetic: "/ɡɜːrl/" },
    { word: "grandpa", translation: "爷爷/外公", example: "My grandpa is kind.", phonetic: "/ˈɡrænpɑː/" },
    { word: "grandma", translation: "奶奶/外婆", example: "My grandma tells stories.", phonetic: "/ˈɡrænmɑː/" },
    { word: "son", translation: "儿子", example: "He is my son.", phonetic: "/sʌn/" },
    { word: "daughter", translation: "女儿", example: "She is my daughter.", phonetic: "/ˈdɔːtər/" }
  ],
  'School (学校)': [
    { word: "school", translation: "学校", example: "I go to school by bus.", phonetic: "/skuːl/" },
    { word: "teacher", translation: "老师", example: "Miss White is my teacher.", phonetic: "/ˈtiːtʃər/" },
    { word: "student", translation: "学生", example: "I am a student.", phonetic: "/ˈstjuːdnt/" },
    { word: "classmate", translation: "同班同学", example: "He is my classmate.", phonetic: "/ˈklɑːsmeɪt/" },
    { word: "classroom", translation: "教室", example: "My classroom is big.", phonetic: "/ˈklɑːsruːm/" },
    { word: "library", translation: "图书馆", example: "Be quiet in the library.", phonetic: "/ˈlaɪbrəri/" },
    { word: "playground", translation: "操场", example: "We play on the playground.", phonetic: "/ˈpleɪɡraʊnd/" },
    { word: "book", translation: "书", example: "Open your book.", phonetic: "/bʊk/" },
    { word: "bag", translation: "包/书包", example: "My bag is heavy.", phonetic: "/bæɡ/" },
    { word: "pen", translation: "钢笔", example: "I have a blue pen.", phonetic: "/pen/" },
    { word: "pencil", translation: "铅笔", example: "Can I use your pencil?", phonetic: "/ˈpensl/" },
    { word: "ruler", translation: "尺子", example: "The ruler is long.", phonetic: "/ˈruːlər/" },
    { word: "eraser", translation: "橡皮", example: "I need an eraser.", phonetic: "/ɪˈreɪzər/" },
    { word: "pencil box", translation: "铅笔盒", example: "Put it in your pencil box.", phonetic: "/ˈpensl bɒks/" },
    { word: "desk", translation: "课桌", example: "Clean your desk.", phonetic: "/desk/" },
    { word: "chair", translation: "椅子", example: "Sit on the chair.", phonetic: "/tʃeər/" },
    { word: "computer", translation: "电脑", example: "We have a computer.", phonetic: "/kəmˈpjuːtər/" },
    { word: "blackboard", translation: "黑板", example: "Look at the blackboard.", phonetic: "/ˈblækbɔːrd/" },
    { word: "gym", translation: "体育馆", example: "We play in the gym.", phonetic: "/dʒɪm/" },
    { word: "map", translation: "地图", example: "Look at the map.", phonetic: "/mæp/" }
  ],
  'Colors (颜色)': [
    { word: "red", translation: "红色", example: "The apple is red.", phonetic: "/red/" },
    { word: "blue", translation: "蓝色", example: "The sky is blue.", phonetic: "/bluː/" },
    { word: "yellow", translation: "黄色", example: "The banana is yellow.", phonetic: "/ˈjeləʊ/" },
    { word: "green", translation: "绿色", example: "The grass is green.", phonetic: "/ɡriːn/" },
    { word: "orange", translation: "橙色", example: "The orange is orange.", phonetic: "/ˈɔːrɪndʒ/" },
    { word: "purple", translation: "紫色", example: "The grapes are purple.", phonetic: "/ˈpɜːrpl/" },
    { word: "pink", translation: "粉色", example: "She likes pink.", phonetic: "/pɪŋk/" },
    { word: "brown", translation: "棕色", example: "The bear is brown.", phonetic: "/braʊn/" },
    { word: "black", translation: "黑色", example: "The cat is black.", phonetic: "/blæk/" },
    { word: "white", translation: "白色", example: "The snow is white.", phonetic: "/waɪt/" },
    { word: "gray", translation: "灰色", example: "The elephant is gray.", phonetic: "/ɡreɪ/" },
    { word: "colour", translation: "颜色", example: "What colour is it?", phonetic: "/ˈkʌlər/" },
    { word: "gold", translation: "金色", example: "The ring is gold.", phonetic: "/ɡəʊld/" },
    { word: "silver", translation: "银色", example: "The spoon is silver.", phonetic: "/ˈsɪlvər/" },
    { word: "violet", translation: "紫罗兰色", example: "The flower is violet.", phonetic: "/ˈvaɪələt/" },
    { word: "colorful", translation: "多彩的", example: "The bird is colorful.", phonetic: "/ˈkʌlərfəl/" },
    { word: "bright", translation: "明亮的", example: "The sun is bright.", phonetic: "/braɪt/" },
    { word: "dark", translation: "暗的/深色的", example: "It is dark at night.", phonetic: "/dɑːrk/" },
    { word: "light blue", translation: "浅蓝色", example: "The sky is light blue.", phonetic: "/ˌlaɪt ˈbluː/" },
    { word: "rainbow", translation: "彩虹", example: "I see a rainbow.", phonetic: "/ˈreɪnbəʊ/" }
  ],
  'Body (身体)': [
    { word: "body", translation: "身体", example: "Shake your body.", phonetic: "/ˈbɒdi/" },
    { word: "head", translation: "头", example: "Touch your head.", phonetic: "/hed/" },
    { word: "hair", translation: "头发", example: "She has long hair.", phonetic: "/heər/" },
    { word: "face", translation: "脸", example: "Wash your face.", phonetic: "/feɪs/" },
    { word: "eye", translation: "眼睛", example: "Close your eyes.", phonetic: "/aɪ/" },
    { word: "ear", translation: "耳朵", example: "Touch your ears.", phonetic: "/ɪər/" },
    { word: "nose", translation: "鼻子", example: "Touch your nose.", phonetic: "/nəʊz/" },
    { word: "mouth", translation: "嘴巴", example: "Open your mouth.", phonetic: "/maʊθ/" },
    { word: "tooth", translation: "牙齿", example: "Brush your teeth.", phonetic: "/tuːθ/" },
    { word: "arm", translation: "胳膊", example: "Wave your arms.", phonetic: "/ɑːrm/" },
    { word: "hand", translation: "手", example: "Clap your hands.", phonetic: "/hænd/" },
    { word: "finger", translation: "手指", example: "I have ten fingers.", phonetic: "/ˈfɪŋɡər/" },
    { word: "leg", translation: "腿", example: "My legs are long.", phonetic: "/leɡ/" },
    { word: "foot", translation: "脚", example: "Stamp your foot.", phonetic: "/fʊt/" },
    { word: "shoulder", translation: "肩膀", example: "Touch your shoulder.", phonetic: "/ˈʃəʊldər/" },
    { word: "knee", translation: "膝盖", example: "Bend your knees.", phonetic: "/niː/" },
    { word: "toe", translation: "脚趾", example: "Wiggle your toes.", phonetic: "/təʊ/" },
    { word: "neck", translation: "脖子", example: "My neck is long.", phonetic: "/nek/" },
    { word: "stomach", translation: "胃/肚子", example: "My stomach is full.", phonetic: "/ˈstʌmək/" },
    { word: "back", translation: "背部", example: "This is my back.", phonetic: "/bæk/" }
  ],
  'Actions (动作)': [
    { word: "run", translation: "跑", example: "I can run fast.", phonetic: "/rʌn/" },
    { word: "jump", translation: "跳", example: "Rabbits can jump.", phonetic: "/dʒʌmp/" },
    { word: "walk", translation: "走", example: "Let's walk to school.", phonetic: "/wɔːk/" },
    { word: "swim", translation: "游泳", example: "I like to swim in summer.", phonetic: "/swɪm/" },
    { word: "fly", translation: "飞", example: "Birds can fly.", phonetic: "/flaɪ/" },
    { word: "dance", translation: "跳舞", example: "She can dance well.", phonetic: "/dɑːns/" },
    { word: "sing", translation: "唱歌", example: "Let's sing a song.", phonetic: "/sɪŋ/" },
    { word: "eat", translation: "吃", example: "I eat breakfast at 7.", phonetic: "/iːt/" },
    { word: "drink", translation: "喝", example: "Drink some water.", phonetic: "/drɪŋk/" },
    { word: "sleep", translation: "睡觉", example: "I sleep in my bed.", phonetic: "/sliːp/" },
    { word: "play", translation: "玩", example: "I play football.", phonetic: "/pleɪ/" },
    { word: "watch", translation: "看", example: "I watch TV.", phonetic: "/wɒtʃ/" },
    { word: "read", translation: "读", example: "I read books.", phonetic: "/riːd/" },
    { word: "write", translation: "写", example: "I write my name.", phonetic: "/raɪt/" },
    { word: "draw", translation: "画", example: "I can draw a tree.", phonetic: "/drɔː/" },
    { word: "cook", translation: "做饭", example: "My dad can cook.", phonetic: "/kʊk/" },
    { word: "clean", translation: "打扫", example: "Clean the room.", phonetic: "/kliːn/" },
    { word: "wash", translation: "洗", example: "Wash your hands.", phonetic: "/wɒʃ/" },
    { word: "open", translation: "打开", example: "Open the door.", phonetic: "/ˈəʊpən/" },
    { word: "close", translation: "关闭", example: "Close the window.", phonetic: "/kləʊz/" }
  ],
  'Nature (自然)': [
    { word: "sky", translation: "天空", example: "The sky is blue.", phonetic: "/skaɪ/" },
    { word: "sun", translation: "太阳", example: "The sun is hot.", phonetic: "/sʌn/" },
    { word: "cloud", translation: "云", example: "Look at the white cloud.", phonetic: "/klaʊd/" },
    { word: "wind", translation: "风", example: "The wind is blowing.", phonetic: "/wɪnd/" },
    { word: "rain", translation: "雨", example: "I like the rain.", phonetic: "/reɪn/" },
    { word: "snow", translation: "雪", example: "Do you like snow?", phonetic: "/snəʊ/" },
    { word: "star", translation: "星星", example: "The stars are beautiful.", phonetic: "/stɑːr/" },
    { word: "moon", translation: "月亮", example: "The moon is round.", phonetic: "/muːn/" },
    { word: "tree", translation: "树", example: "The tree is green.", phonetic: "/triː/" },
    { word: "flower", translation: "花", example: "This is a red flower.", phonetic: "/ˈflaʊər/" },
    { word: "grass", translation: "草", example: "Don't walk on the grass.", phonetic: "/ɡrɑːs/" },
    { word: "river", translation: "河流", example: "The river is long.", phonetic: "/ˈrɪvər/" },
    { word: "lake", translation: "湖", example: "There is a duck in the lake.", phonetic: "/leɪk/" },
    { word: "mountain", translation: "山", example: "Let's climb the mountain.", phonetic: "/ˈmaʊntɪn/" },
    { word: "park", translation: "公园", example: "Let's go to the park.", phonetic: "/pɑːrk/" },
    { word: "forest", translation: "森林", example: "Tigers live in the forest.", phonetic: "/ˈfɔːrɪst/" },
    { word: "sea", translation: "大海", example: "The sea is deep.", phonetic: "/siː/" },
    { word: "beach", translation: "沙滩", example: "Let's go to the beach.", phonetic: "/biːtʃ/" },
    { word: "stone", translation: "石头", example: "The stone is hard.", phonetic: "/stəʊn/" },
    { word: "fire", translation: "火", example: "The fire is hot.", phonetic: "/ˈfaɪər/" }
  ]
};

const DEFAULT_FALLBACK: WordData[] = [
    { word: "hello", translation: "你好", example: "Hello! How are you?", phonetic: "/həˈləʊ/" },
    { word: "friend", translation: "朋友", example: "You are my best friend.", phonetic: "/frend/" },
    { word: "happy", translation: "快乐", example: "I am very happy today.", phonetic: "/ˈhæpi/" }
];

/**
 * Generates a list of Primary School vocabulary words based on a topic.
 */
export const generateVocabulary = async (topic: string): Promise<WordData[]> => {
  const apiKey = getApiKey();
  
  // Immediate fallback if no key is present to prevent hanging
  if (!apiKey) {
    console.warn("No API Key found. Using fallback data for demo.");
    return FALLBACK_VOCABULARY[topic] || DEFAULT_FALLBACK;
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Generate 20 English vocabulary words from the Chinese Primary School English curriculum (PEP / Ren Jiao Ban) related to the topic "${topic}". 
  For each word, provide:
  1. The word itself (simple, suitable for primary students).
  2. A concise Chinese translation.
  3. A simple English example sentence that highlights the meaning of the word.
  4. The IPA phonetic transcription.
  
  Ensure the words are strictly suitable for children learning English (ages 6-12).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              example: { type: Type.STRING },
              phonetic: { type: Type.STRING },
            },
            required: ["word", "translation", "example"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as WordData[];
    }
    return FALLBACK_VOCABULARY[topic] || DEFAULT_FALLBACK;
  } catch (error) {
    console.error("Error generating vocabulary:", error);
    return FALLBACK_VOCABULARY[topic] || DEFAULT_FALLBACK;
  }
};

/**
 * Generates raw PCM audio data for a word using Gemini TTS.
 */
const generateAudio = async (text: string, accent: TtsAccent): Promise<Uint8Array | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const promptText = accent === TtsAccent.UK 
      ? `Say the following word clearly with a British accent suitable for children: ${text}`
      : `Say the following word clearly with an American accent suitable for children: ${text}`;

    const voiceName = accent === TtsAccent.UK ? 'Puck' : 'Kore';

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return null;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
};

/**
 * Plays raw PCM audio data (1 channel, 24kHz, Int16).
 */
const playRawAudio = async (audioData: Uint8Array) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 24000 });
    
    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    
    const dataInt16 = new Int16Array(audioData.buffer);
    const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    
    source.onended = () => {
      audioContext.close();
    };
    
    source.start(0);
  } catch (e) {
    console.error("Failed to play raw audio:", e);
  }
};

/**
 * Main function to play text-to-speech. 
 * Tries Gemini first, falls back to Browser SpeechSynthesis if no key or error.
 */
export const playTextToSpeech = async (text: string, accent: TtsAccent) => {
    let played = false;
    const apiKey = getApiKey();

    // 1. Try Gemini API if Key exists
    if (apiKey) {
        try {
            const audioData = await generateAudio(text, accent);
            if (audioData) {
                await playRawAudio(audioData);
                played = true;
            }
        } catch (e) {
            console.warn("Gemini TTS failed, attempting browser fallback.", e);
        }
    }

    // 2. Fallback to Browser SpeechSynthesis
    if (!played) {
        console.log("Using Browser TTS Fallback");
        if ('speechSynthesis' in window) {
            // Cancel any current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8; // Slower for kids
            
            // Attempt to set accent
            utterance.lang = accent === TtsAccent.UK ? 'en-GB' : 'en-US';
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.error("Browser does not support TTS.");
        }
    }
};

/**
 * Grades the pronunciation.
 */
export const gradePronunciation = async (targetWord: string, spokenText: string): Promise<{ score: number; feedback: string }> => {
  const apiKey = getApiKey();
  
  // Robust Fallback Grading for Demo
  if (!apiKey) {
      const cleanTarget = targetWord.toLowerCase().trim();
      const cleanSpoken = spokenText.toLowerCase().trim();
      const isCorrect = cleanSpoken.includes(cleanTarget);
      
      return {
          score: isCorrect ? 100 : 40,
          feedback: isCorrect ? "非常好！完全正确！(演示模式)" : "再试一次，注意发音哦。(演示模式)"
      };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
    I am an English teacher for primary school students. 
    Target word: "${targetWord}"
    Student said (transcribed): "${spokenText}"
    
    Task: Compare the phonetics and spelling similarity.
    1. Give a score from 0 to 100 based on how close the spoken text is to the target word.
    2. Give a 1-sentence simple and encouraging feedback in Chinese suitable for a child.
    
    Output JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            feedback: { type: Type.STRING },
          },
          required: ["score", "feedback"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return { score: 0, feedback: "无法评分，请重试。" };
  } catch (error) {
    console.error("Error grading:", error);
    return { score: 0, feedback: "评分服务暂时不可用。" };
  }
};
