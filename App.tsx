import React, { useState, useEffect } from 'react';
import { AppMode, WordData, Topic } from './types';
import { generateVocabulary } from './services/geminiService';
import { FlashcardMode } from './components/FlashcardMode';
import { SpellingMode } from './components/SpellingMode';
import { SpeakingMode } from './components/SpeakingMode';
import { Button } from './components/Button';

// Zootopia-themed Primary School topics
const TOPICS: Topic[] = [
  { id: 'animals', label: 'Animals (动物)', emoji: '🐼' },
  { id: 'food', label: 'Food (食物)', emoji: '🍔' },
  { id: 'family', label: 'Family (家庭)', emoji: '👨‍👩‍👧' },
  { id: 'school', label: 'School (学校)', emoji: '🏫' },
  { id: 'colors', label: 'Colors (颜色)', emoji: '🎨' },
  { id: 'body', label: 'Body (身体)', emoji: '👀' },
  { id: 'actions', label: 'Actions (动作)', emoji: '🏃' },
  { id: 'nature', label: 'Nature (自然)', emoji: '🌳' },
];

const App: React.FC = () => {
  const [words, setWords] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<AppMode>(AppMode.FLASHCARD);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Initial load or topic change
  const loadWords = async (topicId: string) => {
    setLoading(true);
    setSelectedTopic(topicId);
    setWords([]); // Clear previous
    const newWords = await generateVocabulary(TOPICS.find(t => t.id === topicId)?.label || 'General');
    setWords(newWords);
    setCurrentIndex(0);
    setLoading(false);
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
       // Optional: Load more words automatically
       loadWords(selectedTopic || 'animals');
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 animate-pulse">
            <div className="text-6xl mb-4">🦥</div>
            <h2 className="text-2xl font-bold text-white">闪电正在查找单词...</h2>
        </div>
      );
    }

    if (!selectedTopic) {
      return (
        <div className="w-full max-w-2xl text-center">
            <h1 className="text-6xl font-black text-white drop-shadow-md mb-2 tracking-tighter">ZOOTOPIA</h1>
            <h2 className="text-3xl font-bold text-orange-100 mb-8 uppercase tracking-wider text-shadow">小学英语大本营</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOPICS.map(topic => (
                    <button 
                        key={topic.id}
                        onClick={() => loadWords(topic.id)}
                        className="bg-white hover:bg-blue-50 p-6 rounded-3xl shadow-lg border-b-8 border-blue-200 hover:border-blue-300 transition-all active:scale-95 flex items-center gap-4 text-left group"
                    >
                        <span className="text-4xl group-hover:scale-110 transition-transform">{topic.emoji}</span>
                        <div>
                            <div className="font-bold text-gray-800 text-lg">{topic.label}</div>
                            <div className="text-xs text-blue-400 font-bold uppercase">开始学习!</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      );
    }

    if (words.length === 0) return null;

    const currentWord = words[currentIndex];

    switch (mode) {
      case AppMode.FLASHCARD:
        return (
          <FlashcardMode 
            words={words} 
            currentIndex={currentIndex} 
            onNext={handleNext} 
            onPrev={handlePrev} 
          />
        );
      case AppMode.SPELLING:
        return (
          <div className="flex flex-col items-center w-full">
            <SpellingMode word={currentWord} onCorrect={handleNext} />
            <div className="mt-6 flex gap-4">
                <Button variant="accent" onClick={handlePrev} disabled={currentIndex === 0}>上一个</Button>
                <Button variant="accent" onClick={handleNext}>跳过</Button>
            </div>
          </div>
        );
      case AppMode.SPEAKING:
        return (
          <div className="flex flex-col items-center w-full">
            <SpeakingMode word={currentWord} />
            <div className="mt-6 flex gap-4">
                <Button variant="accent" onClick={handlePrev} disabled={currentIndex === 0}>上一个</Button>
                <Button variant="accent" onClick={handleNext}>下一个</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-blue-300 to-orange-200 p-4 font-sans select-none overflow-x-hidden">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between max-w-4xl mx-auto mb-6 py-2 gap-4">
            <div 
                className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelectedTopic(null)}
            >
                {/* Logo Area */}
                <div className="bg-gradient-to-tr from-blue-600 to-blue-400 text-white p-3 rounded-2xl shadow-lg border-b-4 border-blue-800">
                    <span className="text-3xl">🦊</span>
                </div>
                <div className="flex flex-col">
                    <span className="font-black text-2xl text-white drop-shadow-lg tracking-wide leading-none">疯狂动物城</span>
                    <span className="font-bold text-sm text-yellow-300 drop-shadow tracking-widest uppercase">英语学堂</span>
                </div>
            </div>
            
            {selectedTopic && words.length > 0 && (
                <div className="flex bg-white/90 rounded-2xl p-1.5 shadow-xl gap-1">
                    <button 
                        onClick={() => setMode(AppMode.FLASHCARD)}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === AppMode.FLASHCARD ? 'bg-blue-500 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        📝 单词卡
                    </button>
                    <button 
                         onClick={() => setMode(AppMode.SPELLING)}
                         className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === AppMode.SPELLING ? 'bg-green-500 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        🔤 拼写
                    </button>
                    <button 
                         onClick={() => setMode(AppMode.SPEAKING)}
                         className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${mode === AppMode.SPEAKING ? 'bg-orange-500 text-white shadow-md scale-105' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        🎤 跟读
                    </button>
                </div>
            )}
        </header>

        {/* Main Content */}
        <main className="flex flex-col items-center justify-center min-h-[65vh] max-w-4xl mx-auto w-full">
            {renderContent()}
        </main>
        
        {/* Footer */}
        <footer className="text-center text-white/70 text-xs mt-8 pb-4 font-bold tracking-widest uppercase">
            Powered by Gemini AI • 疯狂动物城英语版
        </footer>
    </div>
  );
};

export default App;