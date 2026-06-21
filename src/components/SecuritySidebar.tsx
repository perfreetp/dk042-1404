import { useState } from 'react';
import { Users, Clock, CheckCircle, AlertTriangle, RefreshCw, Search, ShieldCheck, KeyRound, Shield } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';
import { PassCodeVerify } from './PassCodeVerify';

type SidebarTab = 'queue' | 'ledger' | 'verify';

export const SecuritySidebar = () => {
  const { drivers, records, alerts, resetDriverStatus } = useAppStore();
  const [activeTab, setActiveTab] = useState<SidebarTab>('queue');
  const [searchQuery, setSearchQuery] = useState('');

  const waitingDrivers = drivers
    .filter(d => d.status === 'waiting')
    .sort((a, b) => a.queuePosition - b.queuePosition);

  const todayRecords = records.filter(r =>
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  );

  const passedToday = todayRecords.filter(r => r.result === 'passed').length;
  const failedToday = todayRecords.filter(r => r.result === 'failed').length;
  const suspendedCount = drivers.filter(d => d.status === 'suspended').length;
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;

  const nextDriver = waitingDrivers[0];
  const testingDriver = drivers.find(d => d.status === 'testing');
  const suspendedDrivers = drivers.filter(d => d.status === 'suspended');

  const filteredRecords = searchQuery.trim()
    ? todayRecords.filter(r =>
        r.driverName.includes(searchQuery.trim()) ||
        r.busPlate.includes(searchQuery.trim()) ||
        (r.passCode && r.passCode.includes(searchQuery.trim().toUpperCase()))
      )
    : todayRecords;

  const tabs: { key: SidebarTab; label: string; icon: typeof Users; badge?: number }[] = [
    { key: 'queue', label: '排队', icon: Users },
    { key: 'ledger', label: '台账', icon: Clock },
    { key: 'verify', label: '核验', icon: KeyRound, badge: pendingAlerts || undefined },
  ];

  const getRecordBadge = (record: typeof todayRecords[number]) => {
    const driver = drivers.find(d => d.id === record.driverId);
    const relatedAlert = alerts.find(a => a.driverId === record.driverId && record.result === 'failed');

    if (driver?.status === 'suspended') {
      return { text: '禁止放行', bg: 'bg-red-100 border-red-300', textColor: 'text-red-700', icon: Shield, pulse: true };
    }
    if (record.result === 'passed') {
      if (record.released) return { text: '已放行', bg: 'bg-green-100 border-green-200', textColor: 'text-green-700', icon: CheckCircle, pulse: false };
      return { text: '待放行', bg: 'bg-blue-100 border-blue-200', textColor: 'text-blue-700', icon: Clock, pulse: false };
    }
    if (relatedAlert) {
      if (relatedAlert.status === 'reviewed' && relatedAlert.reviewConclusion === 'cleared')
        return { text: '复核通过', bg: 'bg-green-100 border-green-200', textColor: 'text-green-700', icon: CheckCircle, pulse: false };
      if (relatedAlert.status === 'reviewed' && relatedAlert.reviewConclusion === 'suspended')
        return { text: '禁止放行', bg: 'bg-red-100 border-red-300', textColor: 'text-red-700', icon: Shield, pulse: true };
      if (relatedAlert.status === 'contacted')
        return { text: '已联系', bg: 'bg-yellow-100 border-yellow-200', textColor: 'text-yellow-700', icon: Users, pulse: false };
      return { text: '待处理', bg: 'bg-orange-100 border-orange-200', textColor: 'text-orange-700', icon: AlertTriangle, pulse: true };
    }
    return { text: '待复核', bg: 'bg-orange-100 border-orange-200', textColor: 'text-orange-700', icon: AlertTriangle, pulse: false };
  };

  return (
    <div className="w-[440px] bg-white border-l-2 border-gray-200 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">保安管理台</h2>
        <p className="text-base text-gray-500">{new Date().toLocaleDateString('zh-CN')}</p>
      </div>

      <div className="grid grid-cols-3 gap-3 p-5 pb-3">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <Users className="w-7 h-7 text-blue-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-blue-600">{waitingDrivers.length}</p>
          <p className="text-sm text-blue-700">待检</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <CheckCircle className="w-7 h-7 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">{passedToday}</p>
          <p className="text-sm text-green-700">通过</p>
        </div>
        <div className={cn(
          "rounded-xl p-3 text-center",
          pendingAlerts > 0 || suspendedCount > 0 ? "bg-orange-50" : "bg-gray-50"
        )}>
          <AlertTriangle className={cn(
            "w-7 h-7 mx-auto mb-1",
            pendingAlerts > 0 || suspendedCount > 0 ? "text-orange-500" : "text-gray-400"
          )} />
          <p className={cn(
            "text-2xl font-bold",
            pendingAlerts > 0 || suspendedCount > 0 ? "text-orange-600" : "text-gray-500"
          )}>{failedToday + suspendedCount}</p>
          <p className={cn(
            "text-sm",
            pendingAlerts > 0 || suspendedCount > 0 ? "text-orange-700" : "text-gray-500"
          )}>待复核/禁岗</p>
        </div>
      </div>

      {suspendedDrivers.length > 0 && (
        <div className="mx-5 mb-3 bg-red-50 rounded-xl p-3 border-2 border-red-300">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-red-600 animate-pulse" />
            <span className="text-lg font-bold text-red-700">禁止上岗</span>
          </div>
          <div className="space-y-1.5">
            {suspendedDrivers.map(d => (
              <div key={d.id} className="flex items-center gap-2 text-sm">
                <img src={d.avatar} alt={d.name} className="w-7 h-7 rounded-full bg-white" />
                <span className="font-bold text-red-800">{d.name}</span>
                <span className="text-red-600">· {d.busPlate}</span>
                <span className="text-red-500">· {d.route}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {testingDriver && (
        <div className="mx-5 mb-3 bg-blue-100 rounded-xl p-3 border-2 border-blue-300">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="text-lg font-bold text-blue-700">正在检测</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <img src={testingDriver.avatar} alt={testingDriver.name} className="w-12 h-12 rounded-full bg-white" />
            <div>
              <p className="text-lg font-bold text-gray-800">{testingDriver.name}</p>
              <p className="text-base text-gray-600">{testingDriver.busPlate}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex border-b border-gray-200 px-5">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-3 text-base font-bold border-b-2 transition-all',
                activeTab === tab.key
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              )}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {tab.badge && (
                <span className="bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto p-5">
        {activeTab === 'queue' && (
          <div className="space-y-3">
            {nextDriver ? (
              <>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={nextDriver.avatar} alt={nextDriver.name} className="w-14 h-14 rounded-full" />
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {nextDriver.queuePosition}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-gray-800">{nextDriver.name}</p>
                      <p className="text-base text-gray-600">{nextDriver.busPlate}</p>
                      <p className="text-sm text-gray-500">{nextDriver.route}</p>
                    </div>
                  </div>
                </div>
                {waitingDrivers.slice(1, 5).map(driver => (
                  <div key={driver.id} className="bg-white rounded-xl p-2.5 shadow-sm opacity-70">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img src={driver.avatar} alt={driver.name} className="w-10 h-10 rounded-full" />
                        <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {driver.queuePosition}
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-700">{driver.name}</p>
                        <p className="text-sm text-gray-500">{driver.busPlate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
                <p className="text-xl font-bold text-gray-500">暂无待检人员</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索姓名 / 车牌 / 放行码"
                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 text-lg focus:border-blue-400 focus:outline-none"
              />
            </div>
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-lg text-gray-400">{searchQuery ? '未找到匹配记录' : '今日暂无记录'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.slice().reverse().map(record => {
                  const badge = getRecordBadge(record);
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={record.id}
                      className={cn(
                        'p-3 rounded-xl border-2',
                        record.result === 'passed' ? 'bg-green-50 border-green-100' : 'bg-orange-50 border-orange-100'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {record.result === 'passed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                          )}
                          <span className="font-bold text-gray-800">{record.driverName}</span>
                        </div>
                        <span className={cn(
                          'flex items-center gap-1 text-sm font-bold px-2.5 py-0.5 rounded-lg border',
                          badge.bg,
                          badge.textColor,
                          badge.pulse && 'animate-pulse'
                        )}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.text}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{record.busPlate} · {record.route}</span>
                        <span>{formatTime(record.timestamp)}</span>
                      </div>
                      {record.passCode && (
                        <div className="mt-1 text-sm">
                          <span className="text-gray-400">放行码：</span>
                          <span className="font-mono font-bold text-blue-600">{record.passCode}</span>
                        </div>
                      )}
                      {record.result === 'failed' && drivers.find(d => d.id === record.driverId)?.status !== 'suspended' && (
                        <button
                          onClick={() => resetDriverStatus(record.driverId)}
                          className="mt-2 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          重新排队
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'verify' && (
          <PassCodeVerify />
        )}
      </div>
    </div>
  );
};
