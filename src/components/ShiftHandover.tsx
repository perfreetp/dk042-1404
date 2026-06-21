import { useState, useMemo } from 'react';
import {
  ArrowLeft, Users, Shield, Clock, AlertTriangle, CheckCircle,
  User, UserCheck, FileText, Send, ChevronRight, RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { ShiftType, AlertStatus } from '../types';

interface ShiftHandoverProps {
  onBack: () => void;
}

const shiftLabels: Record<ShiftType, { label: string; icon: string; color: string }> = {
  morning: { label: '早班', icon: '🌅', color: 'text-amber-600' },
  evening: { label: '晚班', icon: '🌙', color: 'text-indigo-600' },
};

const alertStatusLabels: Record<AlertStatus, string> = {
  pending: '待处理',
  contacted: '已联系',
  reviewed: '已复核',
};

export const ShiftHandover = ({ onBack }: ShiftHandoverProps) => {
  const {
    currentShift,
    shiftHandoverRecords,
    getPendingItems,
    createShiftHandover,
    setCurrentShift,
  } = useAppStore();
  const { speak } = useSpeech();

  const [outgoingGuard, setOutgoingGuard] = useState('');
  const [incomingGuard, setIncomingGuard] = useState('');
  const [handoverNote, setHandoverNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { pendingVerify, pendingReview, suspended } = useMemo(
    () => getPendingItems(),
    [getPendingItems()]
  );

  const todayHandoverRecords = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return shiftHandoverRecords
      .filter(r => r.date === todayStr)
      .sort((a, b) => b.handoverTime - a.handoverTime);
  }, [shiftHandoverRecords]);

  const handleSelectShift = (shift: ShiftType) => {
    setCurrentShift(shift);
    speak(`已切换到${shiftLabels[shift].label}`);
  };

  const handleHandover = () => {
    if (!outgoingGuard.trim()) {
      speak('请输入交班人姓名');
      return;
    }
    if (!incomingGuard.trim()) {
      speak('请输入接班人姓名');
      return;
    }
    const record = createShiftHandover({
      outgoingGuard: outgoingGuard.trim(),
      incomingGuard: incomingGuard.trim(),
      handoverNote: handoverNote.trim(),
    });

    speak(
      `${shiftLabels[record.outgoingShift].label}${outgoingGuard}交班给${shiftLabels[record.incomingShift].label}${incomingGuard}，交接完成`
    );
    setOutgoingGuard('');
    setIncomingGuard('');
    setHandoverNote('');
  };

  const incomingShift: ShiftType = currentShift === 'morning' ? 'evening' : 'morning';

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      <div className="flex items-center justify-between px-10 py-6 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all text-lg"
          >
            <ArrowLeft className="w-6 h-6" />
            返回首页
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">交接班管理</h2>
            <p className="text-lg text-gray-500">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!currentShift ? (
            <div className="flex items-center gap-2">
              <span className="text-lg text-gray-600 font-bold">请选择班次：</span>
              {(['morning', 'evening'] as ShiftType[]).map(shift => {
                const sl = shiftLabels[shift];
                return (
                  <button
                    key={shift}
                    onClick={() => handleSelectShift(shift)}
                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-blue-100 hover:text-blue-700 active:scale-95 transition-all text-lg"
                  >
                    <span className="text-2xl">{sl.icon}</span>
                    {sl.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-lg',
                'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200'
              )}>
                <span className="text-2xl">{shiftLabels[currentShift].icon}</span>
                <span className={cn('font-bold', shiftLabels[currentShift].color)}>
                  当前：{shiftLabels[currentShift].label}
                </span>
              </div>
              <button
                onClick={() => setCurrentShift(currentShift === 'morning' ? 'evening' : 'morning')}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 active:scale-95 transition-all"
                title="切换班次"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-5 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-8 h-8 text-blue-500" />
                <span className="text-4xl font-black text-blue-700">{pendingVerify.length}</span>
              </div>
              <p className="text-xl font-bold text-blue-700">待核验放行</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-5 border-2 border-orange-200">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <span className="text-4xl font-black text-orange-700">{pendingReview.length}</span>
              </div>
              <p className="text-xl font-bold text-orange-700">待主管处理</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-5 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <Shield className="w-8 h-8 text-red-500" />
                <span className="text-4xl font-black text-red-700">{suspended.length}</span>
              </div>
              <p className="text-xl font-bold text-red-700">禁止上岗</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-5 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="w-8 h-8 text-purple-500" />
                <span className="text-4xl font-black text-purple-700">{todayHandoverRecords.length}</span>
              </div>
              <p className="text-xl font-bold text-purple-700">今日交接记录</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-blue-50">
                <h3 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6" />
                  待核验放行 ({pendingVerify.length})
                </h3>
              </div>
              <div className="p-4 max-h-72 overflow-auto space-y-2">
                {pendingVerify.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-lg">暂无待核验记录</p>
                ) : (
                  pendingVerify.map(r => (
                    <div key={r.id} className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="font-bold text-gray-800 text-lg">{r.driverName}</div>
                      <div className="text-sm text-gray-500">
                        {r.busPlate} · {r.route}
                      </div>
                      <div className="text-sm font-mono font-bold text-blue-600 mt-1">
                        放行码：{r.passCode}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-orange-50">
                <h3 className="text-xl font-bold text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  待主管处理 ({pendingReview.length})
                </h3>
              </div>
              <div className="p-4 max-h-72 overflow-auto space-y-2">
                {pendingReview.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-lg">暂无待处理告警</p>
                ) : (
                  pendingReview.map(a => (
                    <div key={a.id} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                      <div className="font-bold text-gray-800 text-lg">{a.driverName}</div>
                      <div className="text-sm text-gray-500">
                        {a.busPlate} · {a.route}
                      </div>
                      <div className="text-sm font-bold text-orange-600 mt-1">
                        状态：{alertStatusLabels[a.status]}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-red-50">
                <h3 className="text-xl font-bold text-red-700 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  禁止上岗 ({suspended.length})
                </h3>
              </div>
              <div className="p-4 max-h-72 overflow-auto space-y-2">
                {suspended.length === 0 ? (
                  <p className="text-center py-8 text-gray-400 text-lg">暂无禁岗人员</p>
                ) : (
                  suspended.map(d => (
                    <div key={d.id} className="p-3 bg-red-50 rounded-xl border border-red-200">
                      <div className="font-bold text-gray-800 text-lg">{d.name}</div>
                      <div className="text-sm text-gray-500">
                        {d.busPlate} · {d.route}
                      </div>
                      <div className="text-sm font-bold text-red-600 mt-1">
                        ⚠️ 严禁放行
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-5 flex items-center gap-2">
                <UserCheck className="w-7 h-7 text-blue-500" />
                交接确认
              </h3>

              {currentShift && (
                <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">交班班次</p>
                      <p className="text-2xl font-bold">
                        <span className="text-3xl mr-2">{shiftLabels[currentShift].icon}</span>
                        <span className={shiftLabels[currentShift].color}>
                          {shiftLabels[currentShift].label}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="w-10 h-10 text-gray-300" />
                    <div className="flex-1 text-right">
                      <p className="text-sm text-gray-500 mb-1">接班班次</p>
                      <p className="text-2xl font-bold">
                        <span className="text-3xl mr-2">{shiftLabels[incomingShift].icon}</span>
                        <span className={shiftLabels[incomingShift].color}>
                          {shiftLabels[incomingShift].label}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    交班人 *
                  </label>
                  <input
                    type="text"
                    value={outgoingGuard}
                    onChange={e => setOutgoingGuard(e.target.value)}
                    placeholder="请输入交班人姓名"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <UserCheck className="w-5 h-5" />
                    接班人 *
                  </label>
                  <input
                    type="text"
                    value={incomingGuard}
                    onChange={e => setIncomingGuard(e.target.value)}
                    placeholder="请输入接班人姓名"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-lg focus:border-blue-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-base font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  交接备注
                </label>
                <textarea
                  value={handoverNote}
                  onChange={e => setHandoverNote(e.target.value)}
                  rows={3}
                  placeholder="请输入交接注意事项，如：1号线车辆需检修、某司机身体不适等"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-lg focus:border-blue-400 focus:outline-none resize-none"
                />
              </div>

              <button
                onClick={handleHandover}
                disabled={!currentShift}
                className={cn(
                  'w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-xl transition-all shadow-lg',
                  currentShift
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                <Send className="w-7 h-7" />
                确认交接，切换至{currentShift ? shiftLabels[incomingShift].label : '下一'}班次
              </button>
            </div>

            <div className="col-span-2 bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-purple-500" />
                  今日交接记录
                </h3>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-blue-500 font-bold hover:text-blue-700"
                >
                  {showHistory ? '收起' : '展开全部'}
                </button>
              </div>
              <div className="p-4 overflow-auto" style={{ maxHeight: showHistory ? '600px' : '400px' }}>
                {todayHandoverRecords.length === 0 ? (
                  <p className="text-center py-12 text-gray-400 text-lg">今日暂无交接记录</p>
                ) : (
                  <div className="space-y-3">
                    {todayHandoverRecords.map(r => (
                      <div key={r.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{shiftLabels[r.outgoingShift].icon}</span>
                            <span className="font-bold text-gray-800">{r.outgoingGuard}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-xl">{shiftLabels[r.incomingShift].icon}</span>
                            <span className="font-bold text-gray-800">{r.incomingGuard}</span>
                          </div>
                          <span className="text-sm text-gray-500">{formatTime(r.handoverTime)}</span>
                        </div>
                        <div className="flex gap-2 text-xs font-bold flex-wrap mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            待核验 {r.snapshot.pendingVerifyCount}
                          </span>
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            待处理 {r.snapshot.pendingReviewCount}
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                            禁岗 {r.snapshot.suspendedCount}
                          </span>
                        </div>
                        {r.handoverNote && (
                          <p className="text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-100">
                            📝 {r.handoverNote}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
