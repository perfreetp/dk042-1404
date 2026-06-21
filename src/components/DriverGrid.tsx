import { Driver } from '../types';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { cn } from '../lib/utils';
import { CheckCircle, XCircle, Clock, Shield } from 'lucide-react';

interface DriverGridProps {
  onSelectDriver: (driverId: string) => void;
  onAlreadyTested?: (type: 'passed' | 'failed' | 'testing' | 'suspended', driver: Driver) => void;
}

export const DriverGrid = ({ onSelectDriver, onAlreadyTested }: DriverGridProps) => {
  const { drivers, currentDriver, selectDriver } = useAppStore();
  const { speak } = useSpeech();

  const handleClick = (driver: Driver) => {
    if (driver.status === 'suspended') {
      speak(`${driver.name}师傅被禁止上岗，请立即拦停`);
      onAlreadyTested?.('suspended', driver);
      return;
    }

    const result = selectDriver(driver.id);
    if (result.ok) {
      speak(`已选择${driver.name}师傅，请确认`);
      onSelectDriver(driver.id);
    } else {
      if (result.reason === 'already_passed') {
        speak(`${driver.name}师傅今日已通过检测`);
        onAlreadyTested?.('passed', driver);
      } else if (result.reason === 'failed_pending') {
        speak(`${driver.name}师傅待主管复核，请勿放行`);
        onAlreadyTested?.('failed', driver);
      } else if (result.reason === 'testing') {
        speak(`${driver.name}师傅正在检测中`);
        onAlreadyTested?.('testing', driver);
      } else if (result.reason === 'suspended') {
        speak(`${driver.name}师傅被禁止上岗`);
        onAlreadyTested?.('suspended', driver);
      }
    }
  };

  const getStatusIcon = (status: Driver['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-orange-500" />;
      case 'suspended':
        return <Shield className="w-8 h-8 text-red-600" />;
      case 'testing':
        return <Clock className="w-8 h-8 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: Driver['status']) => {
    switch (status) {
      case 'passed': return '已通过';
      case 'failed': return '待复核';
      case 'suspended': return '禁止上岗';
      case 'testing': return '检测中';
      default: return '';
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
            已检测 ({otherDrivers.length}人)
          </h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {otherDrivers.map(driver => (
              <button
                key={driver.id}
                onClick={() => handleClick(driver)}
                className={cn(
                  'flex flex-col items-center p-6 rounded-2xl transition-all cursor-pointer',
                  driver.status === 'passed' ? 'bg-green-50 border-2 border-green-200' :
                  driver.status === 'suspended' ? 'bg-red-50 border-2 border-red-300' :
                  driver.status === 'failed' ? 'bg-orange-50 border-2 border-orange-200' :
                  'bg-blue-50 border-2 border-blue-200',
                  'opacity-90 hover:opacity-100 hover:shadow-lg active:scale-95'
                )}
              >
                <div className="relative mb-4">
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-24 h-24 rounded-full bg-gray-100 opacity-80"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    {getStatusIcon(driver.status)}
                  </div>
                </div>
                <span className="text-2xl font-bold text-gray-700">{driver.name}</span>
                <span className={cn(
                  'text-lg mt-1 font-bold',
                  driver.status === 'passed' ? 'text-green-600' :
                  driver.status === 'suspended' ? 'text-red-700' :
                  driver.status === 'failed' ? 'text-orange-600' :
                  'text-blue-600'
                )}>
                  {getStatusText(driver.status)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
