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
    { word: "panda", translation: "熊猫", example: "The panda is eating bamboo.", phonetic: "/ˈpændə/" },
    { word: "tiger", translation: "老虎", example: "The tiger is very strong.", phonetic: "/ˈtaɪɡər/" },
    { word: "rabbit", translation: "兔子", example: "The rabbit has long ears.", phonetic: "/ˈræbɪt/" },
    { word: "monkey", translation: "猴子", example: "The monkey likes bananas.", phonetic: "/ˈmʌŋki/" },
    { word: "elephant", translation: "大象", example: "The elephant has a long nose.", phonetic: "/ˈelɪfənt/" }
  ],
  'Food (食物)': [
    { word: "hamburger", translation: "汉堡包", example: "I want to eat a hamburger.", phonetic: "/ˈhæmbɜːɡər/" },
    { word: "apple", translation: "苹果", example: "An apple a day keeps the doctor away.", phonetic: "/ˈæpl/" },
    { word: "milk", translation: "牛奶", example: "I drink milk every morning.", phonetic: "/mɪlk/" },
    { word: "cake", translation: "蛋糕", example: "Happy birthday! Here is your cake.", phonetic: "/keɪk/" },
    { word: "rice", translation: "米饭", example: "We eat rice for dinner.", phonetic: "/raɪs/" }
  ],
  'Family (家庭)': [
    { word: "mother", translation: "妈妈", example: "My mother loves me.", phonetic: "/ˈmʌðər/" },
    { word: "father", translation: "爸爸", example: "My father is working.", phonetic: "/ˈfɑːðər/" },
    { word: "sister", translation: "姐妹", example: "I play with my sister.", phonetic: "/ˈsɪstər/" },
    { word: "brother", translation: "兄弟", example: "My brother is tall.", phonetic: "/ˈbrʌðər/" },
    { word: "baby", translation: "婴儿", example: "The baby is sleeping.", phonetic: "/ˈbeɪbi/" }
  ],
  'School (学校)': [
    { word: "teacher", translation: "老师", example: "My teacher is very kind.", phonetic: "/ˈtiːtʃər/" },
    { word: "book", translation: "书", example: "I read a book every day.", phonetic: "/bʊk/" },
    { word: "pencil", translation: "铅笔", example: "I write with a pencil.", phonetic: "/ˈpensl/" },
    { word: "schoolbag", translation: "书包", example: "My schoolbag is blue.", phonetic: "/ˈskuːlbæɡ/" },
    { word: "desk", translation: "课桌", example: "My desk is clean.", phonetic: "/desk/" }
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
  const prompt = `Generate 5 English vocabulary words from the Chinese Primary School English curriculum (PEP / Ren Jiao Ban) related to the topic "${topic}". 
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