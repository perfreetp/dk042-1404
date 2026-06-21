import { useState } from 'react';
import { KeyRound, CheckCircle, AlertTriangle, Car, MapPin, ShieldCheck, Search, QrCode, Camera, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { TestRecord } from '../types';

export const PassCodeVerify = () => {
  const { verifyPassCode, markRecordReleased, records } = useAppStore();
  const { speak } = useSpeech();
  const [code, setCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    record?: TestRecord;
    alreadyReleased: boolean;
  } | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleVerify = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const result = verifyPassCode(trimmed);
    setVerifyResult(result);

    if (result.valid && result.record) {
      if (result.alreadyReleased) {
        speak(`放行码${trimmed}已核验过，该司机已放行，请勿重复放行`);
      } else {
        speak(`放行码${trimmed}核验成功，${result.record.driverName}师傅，${result.record.busPlate}`);
      }
    } else {
      speak(`放行码${trimmed}无效，请检查后重新输入`);
    }
  };

  const handleConfirmRelease = () => {
    if (!verifyResult?.record) return;
    markRecordReleased(verifyResult.record.id);
    speak(`${verifyResult.record.driverName}师傅已确认放行`);
    setVerifyResult({ ...verifyResult, alreadyReleased: true });
  };

  const handleReset = () => {
    setCode('');
    setVerifyResult(null);
  };

  const handleQuickFill = (passCode: string) => {
    setCode(passCode);
    setVerifyResult(null);
  };

  const todayPassedRecords = records.filter(
    r => r.result === 'passed' && r.passCode &&
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  );
  const unreleasedRecords = todayPassedRecords.filter(r => !r.released);

  const simulateScanQR = () => {
    const availableRecords = todayPassedRecords.slice(0, 5);
    if (availableRecords.length === 0) {
      speak('今日暂无通过记录可扫描');
      return;
    }
    const randomRecord = availableRecords[Math.floor(Math.random() * availableRecords.length)];
    const qrJson = JSON.stringify({
      passCode: randomRecord.passCode,
      driverId: randomRecord.driverId,
      driverName: randomRecord.driverName,
      busPlate: randomRecord.busPlate,
    });

    setTimeout(() => {
      try {
        const parsed = JSON.parse(qrJson);
        if (parsed.passCode) {
          setCode(parsed.passCode);
          setShowScanner(false);
          setVerifyResult(null);
          speak(`已扫描放行码${parsed.passCode}，请确认核验`);
        }
      } catch {
        speak('二维码内容无法识别');
      }
    }, 1500);
  };

  const simulateScanFromClipboard = () => {
    const unreleased = unreleasedRecords[0];
    if (!unreleased) {
      speak('今日暂无待放行记录');
      return;
    }
    setCode(unreleased.passCode!);
    setShowScanner(false);
    setVerifyResult(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          放行码核验
        </h3>

        <div className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setVerifyResult(null); }}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="输入6位放行码"
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 text-xl font-mono font-bold text-center tracking-widest focus:border-blue-400 focus:outline-none"
            />
            <button
              onClick={handleVerify}
              className="px-5 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all"
              title="核验放行码"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 active:scale-95 transition-all flex items-center gap-1.5"
            title="扫描放行码二维码"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>
      </div>

      {showScanner && (
        <div className="rounded-2xl border-2 border-purple-300 bg-purple-50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-purple-700 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              扫码识别放行码
            </h4>
            <button onClick={() => setShowScanner(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
            <div className="text-center text-white relative z-10">
              <QrCode className="w-16 h-16 mx-auto mb-2 text-purple-300" />
              <p className="text-lg font-bold">摄像头识别中...</p>
              <p className="text-sm text-purple-200 mt-1">请将二维码对准扫描框</p>
            </div>
            <div className="absolute inset-4 border-2 border-purple-400/60 rounded-lg" />
            <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-purple-400 animate-pulse shadow-[0_0_10px_#a855f7]" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={simulateScanQR}
              className="py-2.5 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 active:scale-95 transition-all text-sm"
            >
              模拟扫描（随机）
            </button>
            <button
              onClick={simulateScanFromClipboard}
              className="py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 active:scale-95 transition-all text-sm"
            >
              扫描最近生成
            </button>
          </div>
        </div>
      )}

      {unreleasedRecords.length > 0 && (
        <div>
          <p className="text-sm text-gray-500 mb-2">待放行（点击快速填入）：</p>
          <div className="flex flex-wrap gap-2">
            {unreleasedRecords.map(r => (
              <button
                key={r.id}
                onClick={() => handleQuickFill(r.passCode!)}
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-mono font-bold text-blue-600 hover:bg-blue-100 active:scale-95 transition-all"
              >
                {r.passCode} ({r.driverName})
              </button>
            ))}
          </div>
        </div>
      )}

      {verifyResult && (
        <div className={cn(
          'rounded-xl border-2 p-4',
          verifyResult.valid
            ? verifyResult.alreadyReleased
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'
            : 'bg-red-50 border-red-300'
        )}>
          {!verifyResult.valid && (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-red-700">放行码无效</p>
                <p className="text-base text-red-600">未找到对应记录，请检查放行码是否正确</p>
              </div>
            </div>
          )}

          {verifyResult.valid && verifyResult.record && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {verifyResult.alreadyReleased ? (
                  <AlertTriangle className="w-10 h-10 text-yellow-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
                )}
                <p className={cn(
                  'text-xl font-bold',
                  verifyResult.alreadyReleased ? 'text-yellow-700' : 'text-green-700'
                )}>
                  {verifyResult.alreadyReleased ? '⚠️ 已放行，请勿重复操作' : '核验通过'}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-800">{verifyResult.record.driverName} 师傅</span>
                </div>
                <div className="flex items-center gap-2 text-base text-gray-600">
                  <Car className="w-5 h-5 text-green-600" />
                  <span className="font-bold">{verifyResult.record.busPlate}</span>
                </div>
                <div className="flex items-center gap-2 text-base text-gray-600">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{verifyResult.record.route}</span>
                </div>
                <div className="text-sm text-gray-500">
                  检测时间：{formatTime(verifyResult.record.timestamp)}
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">放行码：</span>
                  <span className="font-mono font-bold text-blue-600">{verifyResult.record.passCode}</span>
                </div>
                {verifyResult.record.released && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-yellow-700 font-bold">
                  放行时间：{formatTime(verifyResult.record.releasedAt || verifyResult.record.timestamp)}
                  </div>
                )}
              </div>

              {!verifyResult.alreadyReleased && (
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmRelease}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 active:scale-95 transition-all text-lg"
                  >
                    <ShieldCheck className="w-6 h-6" />
                    确认放行
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-lg"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
