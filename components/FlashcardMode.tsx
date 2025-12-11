import React, { useState } from 'react';
import { WordData, TtsAccent } from '../types';
import { playTextToSpeech } from '../services/geminiService';
import { Button } from './Button';

interface FlashcardModeProps {
  words: WordData[];
  onNext: () => void;
  onPrev: () => void;
  currentIndex: number;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({ words, onNext, onPrev, currentIndex }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState<TtsAccent | null>(null);

  const currentWord = words[currentIndex];

  const playAudio = async (accent: TtsAccent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentWord || loadingAudio) return;

    setLoadingAudio(accent);
    try {
      await playTextToSpeech(currentWord.word, accent);
    } catch (err) {
      console.error("Audio playback failed", err);
    } finally {
      setLoadingAudio(null);
    }
  };

  if (!currentWord) return <div className="text-white text-center text-xl">加载卡片中...</div>;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto perspective-1000">
      
      {/* Card Container */}
      <div 
        className="relative w-full h-96 cursor-pointer group perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Side */}
          <div className="absolute w-full h-full bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center backface-hidden border-4 border-orange-100">
            <div className="text-xs font-bold text-orange-500 uppercase tracking-widest mb-4">小学英语单词卡</div>
            <h2 className="text-5xl font-extrabold text-gray-800 mb-2 text-center break-words">{currentWord.word}</h2>
            <p className="text-gray-400 font-mono text-lg mb-8">{currentWord.phonetic}</p>
            
            <div className="flex gap-4 mt-auto w-full">
               <Button 
                variant="primary" 
                className="flex-1 text-sm py-2"
                onClick={(e) => playAudio(TtsAccent.US, e)}
                disabled={loadingAudio === TtsAccent.US}
              >
                {loadingAudio === TtsAccent.US ? '...' : '🇺🇸 美音'}
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1 text-sm py-2"
                onClick={(e) => playAudio(TtsAccent.UK, e)}
                disabled={loadingAudio === TtsAccent.UK}
              >
                 {loadingAudio === TtsAccent.UK ? '...' : '🇬🇧 英音'}
              </Button>
            </div>
            <p className="text-gray-400 text-xs mt-4">点击卡片查看中文</p>
          </div>

          {/* Back Side */}
          <div className="absolute w-full h-full bg-orange-50 rounded-3xl shadow-xl p-8 flex flex-col items-center justify-center rotate-y-180 backface-hidden border-4 border-orange-200">
            <h3 className="text-3xl font-bold text-orange-600 mb-4">{currentWord.translation}</h3>
            
            <div className="bg-white p-4 rounded-xl shadow-inner w-full">
               <p className="text-gray-700 italic text-center text-lg leading-relaxed">
                "{currentWord.example.split(new RegExp(`(${currentWord.word})`, 'gi')).map((part, i) => (
                    part.toLowerCase() === currentWord.word.toLowerCase() 
                    ? <span key={i} className="text-blue-600 font-bold bg-blue-100 px-1 rounded">{part}</span> 
                    : part
                ))}"
              </p>
            </div>
             <p className="text-gray-400 text-xs mt-auto">点击卡片翻回</p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between w-full mt-8 gap-4">
        <Button variant="accent" onClick={onPrev} disabled={currentIndex === 0}>
          上一个
        </Button>
        <div className="flex items-center text-white font-bold text-xl drop-shadow-md">
            {currentIndex + 1} / {words.length}
        </div>
        <Button variant="accent" onClick={onNext} disabled={currentIndex === words.length - 1}>
          下一个
        </Button>
      </div>
    </div>
  );
};
