import { useState } from 'react';
import { Shield, Phone, CheckCircle, Clock, AlertTriangle, Eye, XCircle, Send } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { AlertRecord, AlertStatus, ReviewConclusion } from '../types';

type AlertFilter = 'all' | 'pending' | 'contacted' | 'reviewed';

export const SupervisorPanel = () => {
  const { alerts, updateAlertContact, updateAlertReview } = useAppStore();
  const { speak } = useSpeech();
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [contactNote, setContactNote] = useState('');
  const [reviewConclusion, setReviewConclusion] = useState<ReviewConclusion>('cleared');
  const [reviewNote, setReviewNote] = useState('');

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const contactedCount = alerts.filter(a => a.status === 'contacted').length;
  const reviewedCount = alerts.filter(a => a.status === 'reviewed').length;

  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.status === filter);

  const statusConfig: Record<AlertStatus, { bg: string; text: string; icon: typeof AlertTriangle; label: string }> = {
    pending: { bg: 'bg-orange-100 border-orange-300', text: 'text-orange-700', icon: AlertTriangle, label: '待处理' },
    contacted: { bg: 'bg-yellow-100 border-yellow-300', text: 'text-yellow-700', icon: Phone, label: '已联系' },
    reviewed: { bg: 'bg-green-100 border-green-300', text: 'text-green-700', icon: CheckCircle, label: '已复核' },
  };

  const conclusionConfig: Record<ReviewConclusion, { text: string; icon: typeof CheckCircle; color: string; bg: string }> = {
    cleared: { text: '复核通过', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
    suspended: { text: '禁止上岗', icon: XCircle, color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  };

  const handleSetExpanded = (alert: AlertRecord | null) => {
    setSelectedAlert(alert);
    if (alert) {
      setContactNote(alert.contactNote || '');
      setReviewConclusion(alert.reviewConclusion || 'cleared');
      setReviewNote(alert.reviewNote || '');
    }
  };

  const handleMarkContacted = (alertId: string) => {
    if (!contactNote.trim()) {
      speak('请先填写联系备注');
      return;
    }
    updateAlertContact(alertId, contactNote.trim());
    speak('已记录联系信息，等待复核结论');
    const updated = alerts.find(a => a.id === alertId);
    if (updated) {
      handleSetExpanded({ ...updated, status: 'contacted', contactNote: contactNote.trim() });
    }
  };

  const handleMarkReviewed = (alertId: string) => {
    if (!reviewNote.trim()) {
      speak('请先填写复核备注');
      return;
    }
    const disposal = updateAlertReview(alertId, reviewConclusion, reviewNote.trim());
    speak(
      reviewConclusion === 'cleared'
        ? '复核通过，已同步保安台允许放行'
        : '已禁止上岗，已同步保安台拦停该车'
    );
    const updated = alerts.find(a => a.id === alertId);
    if (updated) {
      handleSetExpanded({
        ...updated,
        status: 'reviewed',
        reviewConclusion,
        reviewNote: reviewNote.trim(),
        disposalRecordId: disposal?.id,
      });
    }
  };

  return (
    <div className="w-[480px] bg-white border-l-2 border-gray-200 flex flex-col overflow-hidden">
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusIcon className={cn("w-5 h-5", config.text)} />
                    <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full", config.bg, config.text)}>
                      {config.label}
                    </span>
                    {alert.status === 'reviewed' && alert.reviewConclusion && (
                      <span className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded-full border",
                        conclusionConfig[alert.reviewConclusion].bg,
                        conclusionConfig[alert.reviewConclusion].color
                      )}>
                        {conclusionConfig[alert.reviewConclusion].text}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSetExpanded(isExpanded ? null : alert)}
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
                  <div className="border-t border-gray-200 pt-3 mt-2 space-y-3">
                    <div className="bg-white rounded-lg p-3 text-sm space-y-1">
                      <p className="text-gray-600">
                        <span className="font-bold">酒精含量：</span>
                        <span className="font-mono font-bold text-red-600">{alert.alcoholLevel.toFixed(1)} mg/100ml</span>
                      </p>
                      {alert.contactedAt && (
                        <p className="text-gray-600">
                          <span className="font-bold">联系时间：</span>{formatTime(alert.contactedAt)}
                        </p>
                      )}
                      {alert.contactNote && (
                        <p className="text-gray-600">
                          <span className="font-bold">联系备注：</span>
                          <span className="text-gray-800">{alert.contactNote}</span>
                        </p>
                      )}
                      {alert.reviewedAt && (
                        <p className="text-gray-600">
                          <span className="font-bold">复核时间：</span>{formatTime(alert.reviewedAt)}
                        </p>
                      )}
                      {alert.reviewNote && (
                        <p className="text-gray-600">
                          <span className="font-bold">复核备注：</span>
                          <span className="text-gray-800">{alert.reviewNote}</span>
                        </p>
                      )}
                      {alert.disposalRecordId && (
                        <p className="text-gray-500 text-xs font-mono">
                          <span className="font-bold">处置记录编号：</span>{alert.disposalRecordId}
                        </p>
                      )}
                    </div>

                    {alert.status === 'pending' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">联系备注 *</label>
                        <textarea
                          value={isExpanded ? contactNote : ''}
                          onChange={(e) => setContactNote(e.target.value)}
                          rows={2}
                          placeholder="例：已电话联系司机，其表示昨晚少量饮酒，已要求其到值班室面谈"
                          className="w-full p-3 border-2 border-gray-300 rounded-lg text-base focus:border-yellow-500 focus:outline-none resize-none"
                        />
                        <button
                          onClick={() => handleMarkContacted(alert.id)}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 active:scale-95 transition-all text-base font-bold"
                        >
                          <Phone className="w-5 h-5" />
                          标记已联系
                        </button>
                      </div>
                    )}

                    {alert.status === 'contacted' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">复核结论 *</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['cleared', 'suspended'] as ReviewConclusion[]).map(conclusion => {
                            const cc = conclusionConfig[conclusion];
                            const CIcon = cc.icon;
                            return (
                              <button
                                key={conclusion}
                                onClick={() => setReviewConclusion(conclusion)}
                                className={cn(
                                  'flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-base font-bold transition-all',
                                  reviewConclusion === conclusion
                                    ? `${cc.bg} ${cc.color} ring-2 ring-offset-1 ring-blue-400 scale-[1.02]`
                                    : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                                )}
                              >
                                <CIcon className="w-5 h-5" />
                                {cc.text}
                              </button>
                            );
                          })}
                        </div>

                        <label className="block text-sm font-bold text-gray-700 mt-1">复核备注 *</label>
                        <textarea
                          value={isExpanded ? reviewNote : ''}
                          onChange={(e) => setReviewNote(e.target.value)}
                          rows={2}
                          placeholder="例：复测结果正常，已对司机进行安全教育，准许上岗"
                          className="w-full p-3 border-2 border-gray-300 rounded-lg text-base focus:border-green-500 focus:outline-none resize-none"
                        />

                        <button
                          onClick={() => handleMarkReviewed(alert.id)}
                          className={cn(
                            'w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white active:scale-95 transition-all text-base font-bold',
                            reviewConclusion === 'cleared'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          )}
                        >
                          <Send className="w-5 h-5" />
                          提交复核结论
                        </button>
                      </div>
                    )}

                    {alert.status === 'reviewed' && (
                      <div className={cn(
                        'flex items-center justify-center gap-2 py-3 rounded-lg border-2',
                        conclusionConfig[alert.reviewConclusion || 'cleared'].bg,
                        conclusionConfig[alert.reviewConclusion || 'cleared'].color
                      )}>
                        {(() => {
                          const cc = conclusionConfig[alert.reviewConclusion || 'cleared'];
                          const CIcon = cc.icon;
                          return (
                            <>
                              <CIcon className="w-5 h-5" />
                              <span className="text-base font-bold">
                                {cc.text} - 已同步保安管理台
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    )}
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
