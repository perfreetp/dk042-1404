import { useEffect } from 'react';
import { CheckCircle, Car, MapPin, QrCode, Printer, ArrowLeft, Volume2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { QRCodeSVG } from 'qrcode.react';
import { formatTime } from '../utils/formatTime';

interface ResultPassProps {
  onBack: () => void;
  onConfirm: () => void;
}

export const ResultPass = ({ onBack, onConfirm }: ResultPassProps) => {
  const { currentDriver, currentPassCode, confirmRelease } = useAppStore();
  const { speak } = useSpeech();

  useEffect(() => {
    if (currentDriver) {
      speak(`${currentDriver.name}师傅，检测通过，请驾车进场`);
    }
  }, [currentDriver, speak]);

  const handlePrint = () => {
    speak('正在打印放行单');
    window.print();
  };

  const handleRepeatSpeech = () => {
    if (currentDriver) {
      speak(`${currentDriver.name}师傅，检测通过，请驾车进场。车牌号${currentDriver.busPlate}，线路${currentDriver.route}`);
    }
  };

  const handleConfirm = () => {
    confirmRelease();
    onConfirm();
  };

  if (!currentDriver || !currentPassCode) {
    return null;
  }

  const qrContent = JSON.stringify({
    passCode: currentPassCode,
    driverId: currentDriver.id,
    driverName: currentDriver.name,
    busPlate: currentDriver.busPlate,
    timestamp: Date.now(),
  });

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-b from-green-50 to-white">
      <button
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-3 px-6 py-4 bg-white rounded-2xl shadow-lg hover:shadow-xl active:scale-95 transition-all text-2xl font-bold text-gray-700"
      >
        <ArrowLeft className="w-10 h-10" />
        返回
      </button>

      <div className="text-center mb-8">
        <div className="relative inline-block mb-6">
          <CheckCircle className="w-36 h-36 text-green-500 animate-bounce" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl">✓</span>
          </div>
        </div>
        <h1 className="text-7xl font-bold text-green-600 mb-4">通过可进场</h1>
        <p className="text-3xl text-gray-600">
          检测时间：{formatTime(Date.now())}
        </p>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-4xl w-full border-4 border-green-200">
        <div className="flex items-start justify-between gap-12">
          <div className="flex-1">
            <div className="flex items-center gap-6 mb-8">
              <img
                src={currentDriver.avatar}
                alt={currentDriver.name}
                className="w-32 h-32 rounded-full border-4 border-green-300"
              />
              <div>
                <h2 className="text-5xl font-bold text-gray-800 mb-2">
                  {currentDriver.name} 师傅
                </h2>
                <p className="text-2xl text-gray-500">驾驶员</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-6 p-6 bg-green-50 rounded-2xl">
                <Car className="w-12 h-12 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-2xl text-gray-600 mb-1">车牌号码</p>
                  <p className="text-5xl font-bold text-green-700">{currentDriver.busPlate}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 p-6 bg-blue-50 rounded-2xl">
                <MapPin className="w-12 h-12 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-2xl text-gray-600 mb-1">行驶线路</p>
                  <p className="text-3xl font-bold text-blue-700">{currentDriver.route}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-200 mb-4">
              <QRCodeSVG
                value={qrContent}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="text-center">
              <p className="text-2xl text-gray-600 mb-2">放行码</p>
              <p className="text-5xl font-mono font-bold text-blue-600 tracking-wider">
                {currentPassCode}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6">
          <button
            onClick={handleRepeatSpeech}
            className="flex items-center gap-4 px-10 py-6 bg-blue-500 text-white rounded-2xl shadow-lg hover:bg-blue-600 hover:shadow-xl active:scale-95 transition-all"
          >
            <Volume2 className="w-12 h-12" />
            <span className="text-3xl font-bold">重复播报</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-4 px-10 py-6 bg-gray-100 text-gray-700 rounded-2xl shadow-lg hover:bg-gray-200 hover:shadow-xl active:scale-95 transition-all"
          >
            <Printer className="w-12 h-12" />
            <span className="text-3xl font-bold">打印放行单</span>
          </button>

          <button
            onClick={handleConfirm}
            className="flex items-center gap-4 px-16 py-6 bg-green-500 text-white rounded-2xl shadow-lg hover:bg-green-600 hover:shadow-xl active:scale-95 transition-all"
          >
            <CheckCircle className="w-12 h-12" />
            <span className="text-3xl font-bold">确认放行</span>
          </button>
        </div>
      </div>

      <div className="mt-10 flex items-center gap-4 text-2xl text-gray-500">
        <QrCode className="w-10 h-10" />
        <span>保安可扫描放行码或输入放行码确认进场</span>
      </div>
    </div>
  );
};
