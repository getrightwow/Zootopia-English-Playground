import React, { useState, useEffect } from 'react';
import { WordData } from '../types';
import { Button } from './Button';

interface SpellingModeProps {
  word: WordData;
  onCorrect: () => void;
}

export const SpellingMode: React.FC<SpellingModeProps> = ({ word, onCorrect }) => {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    setInput('');
    setStatus('idle');
    setHintIndex(0);
  }, [word]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toLowerCase().trim() === word.word.toLowerCase()) {
      setStatus('correct');
      setTimeout(onCorrect, 1500);
    } else {
      setStatus('incorrect');
    }
  };

  const getMaskedWord = () => {
    return word.word.split('').map((char, i) => i < hintIndex ? char : '_').join(' ');
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border-4 border-green-200">
      <div className="text-center mb-6">
        <div className="text-green-600 font-bold uppercase tracking-wider mb-2">拼写大挑战</div>
        <h3 className="text-2xl font-bold text-gray-700 mb-2">{word.translation}</h3>
        <p className="text-gray-500 italic text-sm mb-4">
          "{word.example.replace(new RegExp(word.word, 'gi'), '_____')}"
        </p>
      </div>

      <div className="text-center mb-8">
        <div className="text-4xl font-mono font-bold text-blue-600 tracking-widest min-h-[3rem]">
          {getMaskedWord()}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setStatus('idle');
          }}
          className={`w-full p-4 rounded-xl border-2 text-center text-xl font-bold outline-none transition-colors
            ${status === 'correct' ? 'border-green-500 bg-green-50 text-green-700' : 
              status === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' : 
              'border-gray-300 focus:border-blue-500'}`}
          placeholder="在此输入单词..."
          autoFocus
        />
        
        <div className="flex gap-2">
            <Button 
                type="button" 
                variant="secondary" 
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 border-yellow-600"
                onClick={() => setHintIndex(prev => Math.min(prev + 1, word.word.length))}
            >
                💡 提示
            </Button>
            <Button type="submit" className="flex-[2]">
                ✅ 检查
            </Button>
        </div>
      </form>
      
      {status === 'correct' && (
        <div className="mt-4 text-center text-green-600 font-bold animate-bounce">
          🎉 太棒了！答对了！
        </div>
      )}
      {status === 'incorrect' && (
        <div className="mt-4 text-center text-red-500 font-bold">
          🦊 哎呀！再试一次吧。
        </div>
      )}
    </div>
  );
};