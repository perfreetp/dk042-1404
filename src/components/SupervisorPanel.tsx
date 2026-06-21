import { useState } from 'react';
import { Shield, Phone, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { AlertRecord, AlertStatus } from '../types';

type AlertFilter = 'all' | 'pending' | 'contacted' | 'reviewed';

export const SupervisorPanel = () => {
  const { alerts, updateAlertStatus } = useAppStore();
  const { speak } = useSpeech();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const contactedCount = alerts.filter(a => a.status === 'contacted').length;
  const reviewedCount = alerts.filter(a => a.status === 'reviewed').length;

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.status === filter);

  const handleStatusChange = (alertId: string, newStatus: AlertStatus) => {
    updateAlertStatus(alertId, newStatus);
    const labels: Record<AlertStatus, string> = {
      pending: '标记为待处理',
      contacted: '标记为已联系',
      reviewed: '标记为已复核',
    };
    speak(labels[newStatus]);
    if (selectedAlert?.id === alertId) {
      setSelectedAlert(null);
    }
  };

  const statusConfig: Record<AlertStatus, { bg: string; text: string; icon: typeof AlertTriangle; label: string }> = {
    pending: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-700', icon: AlertTriangle, label: '待处理' },
    contacted: { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-700', icon: Phone, label: '已联系' },
    reviewed: { bg: 'bg-green-100 border-green-300', text: 'text-green-700', icon: CheckCircle, label: '已复核' },
  };

  return (
    <div className="w-[420px] bg-white border-l-2 border-gray-200 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800">安全主管告警</h2>
        </div>
        <p className="text-base text-gray-500 mt-1">处理不合格酒测的后续跟进</p>
      </div>

      <div className="grid grid-cols-3 gap-3 p-5 pb-3">
        <button
          onClick={() => setFilter('pending')}
          className={cn(
            'rounded-xl p-3 text-center border-2 transition-all',
            filter === 'pending' ? 'border-orange-400 ring-2 ring-orange-200' : 'border-transparent',
            pendingCount > 0 ? 'bg-orange-50' : 'bg-gray-50'
          )}
        >
          <AlertTriangle className={cn("w-6 h-6 mx-auto mb-1", pendingCount > 0 ? "text-orange-500" : "text-gray-400")} />
          <p className={cn("text-xl font-bold", pendingCount > 0 ? "text-orange-600" : "text-gray-500")}>{pendingCount}</p>
          <p className="text-xs text-gray-600">待处理</p>
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={cn(
            'rounded-xl p-3 text-center border-2 transition-all',
            filter === 'contacted' ? 'border-yellow-400 ring-2 ring-yellow-200' : 'border-transparent',
            'bg-yellow-50'
          )}
        >
          <Phone className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-yellow-600">{contactedCount}</p>
          <p className="text-xs text-gray-600">已联系</p>
        </button>
        <button
          onClick={() => setFilter('reviewed')}
          className={cn(
            'rounded-xl p-3 text-center border-2 transition-all',
            filter === 'reviewed' ? 'border-green-400 ring-2 ring-green-200' : 'border-transparent',
            'bg-green-50'
          )}
        >
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-green-600">{reviewedCount}</p>
          <p className="text-xs text-gray-600">已复核</p>
        </button>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-3">
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="text-sm text-blue-500 hover:text-blue-700 flex items-center gap-1 mb-2"
          >
            ← 查看全部告警
          </button>
        )}

        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
            <p className="text-xl font-bold text-gray-500">
              {filter === 'all' ? '暂无告警记录' : '该分类暂无告警'}
            </p>
          </div>
        ) : (
          filteredAlerts.slice().reverse().map(alert => {
            const config = statusConfig[alert.status];
            const StatusIcon = config.icon;
            const isExpanded = selectedAlert?.id === alert.id;

            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-xl border-2 p-4 transition-all',
                  config.bg,
                  isExpanded && 'ring-2 ring-blue-300'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn("w-5 h-5", config.text)} />
                    <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full", config.bg, config.text)}>
                      {config.label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedAlert(isExpanded ? null : alert)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-2">
                  <p className="text-lg font-bold text-gray-800">{alert.driverName} 师傅</p>
                  <p className="text-base text-gray-600">{alert.busPlate} · {alert.route}</p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(alert.timestamp)}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 pt-3 mt-2 space-y-2">
                    <div className="bg-white rounded-lg p-3 text-sm">
                      <p className="text-gray-600">
                        <span className="font-bold">酒精含量：</span>
                        <span className="font-mono font-bold text-red-600">{alert.alcoholLevel.toFixed(1)} mg/100ml</span>
                      </p>
                      {alert.contactedAt && (
                        <p className="text-gray-600 mt-1">
                          <span className="font-bold">联系时间：</span>{formatTime(alert.contactedAt)}
                        </p>
                      )}
                      {alert.reviewedAt && (
                        <p className="text-gray-600 mt-1">
                          <span className="font-bold">复核时间：</span>{formatTime(alert.reviewedAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {alert.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(alert.id, 'contacted')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:scale-95 transition-all text-sm font-bold"
                        >
                          <Phone className="w-4 h-4" />
                          已联系司机
                        </button>
                      )}
                      {alert.status === 'contacted' && (
                        <button
                          onClick={() => handleStatusChange(alert.id, 'reviewed')}
                          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 active:scale-95 transition-all text-sm font-bold"
                        >
                          <CheckCircle className="w-4 h-4" />
                          确认已复核
                        </button>
                      )}
                      {alert.status === 'reviewed' && (
                        <div className="flex items-center justify-center gap-2 py-2 text-green-600 text-sm font-bold">
                          <CheckCircle className="w-4 h-4" />
                          复核完成
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
