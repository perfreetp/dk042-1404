import { Users, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { formatTime } from '../utils/formatTime';
import { cn } from '../lib/utils';

export const SecuritySidebar = () => {
  const { drivers, records, resetDriverStatus } = useAppStore();

  const waitingDrivers = drivers
    .filter(d => d.status === 'waiting')
    .sort((a, b) => a.queuePosition - b.queuePosition);
  
  const passedToday = records.filter(r => 
    r.result === 'passed' && 
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const failedToday = records.filter(r => 
    r.result === 'failed' && 
    new Date(r.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const nextDriver = waitingDrivers[0];
  const testingDriver = drivers.find(d => d.status === 'testing');

  return (
    <div className="w-96 bg-white border-l-2 border-gray-200 p-6 flex flex-col gap-6 overflow-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">保安管理台</h2>
        <p className="text-lg text-gray-500">{new Date().toLocaleDateString('zh-CN')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-2xl p-4 text-center">
          <Users className="w-10 h-10 text-blue-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-blue-600">{waitingDrivers.length}</p>
          <p className="text-lg text-blue-700">待检人数</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-4 text-center">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <p className="text-4xl font-bold text-green-600">{passedToday}</p>
          <p className="text-lg text-green-700">今日通过</p>
        </div>
      </div>

      {failedToday > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-2" />
          <p className="text-3xl font-bold text-orange-600">{failedToday}</p>
          <p className="text-lg text-orange-700">今日待复核</p>
        </div>
      )}

      {testingDriver && (
        <div className="bg-blue-100 rounded-2xl p-4 border-2 border-blue-300">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-8 h-8 text-blue-500 animate-spin" />
            <span className="text-xl font-bold text-blue-700">正在检测</span>
          </div>
          <div className="flex items-center gap-4">
            <img 
              src={testingDriver.avatar} 
              alt={testingDriver.name}
              className="w-16 h-16 rounded-full bg-white"
            />
            <div>
              <p className="text-xl font-bold text-gray-800">{testingDriver.name}</p>
              <p className="text-lg text-gray-600">{testingDriver.busPlate}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 flex-1">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
          <Clock className="w-6 h-6" />
          下一位待检
        </h3>
        {nextDriver ? (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <img 
                    src={nextDriver.avatar} 
                    alt={nextDriver.name}
                    className="w-16 h-16 rounded-full"
                  />
                  <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center">
                    {nextDriver.queuePosition}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-800">{nextDriver.name}</p>
                  <p className="text-lg text-gray-600">{nextDriver.busPlate}</p>
                  <p className="text-base text-gray-500">{nextDriver.route}</p>
                </div>
              </div>
            </div>

            {waitingDrivers.slice(1, 4).map(driver => (
              <div key={driver.id} className="bg-white rounded-xl p-3 shadow-sm opacity-70">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={driver.avatar} 
                      alt={driver.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {driver.queuePosition}
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-700">{driver.name}</p>
                    <p className="text-base text-gray-500">{driver.busPlate}</p>
                  </div>
                </div>
              </div>
            ))}

            {waitingDrivers.length > 4 && (
              <p className="text-center text-gray-500 text-lg">
                还有 {waitingDrivers.length - 4} 人等待...
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="text-2xl font-bold text-gray-500">暂无待检人员</p>
          </div>
        )}
      </div>

      {records.length > 0 && (
        <div className="bg-gray-50 rounded-2xl p-4 max-h-64 overflow-auto">
          <h3 className="text-xl font-bold text-gray-700 mb-3">最近检测记录</h3>
          <div className="space-y-2">
            {records.slice(-5).reverse().map(record => (
              <div 
                key={record.id} 
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl',
                  record.result === 'passed' ? 'bg-green-50' : 'bg-orange-50'
                )}
              >
                <div className="flex items-center gap-3">
                  {record.result === 'passed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-orange-500" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">{record.driverName}</p>
                    <p className="text-sm text-gray-500">{record.busPlate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-bold',
                    record.result === 'passed' ? 'text-green-600' : 'text-orange-600'
                  )}>
                    {record.result === 'passed' ? '通过' : '待复核'}
                  </p>
                  <p className="text-xs text-gray-500">{formatTime(record.timestamp)}</p>
                </div>
                {record.result === 'failed' && (
                  <button
                    onClick={() => resetDriverStatus(record.driverId)}
                    className="ml-2 p-2 bg-white rounded-lg hover:bg-gray-100 active:scale-95 transition-all"
                    title="重新排队"
                  >
                    <RefreshCw className="w-5 h-5 text-gray-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
