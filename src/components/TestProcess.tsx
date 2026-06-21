import { useEffect } from 'react';
import { Wind, Clock, CheckCircle, ArrowLeft, Volume2 } from 'lucide-react';
import { useAlcoholTest } from '../hooks/useAlcoholTest';
import { useSpeech } from '../hooks/useSpeech';
import { cn } from '../lib/utils';

interface TestProcessProps {
  onBack: () => void;
  onComplete: () => void;
}

export const TestProcess = ({ onBack, onComplete }: TestProcessProps) => {
  const { beginTest, blowProgress, waitCountdown, testStep, currentDriver } = useAlcoholTest();
  const { speak } = useSpeech();

  useEffect(() => {
    if (testStep === 'idle' && currentDriver) {
      beginTest();
    }
  }, [testStep, currentDriver, beginTest]);

  useEffect(() => {
    if (testStep === 'result') {
      const timer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [testStep, onComplete]);

  const steps = [
    {
      key: 'blow',
      label: '开始吹气',
      icon: Wind,
      description: '请含住吹嘴，均匀吹气5秒',
    },
    {
      key: 'waiting',
      label: '等待结果',
      icon: Clock,
      description: '正在分析检测结果，请稍候',
    },
    {
      key: 'result',
      label: '通过可进场',
      icon: CheckCircle,
      description: '检测完成，查看结果',
    },
  ];

  const getStepStatus = (stepKey: string) => {
    const stepOrder = ['blow', 'waiting', 'result'];
    const currentIndex = stepOrder.indexOf(testStep);
    const stepIndex = stepOrder.indexOf(stepKey);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const handleRepeatSpeech = () => {
    if (testStep === 'blow') {
      speak('请开始吹气，保持5秒');
    } else if (testStep === 'waiting') {
      speak('正在分析结果，请稍候');
    }
  };

  if (!currentDriver) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-b from-blue-50 to-white">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-2xl font-bold text-gray-700"
      >
        <ArrowLeft className="w-10 h-10" />
        返回
      </button>

      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-6 mb-6">
          <img
            src={currentDriver.avatar}
            alt={currentDriver.name}
            className="w-32 h-32 rounded-full border-4 border-blue-400 shadow-lg"
          />
          <div className="text-left">
            <h2 className="text-5xl font-bold text-gray-800">{currentDriver.name} 师傅</h2>
            <p className="text-3xl text-gray-600 mt-2">{currentDriver.busPlate}</p>
            <p className="text-2xl text-gray-500 mt-1">{currentDriver.route}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-16 mb-16">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const StepIcon = step.icon;
          
          return (
            <div key={step.key} className="flex items-center">
              <div
                className={cn(
                  'flex flex-col items-center transition-all duration-500',
                  status === 'active' && 'scale-110'
                )}
              >
                <div
                  className={cn(
                    'w-40 h-40 rounded-full flex items-center justify-center mb-6 shadow-2xl transition-all duration-500',
                    status === 'active' && testStep === 'blow' && 'animate-pulse',
                    status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'active'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-400'
                  )}
                >
                  <StepIcon className="w-20 h-20" />
                </div>
                <h3
                  className={cn(
                    'text-4xl font-bold mb-3 transition-all',
                    status === 'completed'
                      ? 'text-green-600'
                      : status === 'active'
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  )}
                >
                  {step.label}
                </h3>
                <p
                  className={cn(
                    'text-2xl text-center max-w-xs',
                    status === 'active' ? 'text-gray-700' : 'text-gray-400'
                  )}
                >
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="w-32 h-3 mx-8 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={cn(
                      'h-full transition-all duration-1000',
                      getStepStatus(steps[index + 1].key) !== 'pending'
                        ? 'bg-green-500 w-full'
                        : 'bg-blue-500 w-0'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {testStep === 'blow' && (
        <div className="w-full max-w-2xl">
          <div className="relative h-24 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-100"
              style={{ width: `${blowProgress}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white drop-shadow-lg">
                {Math.round(blowProgress)}%
              </span>
            </div>
          </div>
          <p className="text-center text-3xl font-bold text-blue-600 mt-6 animate-pulse">
            🍺 请均匀吹气，保持 {Math.ceil((100 - blowProgress) / 20)} 秒...
          </p>
        </div>
      )}

      {testStep === 'waiting' && (
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-8">
            <div className="absolute inset-0 border-8 border-blue-200 rounded-full" />
            <div
              className="absolute inset-0 border-8 border-blue-500 rounded-full border-t-transparent animate-spin"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-bold text-blue-600">{waitCountdown}</span>
            </div>
          </div>
          <p className="text-4xl font-bold text-gray-700 animate-pulse">
            正在分析检测结果...
          </p>
        </div>
      )}

      <button
        onClick={handleRepeatSpeech}
        className="mt-12 flex items-center gap-4 px-10 py-5 bg-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all"
      >
        <Volume2 className="w-12 h-12 text-blue-500" />
        <span className="text-3xl font-bold text-gray-700">重复语音提示</span>
      </button>
    </div>
  );
};
