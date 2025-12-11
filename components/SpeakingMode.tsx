import React, { useState, useRef, useEffect } from 'react';
import { WordData, TtsAccent } from '../types';
import { Button } from './Button';
import { generateAudio, gradePronunciation, playRawAudio } from '../services/geminiService';

interface SpeakingModeProps {
  word: WordData;
}

export const SpeakingMode: React.FC<SpeakingModeProps> = ({ word }) => {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [grade, setGrade] = useState<{ score: number; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Reset state when word changes
    setSpokenText('');
    setGrade(null);
    setGrading(false);
    setIsListening(false);
  }, [word]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser doesn't support speech recognition.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => setIsListening(true);
    
    recognitionRef.current.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setSpokenText(text);
      setIsListening(false);
      handleGrading(text);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error(event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => setIsListening(false);

    recognitionRef.current.start();
  };

  const handleGrading = async (text: string) => {
    setGrading(true);
    const result = await gradePronunciation(word.word, text);
    setGrade(result);
    setGrading(false);
  };

  const playDemo = async () => {
    const audioData = await generateAudio(word.word, TtsAccent.US);
    if (audioData) {
        await playRawAudio(audioData);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border-4 border-blue-200">
      <div className="text-center mb-8">
         <div className="inline-block bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold mb-2">
            跟读练习
         </div>
         <h2 className="text-4xl font-extrabold text-gray-800 mb-2">{word.word}</h2>
         <p className="text-gray-400 font-mono text-xl">{word.phonetic}</p>
      </div>

      <div className="flex flex-col items-center gap-6 mb-8">
        <Button onClick={playDemo} variant="secondary" className="w-full">
            🔊 听示范发音
        </Button>
        
        <div className={`
            w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300
            ${isListening ? 'bg-red-500 scale-110 shadow-red-300 shadow-lg' : 'bg-blue-500 shadow-blue-300 shadow-lg hover:scale-105'}
        `} onClick={startListening}>
            <span className="text-5xl">{isListening ? '🛑' : '🎙️'}</span>
        </div>
        <p className="text-sm text-gray-400">
            {isListening ? '正在听...' : '点击麦克风开始跟读'}
        </p>
      </div>

      {spokenText && (
          <div className="bg-gray-100 p-4 rounded-xl mb-4 text-center">
              <p className="text-xs text-gray-500 uppercase">识别结果</p>
              <p className="font-bold text-gray-800 text-lg">"{spokenText}"</p>
          </div>
      )}

      {grading && <div className="text-center text-blue-500 font-bold animate-pulse">🦊 朱迪警官正在评分...</div>}

      {grade && (
        <div className={`p-4 rounded-xl text-center border-2 ${grade.score > 80 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <div className="text-3xl font-bold mb-1">
                {grade.score > 80 ? '🌟' : '🥕'} 得分: {grade.score}
            </div>
            <p className="text-gray-700 font-medium">{grade.feedback}</p>
        </div>
      )}
    </div>
  );
};