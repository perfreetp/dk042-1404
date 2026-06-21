import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Radio, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { cn } from '../lib/utils';
import type { Driver } from '../types';

interface CardReaderProps {
  onCardSuccess: () => void;
}

type BannerState =
  | { type: 'not_found'; title: string; subtitle: string }
  | { type: 'already_passed'; title: string; subtitle: string; passCode?: string }
  | { type: 'failed_pending'; title: string; subtitle: string }
  | { type: 'suspended'; title: string; subtitle: string }
  | { type: 'testing'; title: string; subtitle: string }
  | null;

export const CardReader = ({ onCardSuccess }: CardReaderProps) => {
  const selectDriverByCard = useAppStore(s => s.selectDriverByCard);
  const { speak } = useSpeech();
  const [isAnimating, setIsAnimating] = useState(false);
  const [banner, setBanner] = useState<BannerState>(null);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 6000);
    return () => clearTimeout(timer);
  }, [banner]);

  const buildBannerForAlreadyPassed = (driver: Driver, passCode?: string): BannerState => ({
    type: 'already_passed',
    title: `${driver.name}师傅今日已通过检测`,
    subtitle: passCode ? `放行码：${passCode}，可直接核验放行` : '可直接核验放行',
  });

  const handleCardSwipe = useCallback((cardNumber: string) => {
    setIsAnimating(true);
    speak('正在识别，请稍候');

    setTimeout(() => {
      const result = selectDriverByCard(cardNumber);
      setIsAnimating(false);

      switch (result.type) {
        case 'success':
          speak(`已识别${result.driver.name}师傅，请确认信息`);
          setBanner(null);
          onCardSuccess();
          break;
        case 'not_found':
          setBanner({
            type: 'not_found',
            title: '卡号无效，未找到对应司机',
            subtitle: `卡号 ${cardNumber} 不在系统中，请联系管理员`,
          });
          speak('卡号无效，未找到对应司机，请联系管理员');
          break;
        case 'already_passed':
          setBanner(buildBannerForAlreadyPassed(result.driver, result.passCode));
          speak(`${result.driver.name}师傅今日已通过检测，请直接前往核验放行`);
          break;
        case 'failed_pending':
          setBanner({
            type: 'failed_pending',
            title: `${result.driver.name}师傅待主管复核`,
            subtitle: '酒测不合格，请勿放行，等待主管复核结论',
          });
          speak(`${result.driver.name}师傅待主管复核，请勿放行`);
          break;
        case 'suspended':
          setBanner({
            type: 'suspended',
            title: `${result.driver.name}师傅被禁止上岗`,
            subtitle: '主管已标记禁止上岗，请立即拦停该车',
          });
          speak(`${result.driver.name}师傅禁止上岗，请立即拦停`);
          break;
        case 'testing':
          setBanner({
            type: 'testing',
            title: `${result.driver.name}师傅正在检测中`,
            subtitle: '请等待检测完成，无需重复操作',
          });
          speak(`${result.driver.name}师傅正在检测中，请稍候`);
          break;
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

  const bannerColors: Record<NonNullable<BannerState>['type'], string> = {
    not_found: 'bg-red-50 border-red-300',
    already_passed: 'bg-green-50 border-green-300',
    failed_pending: 'bg-orange-50 border-orange-300',
    suspended: 'bg-red-50 border-red-400',
    testing: 'bg-blue-50 border-blue-300',
  };

  const bannerTextColors: Record<NonNullable<BannerState>['type'], string> = {
    not_found: 'text-red-700',
    already_passed: 'text-green-700',
    failed_pending: 'text-orange-700',
    suspended: 'text-red-800',
    testing: 'text-blue-700',
  };

  const bannerIcons: Record<NonNullable<BannerState>['type'], typeof AlertTriangle> = {
    not_found: AlertTriangle,
    already_passed: CheckCircle,
    failed_pending: AlertTriangle,
    suspended: Shield,
    testing: Radio,
  };

  const bannerIconColors: Record<NonNullable<BannerState>['type'], string> = {
    not_found: 'text-red-500',
    already_passed: 'text-green-500',
    failed_pending: 'text-orange-500',
    suspended: 'text-red-600',
    testing: 'text-blue-500',
  };

  return (
    <div className="space-y-4">
      {banner && (
        <div
          className={cn(
            'p-5 rounded-2xl border-2',
            bannerColors[banner.type],
            banner.type === 'suspended' && 'animate-pulse'
          )}
        >
          <div className="flex items-center gap-4">
            {(() => {
              const Icon = bannerIcons[banner.type];
              return <Icon className={cn('w-14 h-14 flex-shrink-0', bannerIconColors[banner.type])} />;
            })()}
            <div className="flex-1">
              <p className={cn('text-3xl font-bold mb-1', bannerTextColors[banner.type])}>
                {banner.title}
              </p>
              <p className={cn('text-xl', bannerTextColors[banner.type], 'opacity-90')}>
                {banner.subtitle}
              </p>
              {banner.type === 'already_passed' && banner.passCode && (
                <p className="mt-2 text-2xl font-mono font-bold text-green-700">
                  放行码：{banner.passCode}
                </p>
              )}
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
