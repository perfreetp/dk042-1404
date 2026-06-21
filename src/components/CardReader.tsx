import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Radio, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { cn } from '../lib/utils';

interface CardReaderProps {
  onCardSuccess: () => void;
}

export const CardReader = ({ onCardSuccess }: CardReaderProps) => {
  const selectDriverByCard = useAppStore(s => s.selectDriverByCard);
  const { speak } = useSpeech();
  const [isAnimating, setIsAnimating] = useState(false);
  const [errorBanner, setErrorBanner] = useState<{ title: string; subtitle: string; type: 'not_found' | 'already_tested' } | null>(null);

  useEffect(() => {
    if (!errorBanner) return;
    const timer = setTimeout(() => setErrorBanner(null), 4000);
    return () => clearTimeout(timer);
  }, [errorBanner]);

  const handleCardSwipe = useCallback((cardNumber: string) => {
    setIsAnimating(true);
    speak('正在识别，请稍候');

    setTimeout(() => {
      const result = selectDriverByCard(cardNumber);
      setIsAnimating(false);

      if (result.type === 'success') {
        speak(`已识别${result.driver.name}师傅，请确认信息`);
        onCardSuccess();
      } else if (result.type === 'not_found') {
        setErrorBanner({
          title: '卡号无效，未找到对应司机',
          subtitle: `卡号 ${cardNumber} 不在系统中，请联系管理员`,
          type: 'not_found',
        });
        speak('卡号无效，未找到对应司机，请联系管理员');
      } else {
        const statusText = result.driver.status === 'passed' ? '已通过检测' :
                           result.driver.status === 'failed' ? '待复核' : '正在检测中';
        setErrorBanner({
          title: `${result.driver.name}师傅${statusText}`,
          subtitle: '该司机今日已完成检测，无需重复操作',
          type: 'already_tested',
        });
        speak(`${result.driver.name}师傅${statusText}，无需重复检测`);
      }
    }, 800);
  }, [selectDriverByCard, speak, onCardSuccess]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.startsWith('DRV')) {
        handleCardSwipe(e.key);
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [handleCardSwipe]);

  const simulateCardSwipe = () => {
    const demoCards = ['DRV001', 'DRV002', 'DRV003', 'DRV004', 'DRV005', 'DRV006'];
    const randomCard = demoCards[Math.floor(Math.random() * demoCards.length)];
    handleCardSwipe(randomCard);
  };

  const simulateInvalidCard = () => {
    handleCardSwipe('DRV999');
  };

  return (
    <div className="space-y-4">
      {errorBanner && (
        <div
          className={cn(
            'p-6 rounded-2xl border-2 animate-pulse',
            errorBanner.type === 'not_found'
              ? 'bg-red-50 border-red-300'
              : 'bg-orange-50 border-orange-300'
          )}
        >
          <div className="flex items-center gap-4">
            <AlertTriangle className={cn(
              'w-14 h-14 flex-shrink-0',
              errorBanner.type === 'not_found' ? 'text-red-500' : 'text-orange-500'
            )} />
            <div>
              <p className={cn(
                'text-3xl font-bold mb-1',
                errorBanner.type === 'not_found' ? 'text-red-700' : 'text-orange-700'
              )}>
                {errorBanner.title}
              </p>
              <p className={cn(
                'text-xl',
                errorBanner.type === 'not_found' ? 'text-red-600' : 'text-orange-600'
              )}>
                {errorBanner.subtitle}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={simulateCardSwipe}
          className={cn(
            'flex-1 flex flex-col items-center justify-center p-6 rounded-2xl',
            'bg-gradient-to-br from-blue-50 to-blue-100',
            'border-4 border-dashed border-blue-300',
            'hover:border-blue-500 hover:from-blue-100 hover:to-blue-200',
            'transition-all duration-300',
            'active:scale-95',
            isAnimating && 'animate-pulse border-blue-500'
          )}
        >
          <div className="relative mb-3">
            {isAnimating ? (
              <Radio className="w-16 h-16 text-blue-500 animate-ping" />
            ) : (
              <CreditCard className="w-16 h-16 text-blue-500" />
            )}
          </div>
          <span className="text-2xl font-bold text-blue-700 mb-1">
            {isAnimating ? '正在识别...' : '刷驾驶员卡'}
          </span>
          <span className="text-lg text-blue-600">
            请将驾驶员卡靠近感应区
          </span>
        </button>

        <button
          onClick={simulateInvalidCard}
          className='flex flex-col items-center justify-center p-6 rounded-2xl bg-gray-50 border-4 border-dashed border-gray-300 hover:border-gray-400 transition-all active:scale-95'
          title="模拟无效卡号"
        >
          <AlertTriangle className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-lg text-gray-500">模拟无效卡</span>
        </button>
      </div>
    </div>
  );
};
