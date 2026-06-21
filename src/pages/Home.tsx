import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from '../hooks/useSpeech';
import { DriverGrid } from '../components/DriverGrid';
import { CardReader } from '../components/CardReader';
import { SecuritySidebar } from '../components/SecuritySidebar';
import { SupervisorPanel } from '../components/SupervisorPanel';
import { TestProcess } from '../components/TestProcess';
import { ResultPass } from '../components/ResultPass';
import { ResultFail } from '../components/ResultFail';
import { Play, X, Shield, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

type PageState = 'home' | 'confirm' | 'testing' | 'result';
type SidebarMode = 'security' | 'supervisor';

export const Home = () => {
  const { currentDriver, testResult, selectDriver, resetTest, alerts } = useAppStore();
  const { speak } = useSpeech();
  const [pageState, setPageState] = useState<PageState>('home');
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('security');

  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;

  const handleSelectDriver = (driverId: string) => {
    selectDriver(driverId);
    setPageState('confirm');
  };

  const handleStartTest = () => {
    if (currentDriver) {
      speak(`${currentDriver.name}师傅，请准备开始检测`);
      setPageState('testing');
    }
  };

  const handleTestComplete = () => {
    setPageState('result');
  };

  const handleBack = () => {
    if (pageState === 'testing' || pageState === 'result') {
      resetTest();
    }
    setPageState('home');
  };

  const handleConfirmResult = () => {
    resetTest();
    setPageState('home');
  };

  const renderSidebar = () => {
    return sidebarMode === 'security' ? <SecuritySidebar /> : <SupervisorPanel />;
  };

  const renderContent = () => {
    if (pageState === 'home') {
      return (
        <div className="flex flex-1">
          <div className="flex-1 flex flex-col">
            <DriverGrid onSelectDriver={handleSelectDriver} />
            <div className="p-8 pt-0">
              <CardReader onCardSuccess={() => setPageState('confirm')} />
            </div>
          </div>
          {renderSidebar()}
        </div>
      );
    }

    if (pageState === 'confirm' && currentDriver) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-gradient-to-b from-blue-50 to-white">
          <div className="bg-white rounded-3xl shadow-2xl p-16 max-w-2xl w-full text-center border-4 border-blue-200">
            <h2 className="text-5xl font-bold text-gray-800 mb-10">
              请确认您的信息
            </h2>
            
            <div className="flex flex-col items-center mb-12">
              <img
                src={currentDriver.avatar}
                alt={currentDriver.name}
                className="w-48 h-48 rounded-full border-8 border-blue-300 shadow-xl mb-8"
              />
              <h3 className="text-6xl font-bold text-blue-600 mb-4">
                {currentDriver.name} 师傅
              </h3>
              <div className="space-y-3 text-3xl text-gray-700">
                <p>车牌：<span className="font-bold text-gray-900">{currentDriver.busPlate}</span></p>
                <p>线路：<span className="font-bold text-gray-900">{currentDriver.route}</span></p>
              </div>
            </div>

            <div className="flex gap-6 justify-center">
              <button
                onClick={handleBack}
                className={cn(
                  'flex items-center gap-4 px-12 py-8 rounded-2xl shadow-lg',
                  'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  'active:scale-95 transition-all text-3xl font-bold'
                )}
              >
                <X className="w-12 h-12" />
                不是我
              </button>
              <button
                onClick={handleStartTest}
                className={cn(
                  'flex items-center gap-4 px-16 py-8 rounded-2xl shadow-lg',
                  'bg-blue-500 text-white hover:bg-blue-600',
                  'active:scale-95 transition-all text-3xl font-bold'
                )}
              >
                <Play className="w-12 h-12" />
                开始检测
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (pageState === 'testing') {
      return (
        <div className="flex">
          <TestProcess onBack={handleBack} onComplete={handleTestComplete} />
          {renderSidebar()}
        </div>
      );
    }

    if (pageState === 'result') {
      return (
        <div className="flex">
          {testResult === 'passed' ? (
            <ResultPass onBack={handleBack} onConfirm={handleConfirmResult} />
          ) : (
            <ResultFail onBack={handleBack} onConfirm={handleConfirmResult} />
          )}
          {renderSidebar()}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-12 py-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">🚌</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold">校车驾驶员酒测登记终端</h1>
              <p className="text-2xl text-blue-100 mt-1">安全驾驶 · 为孩子保驾护航</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-blue-500 rounded-xl p-1">
              <button
                onClick={() => setSidebarMode('security')}
                className={cn(
                  'px-5 py-2 rounded-lg text-lg font-bold transition-all',
                  sidebarMode === 'security'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-white hover:bg-blue-400'
                )}
              >
                保安管理台
              </button>
              <button
                onClick={() => setSidebarMode('supervisor')}
                className={cn(
                  'px-5 py-2 rounded-lg text-lg font-bold transition-all flex items-center gap-2',
                  sidebarMode === 'supervisor'
                    ? 'bg-white text-red-600 shadow'
                    : 'text-white hover:bg-blue-400'
                )}
              >
                <Shield className="w-5 h-5" />
                主管告警
                {pendingAlerts > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                    {pendingAlerts}
                  </span>
                )}
              </button>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p className="text-2xl text-blue-100 mt-1">
                {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>

      <footer className="bg-gray-100 border-t-2 border-gray-200 px-12 py-4">
        <div className="flex items-center justify-between text-lg text-gray-500">
          <p>© 2024 校车安全管理系统 · 版本 v2.0.0</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              系统运行正常
            </span>
            <span>客服热线：400-888-8888</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
