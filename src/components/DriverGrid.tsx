import { Driver } from '../types';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { cn } from '../lib/utils';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface DriverGridProps {
  onSelectDriver: (driverId: string) => void;
}

export const DriverGrid = ({ onSelectDriver }: DriverGridProps) => {
  const { drivers, currentDriver } = useAppStore();
  const { speak } = useSpeech();

  const handleClick = (driver: Driver) => {
    if (driver.status === 'waiting') {
      speak(`已选择${driver.name}师傅，请确认`);
      onSelectDriver(driver.id);
    } else if (driver.status === 'testing') {
      speak(`${driver.name}师傅正在检测中`);
    } else if (driver.status === 'passed') {
      speak(`${driver.name}师傅已通过检测`);
    } else {
      speak(`${driver.name}师傅需要复核`);
    }
  };

  const getStatusIcon = (status: Driver['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-orange-500" />;
      case 'testing':
        return <Clock className="w-8 h-8 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const waitingDrivers = drivers.filter(d => d.status === 'waiting').sort((a, b) => a.queuePosition - b.queuePosition);
  const otherDrivers = drivers.filter(d => d.status !== 'waiting');

  return (
    <div className="flex-1 p-8 overflow-auto">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
        请选择您的头像
      </h2>
      
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-600 mb-4">
          待检队列 ({waitingDrivers.length}人)
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
          {waitingDrivers.map(driver => (
            <button
              key={driver.id}
              onClick={() => handleClick(driver)}
              className={cn(
                'flex flex-col items-center p-6 rounded-2xl transition-all duration-300',
                'bg-white shadow-lg hover:shadow-2xl',
                'border-4 border-transparent hover:border-blue-400',
                'active:scale-95',
                currentDriver?.id === driver.id && 'border-blue-500 bg-blue-50 scale-105'
              )}
            >
              <div className="relative mb-4">
                <img
                  src={driver.avatar}
                  alt={driver.name}
                  className="w-24 h-24 rounded-full bg-gray-100"
                />
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xl font-bold rounded-full w-10 h-10 flex items-center justify-center">
                  {driver.queuePosition}
                </div>
              </div>
              <span className="text-2xl font-bold text-gray-800">{driver.name}</span>
              <span className="text-lg text-gray-500 mt-1">{driver.busPlate}</span>
            </button>
          ))}
        </div>
      </div>

      {otherDrivers.length > 0 && (
        <div>
          <h3 className="text-2xl font-semibold text-gray-600 mb-4">
            已检测
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {otherDrivers.map(driver => (
              <div
                key={driver.id}
                className={cn(
                  'flex flex-col items-center p-6 rounded-2xl transition-all',
                  driver.status === 'passed' ? 'bg-green-50 border-2 border-green-200' :
                  driver.status === 'failed' ? 'bg-orange-50 border-2 border-orange-200' :
                  'bg-blue-50 border-2 border-blue-200',
                  'opacity-80'
                )}
              >
                <div className="relative mb-4">
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-24 h-24 rounded-full bg-gray-100 opacity-70"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(driver.status)}
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-600">{driver.name}</span>
                <span className={cn(
                  'text-lg mt-1 font-semibold',
                  driver.status === 'passed' ? 'text-green-600' :
                  driver.status === 'failed' ? 'text-orange-600' :
                  'text-blue-600'
                )}>
                  {driver.status === 'passed' ? '已通过' :
                   driver.status === 'failed' ? '待复核' : '检测中'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
