import { useEffect } from 'react';
import { AlertTriangle, User, Shield, ArrowLeft, Volume2, Phone } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';

interface ResultFailProps {
  onBack: () => void;
  onConfirm: () => void;
}

export const ResultFail = ({ onBack, onConfirm }: ResultFailProps) => {
  const { currentDriver, confirmRelease, resetDriverStatus } = useAppStore();
  const { speak } = useSpeech();

  useEffect(() => {
    if (currentDriver) {
      speak(`${currentDriver.name}师傅，请到值班室复核，请配合保安引导`);
    }
  }, [currentDriver, speak]);

  const handleRepeatSpeech = () => {
    if (currentDriver) {
      speak(`${currentDriver.name}师傅，请到值班室复核，不要紧张，保安会引导您`);
    }
  };

  const handleConfirm = () => {
    if (currentDriver) {
      resetDriverStatus(currentDriver.id);
    }
    confirmRelease();
    onConfirm();
  };

  const handleCallSecurity = () => {
    speak('正在呼叫保安，请稍候');
  };

  if (!currentDriver) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-b from-orange-50 to-white">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-2xl font-bold text-gray-700"
      >
        <ArrowLeft className="w-10 h-10" />
        返回
      </button>

      <div className="text-center mb-12">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-orange-400 rounded-full animate-ping opacity-50" />
          <AlertTriangle className="w-40 h-40 text-orange-500 relative z-10" />
        </div>
        <h1 className="text-7xl font-bold text-orange-600 mb-6">
          请到值班室复核
        </h1>
        <p className="text-3xl text-gray-600">
          检测时间：{formatTime(Date.now())}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-3xl w-full border-4 border-orange-200">
        <div className="flex items-center gap-8 mb-10 p-8 bg-orange-50 rounded-2xl">
          <img
            src={currentDriver.avatar}
            alt={currentDriver.name}
            className="w-36 h-36 rounded-full border-4 border-orange-300"
          />
          <div>
            <div className="flex items-center gap-3 mb-3">
              <User className="w-10 h-10 text-orange-600" />
              <h2 className="text-5xl font-bold text-gray-800">
                {currentDriver.name} 师傅
              </h2>
            </div>
            <p className="text-3xl text-gray-600 mb-2">
              车牌：{currentDriver.busPlate}
            </p>
            <p className="text-2xl text-gray-500">
              线路：{currentDriver.route}
            </p>
          </div>
        </div>

        <div className="space-y-6 mb-10">
          <div className="flex items-start gap-6 p-8 bg-blue-50 rounded-2xl">
            <Shield className="w-12 h-12 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-3xl font-bold text-blue-700 mb-3">
                重要提示
              </p>
              <p className="text-2xl text-gray-700 leading-relaxed">
                请您不要紧张，保安同志会引导您到值班室进行进一步复核。
                为了您和孩子们的安全，请您配合工作。
              </p>
            </div>
          </div>

          <div className="flex items-start gap-6 p-8 bg-gray-50 rounded-2xl">
            <Phone className="w-12 h-12 text-gray-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-2xl font-bold text-gray-700 mb-3">
                如需帮助
              </p>
              <p className="text-2xl text-gray-600">
                请点击下方按钮呼叫保安，或直接向门口的保安同志求助。
              </p>
            </div>
          </div>
        </div>

        <div className="text-center p-8 bg-red-50 rounded-2xl border-2 border-red-200 mb-10">
          <p className="text-3xl font-bold text-red-600">
            ⚠️ 检测结果已自动记录并推送至安全主管
          </p>
          <p className="text-xl text-red-500 mt-2">
            （注：屏幕不显示具体数值，保护您的隐私）
          </p>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={handleRepeatSpeech}
            className="flex items-center gap-4 px-12 py-6 bg-blue-500 text-white rounded-2xl shadow-lg hover:bg-blue-600 hover:shadow-xl active:scale-95 transition-all"
          >
            <Volume2 className="w-12 h-12" />
            <span className="text-3xl font-bold">重复播报</span>
          </button>

          <button
            onClick={handleCallSecurity}
            className="flex items-center gap-4 px-12 py-6 bg-orange-500 text-white rounded-2xl shadow-lg hover:bg-orange-600 hover:shadow-xl active:scale-95 transition-all"
          >
            <Phone className="w-12 h-12" />
            <span className="text-3xl font-bold">呼叫保安</span>
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-4 px-16 py-6 bg-gray-700 text-white rounded-2xl shadow-lg hover:bg-gray-800 hover:shadow-xl active:scale-95 transition-all"
          >
            <Shield className="w-12 h-12" />
            <span className="text-3xl font-bold">我知道了</span>
          </button>
        </div>
      </div>

      <p className="mt-10 text-2xl text-gray-500 text-center max-w-2xl">
        感谢您的理解与配合。校车安全，人人有责。
        请稍候，保安同志正在赶来。
      </p>
    </div>
  );
};
