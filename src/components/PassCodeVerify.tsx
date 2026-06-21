import { useState } from 'react';
import { KeyRound, CheckCircle, AlertTriangle, Car, MapPin, ShieldCheck, Search } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { TestRecord } from '../types';

export const PassCodeVerify = () => {
  const { verifyPassCode, markRecordReleased, alerts, updateAlertStatus } = useAppStore();
  const { speak } = useSpeech();
  const [code, setCode] = useState('');
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    record?: TestRecord;
    alreadyReleased: boolean;
  } | null>(null);

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

  const unreleasedRecords = useAppStore(s => s.records).filter(
    r => r.result === 'passed' && r.passCode && !r.released &&
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          放行码核验
        </h3>
        <div className="flex gap-2">
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
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      </div>

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

          {verifyResult.valid && verifyResult.record && verifyResult.alreadyReleased && (
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-10 h-10 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-yellow-700">⚠️ 已放行，请勿重复操作</p>
                <p className="text-base text-yellow-600">
                  {verifyResult.record.driverName}师傅（{verifyResult.record.busPlate}）已于
                  {formatTime(verifyResult.record.timestamp)}完成放行
                </p>
              </div>
            </div>
          )}

          {verifyResult.valid && verifyResult.record && !verifyResult.alreadyReleased && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-10 h-10 text-green-500 flex-shrink-0" />
                <p className="text-xl font-bold text-green-700">核验通过</p>
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
              </div>

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
            </div>
          )}
        </div>
      )}
    </div>
  );
};
