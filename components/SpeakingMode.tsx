import React, { useState, useRef, useEffect } from 'react';
import { WordData, TtsAccent } from '../types';
import { Button } from './Button';
import { gradePronunciation, playTextToSpeech } from '../services/geminiService';

interface SpeakingModeProps {
  word: WordData;
}

interface FeedbackTier {
  label: string;
  color: string;
  borderColor: string;
  emoji: string;
  animation: string;
}

export const SpeakingMode: React.FC<SpeakingModeProps> = ({ word }) => {
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [grade, setGrade] = useState<{ score: number; feedback: string } | null>(null);
  const [grading, setGrading] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Cleanup on unmount or word change
  useEffect(() => {
    // Abort any ongoing recognition when word changes to prevent errors
    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }
    
    // Reset state
    setSpokenText('');
    setGrade(null);
    setGrading(false);
    setIsListening(false);

    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }
    };
  }, [word]);

  const getFeedbackTier = (score: number): FeedbackTier => {
    if (score >= 98) return { label: 'Perfect!', color: 'bg-purple-100 text-purple-600', borderColor: 'border-purple-400', emoji: '🏆', animation: 'animate-bounce' };
    if (score >= 90) return { label: 'Fantastic!', color: 'bg-pink-100 text-pink-600', borderColor: 'border-pink-400', emoji: '🤩', animation: 'animate-pulse' };
    if (score >= 85) return { label: 'Excellent!', color: 'bg-blue-100 text-blue-600', borderColor: 'border-blue-400', emoji: '🌟', animation: 'animate-pulse' };
    if (score >= 80) return { label: 'Brilliant!', color: 'bg-teal-100 text-teal-600', borderColor: 'border-teal-400', emoji: '✨', animation: 'animate-bounce' };
    if (score >= 60) return { label: 'Wonderful!', color: 'bg-green-100 text-green-600', borderColor: 'border-green-400', emoji: '👍', animation: '' };
    return { label: 'Keep Trying!', color: 'bg-orange-100 text-orange-600', borderColor: 'border-orange-400', emoji: '💪', animation: '' };
  };

  const toggleListening = () => {
    // Stop if already listening
    if (isListening) {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Browser doesn't support speech recognition.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    // Abort existing before creating new
    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }
    
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
      // Ignore 'aborted' error as it is often intentional (user stopped or switched words)
      if (event.error !== 'aborted') {
          console.error("Speech recognition error", event.error);
      }
      setIsListening(false);
    };

    recognitionRef.current.onend = () => setIsListening(false);

    try {
        recognitionRef.current.start();
    } catch (e) {
        console.error("Failed to start recognition", e);
        setIsListening(false);
    }
  };

  const handleGrading = async (text: string) => {
    setGrading(true);
    const result = await gradePronunciation(word.word, text);
    setGrade(result);
    setGrading(false);

    // Audio Feedback Logic
    const tier = getFeedbackTier(result.score);
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop previous audio
        const utterance = new SpeechSynthesisUtterance(tier.label); // Say "Excellent!", "Perfect!", etc.
        utterance.lang = 'en-US';
        utterance.rate = 1.2; // A bit faster and energetic
        utterance.pitch = 1.3; // Higher pitch sounds happier
        utterance.volume = 1.0;
        window.speechSynthesis.speak(utterance);
    }
  };

  const playDemo = async () => {
    await playTextToSpeech(word.word, TtsAccent.US);
  };

  const tier = grade ? getFeedbackTier(grade.score) : null;

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
            w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 relative
            ${isListening ? 'bg-red-500 scale-110 shadow-red-300 shadow-lg' : 'bg-blue-500 shadow-blue-300 shadow-lg hover:scale-105'}
        `} onClick={toggleListening}>
            <span className="text-5xl">{isListening ? '🛑' : '🎙️'}</span>
            {isListening && (
                <span className="absolute -bottom-8 text-red-500 font-bold animate-pulse">
                    Listening...
                </span>
            )}
        </div>
        <p className="text-sm text-gray-400">
            {isListening ? '点击红色按钮停止' : '点击麦克风开始跟读'}
        </p>
      </div>

      {spokenText && (
          <div className="bg-gray-50 p-3 rounded-xl mb-4 text-center border border-gray-100">
              <p className="text-xs text-gray-400 uppercase mb-1">识别结果</p>
              <p className="font-bold text-gray-700 text-lg">"{spokenText}"</p>
          </div>
      )}

      {grading && <div className="text-center text-blue-500 font-bold animate-pulse">🦊 朱迪警官正在评分...</div>}

      {grade && tier && (
        <div className={`p-6 rounded-2xl text-center border-b-4 transition-all duration-500 transform scale-100 ${tier.color} ${tier.borderColor}`}>
            
            {/* Visual Badge for Feedback Word */}
            <div className={`text-4xl font-black italic drop-shadow-sm mb-2 ${tier.animation}`}>
                {tier.label}
            </div>
            
            <div className="text-6xl mb-2 filter drop-shadow-md">
                {tier.emoji}
            </div>

            <div className="text-2xl font-bold mb-2 opacity-90">
                得分: {grade.score}
            </div>
            <div className="bg-white/40 p-2 rounded-lg text-sm font-medium">
                {grade.feedback}
            </div>
        </div>
      )}
    </div>
  );
};