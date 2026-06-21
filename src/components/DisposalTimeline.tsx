import { ArrowLeft, AlertTriangle, Bell, Phone, CheckCircle, XCircle, Shield, User, Car } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { TimelineEvent, DisposalRecord } from '../types';

interface DisposalTimelineProps {
  disposalId: string;
  onBack: () => void;
}

const eventConfig: Record<TimelineEvent['type'], { icon: typeof AlertTriangle; color: string; bg: string }> = {
  test_failed: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100' },
  alert_created: { icon: Bell, color: 'text-orange-500', bg: 'bg-orange-100' },
  contacted: { icon: Phone, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  reviewed: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-100' },
  executed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
};

export const DisposalTimeline = ({ disposalId, onBack }: DisposalTimelineProps) => {
  const { disposalRecords, getDisposalTimeline } = useAppStore();
  const disposal = disposalRecords.find(d => d.id === disposalId);
  const events = getDisposalTimeline(disposalId);

  if (!disposal) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <p className="text-xl text-gray-500">未找到处置记录</p>
        <button
          onClick={onBack}
          className="mt-4 px-6 py-2 bg-[#165DFF] text-white rounded-lg hover:bg-[#0F47CC] transition-all"
        >
          返回
        </button>
      </div>
    );
  }

  const conclusionConfig = {
    cleared: { text: '复核通过', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: CheckCircle },
    suspended: { text: '禁止上岗', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: XCircle },
  };
  const conf = conclusionConfig[disposal.conclusion];
  const ConclusionIcon = conf.icon;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 p-6 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          返回
        </button>
        <h2 className="text-2xl font-bold text-gray-800">处置追踪详情</h2>
        <span className="text-xs font-mono text-gray-400 ml-auto">{disposal.id}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className={cn('p-5 rounded-xl border-2', conf.bg)}>
            <div className="flex items-start gap-4">
              <div className={cn('p-3 rounded-xl', conf.bg)}>
                <ConclusionIcon className={cn('w-8 h-8', conf.color)} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-800">{disposal.driverName}</h3>
                  <span className={cn('px-3 py-1 rounded-lg text-sm font-bold', conf.bg, conf.color)}>
                    {conf.text}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Car className="w-4 h-4" />
                    {disposal.busPlate}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {disposal.route}
                  </span>
                  <span>酒精含量：<strong className="font-mono text-red-600">{disposal.alcoholLevel.toFixed(1)} mg/100ml</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="text-lg font-bold text-gray-800 mb-4">处置时间线</h4>
            <div className="relative pl-8">
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />
              {events.map((event, idx) => {
                const eConf = eventConfig[event.type];
                const EventIcon = eConf.icon;
                return (
                  <div key={idx} className="relative mb-6 last:mb-0">
                    <div className={cn(
                      'absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white',
                      eConf.bg
                    )}>
                      <EventIcon className={cn('w-4 h-4', eConf.color)} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-bold text-gray-800">{event.title}</h5>
                        <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      {event.operator && (
                        <p className="text-xs text-gray-400">操作人：{event.operator}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {disposal.contactNote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="text-sm font-bold text-yellow-800 mb-1">联系备注</h4>
              <p className="text-sm text-yellow-700">{disposal.contactNote}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-blue-800 mb-1">复核备注</h4>
            <p className="text-sm text-blue-700">{disposal.reviewNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
