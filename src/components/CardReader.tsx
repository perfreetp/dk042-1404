import { useState, useEffect } from 'react';
import { CreditCard, Radio } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { cn } from '../lib/utils';

interface CardReaderProps {
  onCardDetected?: () => void;
}

export const CardReader = ({ onCardDetected }: CardReaderProps) => {
  const { selectDriverByCard, currentDriver } = useAppStore();
  const { speak } = useSpeech();
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.startsWith('DRV')) {
        handleCardSwipe(e.key);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, []);

  const handleCardSwipe = (cardNumber: string) => {
    setIsAnimating(true);
    speak('正在刷卡，请稍候');

    setTimeout(() => {
      selectDriverByCard(cardNumber);
      setIsAnimating(false);
      if (onCardDetected) {
        onCardDetected();
      }
    }, 1000);
  };

  const simulateCardSwipe = () => {
    const demoCards = ['DRV001', 'DRV002', 'DRV003', 'DRV004', 'DRV005', 'DRV006'];
    const randomCard = demoCards[Math.floor(Math.random() * demoCards.length)];
    handleCardSwipe(randomCard);
  };

  return (
    <button
      onClick={simulateCardSwipe}
      className={cn(
        'flex flex-col items-center justify-center p-8 rounded-2xl',
        'bg-gradient-to-br from-blue-50 to-blue-100',
        'border-4 border-dashed border-blue-300',
        'hover:border-blue-500 hover:from-blue-100 hover:to-blue-200',
        'transition-all duration-300',
        'active:scale-95',
        isAnimating && 'animate-pulse border-blue-500'
      )}
    >
      <div className="relative mb-4">
        {isAnimating ? (
          <Radio className="w-20 h-20 text-blue-500 animate-ping" />
        ) : (
          <CreditCard className="w-20 h-20 text-blue-500" />
        )}
        {currentDriver && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xl">✓</span>
          </div>
        )}
      </div>
      <span className="text-2xl font-bold text-blue-700 mb-2">
        {isAnimating ? '正在识别...' : '刷驾驶员卡'}
      </span>
      <span className="text-lg text-blue-600">
        请将驾驶员卡靠近感应区
      </span>
      {currentDriver && (
        <div className="mt-4 p-4 bg-white rounded-xl shadow-inner">
          <span className="text-xl font-semibold text-gray-800">
            已识别：{currentDriver.name}
          </span>
        </div>
      )}
    </button>
  );
};
