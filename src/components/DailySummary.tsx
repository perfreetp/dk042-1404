import { useState, useMemo } from 'react';
import { ArrowLeft, Download, CheckCircle, AlertTriangle, Car, Route, Users, Clock, Shield, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import type { TestRecord, ReviewConclusion } from '../types';

interface DailySummaryProps {
  onBack: () => void;
}

type GroupBy = 'route' | 'plate';

export const DailySummary = ({ onBack }: DailySummaryProps) => {
  const { records, alerts, exportTodayLedger, drivers } = useAppStore();
  const { speak } = useSpeech();
  const [groupBy, setGroupBy] = useState<GroupBy>('route');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const todayRecords = useMemo(() => {
    const today = new Date().toDateString();
    return records.filter(r => new Date(r.timestamp).toDateString() === today);
  }, [records]);

  const stats = useMemo(() => {
    const passed = todayRecords.filter(r => r.result === 'passed');
    const failed = todayRecords.filter(r => r.result === 'failed');
    const released = passed.filter(r => r.released);
    const unreleased = passed.filter(r => !r.released);
    return {
      total: todayRecords.length,
      passed,
      passedCount: passed.length,
      failedCount: failed.length,
      releasedCount: released.length,
      unreleasedCount: unreleased.length,
    };
  }, [todayRecords]);

  const groupedRecords = useMemo(() => {
    const groups = new Map<string, TestRecord[]>();
    for (const record of todayRecords) {
      const key = groupBy === 'route' ? record.route : record.busPlate;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(record);
    }
    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length);
  }, [todayRecords, groupBy]);

  const getAlertForRecord = (record: TestRecord) => {
    return alerts.find(a =>
      a.driverId === record.driverId &&
      new Date(a.timestamp).toDateString() === new Date(record.timestamp).toDateString()
    );
  };

  const getDriverSuspended = (driverId: string) => {
    return drivers.find(d => d.id === driverId)?.status === 'suspended';
  };

  const recordConclusion = (record: TestRecord): { text: string; color: string; bg: string } | null => {
    const alert = getAlertForRecord(record);
    if (record.result === 'passed') {
      if (record.released) return { text: '已放行', color: 'text-green-700', bg: 'bg-green-100' };
      return { text: '待放行', color: 'text-blue-700', bg: 'bg-blue-100' };
    }
    if (!alert) return { text: '待复核', color: 'text-orange-700', bg: 'bg-orange-100' };
    if (alert.status === 'pending') return { text: '待处理', color: 'text-orange-700', bg: 'bg-orange-100' };
    if (alert.status === 'contacted') return { text: '已联系', color: 'text-yellow-700', bg: 'bg-yellow-100' };
    if (alert.status === 'reviewed' && alert.reviewConclusion === 'cleared')
      return { text: '复核通过', color: 'text-green-700', bg: 'bg-green-100' };
    if (alert.status === 'reviewed' && alert.reviewConclusion === 'suspended')
      return { text: '禁止放行', color: 'text-red-700', bg: 'bg-red-100' };
    return null;
  };

  const handleExport = () => {
    exportTodayLedger();
    speak('已导出今日台账');
  };

  const statCards = [
    {
      label: '通过检测',
      value: stats.passedCount,
      icon: CheckCircle,
      color: 'green',
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-700',
      iconColor: 'text-green-500',
    },
    {
      label: '待复核',
      value: stats.failedCount,
      icon: AlertTriangle,
      color: 'orange',
      bg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      border: 'border-orange-200',
      text: 'text-orange-700',
      iconColor: 'text-orange-500',
    },
    {
      label: '已放行',
      value: stats.releasedCount,
      icon: ShieldCheck,
      color: 'emerald',
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      iconColor: 'text-emerald-500',
    },
    {
      label: '未放行',
      value: stats.unreleasedCount,
      icon: Clock,
      color: 'blue',
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-700',
      iconColor: 'text-blue-500',
    },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
            <h2 className="text-3xl font-bold text-gray-800">日终汇总</h2>
            <p className="text-lg text-gray-500">
              {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              ，共 {stats.total} 条检测记录
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all text-lg shadow-lg"
        >
          <Download className="w-6 h-6" />
          导出今日台账 CSV
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5 px-10 py-6">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={cn(
                'p-6 rounded-2xl border-2 shadow-sm',
                card.bg,
                card.border
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={cn('text-lg font-semibold mb-2', card.text)}>{card.label}</p>
                  <p className={cn('text-5xl font-black', card.text)}>{card.value}</p>
                </div>
                <Icon className={cn('w-12 h-12', card.iconColor, 'opacity-80')} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-10 pb-3 flex items-center gap-3">
        <span className="text-lg font-bold text-gray-700">分组方式：</span>
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setGroupBy('route')}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-base font-bold transition-all',
              groupBy === 'route'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Route className="w-5 h-5" />
            按线路
          </button>
          <button
            onClick={() => setGroupBy('plate')}
            className={cn(
              'flex items-center gap-2 px-5 py-2 rounded-lg text-base font-bold transition-all',
              groupBy === 'plate'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Car className="w-5 h-5" />
            按车牌
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-10 pb-8">
        {groupedRecords.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-3xl font-bold text-gray-400">今日暂无检测记录</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedRecords.map(([groupKey, groupRecords]) => {
              const isExpanded = expandedGroup === groupKey;
              const groupPassed = groupRecords.filter(r => r.result === 'passed').length;
              const groupFailed = groupRecords.filter(r => r.result === 'failed').length;
              return (
                <div
                  key={groupKey}
                  className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : groupKey)}
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center shadow-md">
                        {groupBy === 'route' ? <Route className="w-7 h-7" /> : <Car className="w-7 h-7" />}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">{groupKey}</h3>
                        <p className="text-base text-gray-500 mt-0.5">
                          共 {groupRecords.length} 条检测
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-5 text-base font-semibold">
                        <span className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          通过 {groupPassed}
                        </span>
                        <span className="flex items-center gap-1.5 text-orange-600">
                          <AlertTriangle className="w-5 h-5" />
                          待复核 {groupFailed}
                        </span>
                      </div>
                      <span className={cn(
                        'text-gray-400 transition-transform',
                        isExpanded && 'rotate-180'
                      )}>
                        ▼
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      <div className="space-y-3">
                        {groupRecords
                          .slice()
                          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                          .map(record => {
                            const conclusion = recordConclusion(record);
                            const suspended = getDriverSuspended(record.driverId);
                            return (
                              <div
                                key={record.id}
                                className={cn(
                                  'flex items-center justify-between p-4 rounded-xl border-2',
                                  'bg-white',
                                  suspended ? 'border-red-200' : 'border-gray-100'
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="text-lg font-bold text-gray-800 w-24">
                                    {record.driverName}
                                  </div>
                                  <div className="text-base text-gray-500 w-32">
                                    {record.busPlate}
                                  </div>
                                  <div className="text-base text-gray-500 w-48">
                                    {record.route}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {formatTime(record.timestamp)}
                                  </div>
                                  {record.passCode && (
                                    <div className="text-sm font-mono font-bold text-blue-600">
                                      {record.passCode}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-3">
                                  {suspended && (
                                    <span className="flex items-center gap-1 px-3 py-1.5 bg-red-100 border border-red-300 rounded-lg text-sm font-bold text-red-700 animate-pulse">
                                      <Shield className="w-4 h-4" />
                                      禁止放行
                                    </span>
                                  )}
                                  {conclusion && !suspended && (
                                    <span className={cn(
                                      'px-3 py-1.5 rounded-lg text-sm font-bold',
                                      conclusion.bg,
                                      conclusion.color
                                    )}>
                                      {conclusion.text}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
