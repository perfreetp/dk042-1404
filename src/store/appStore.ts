import { create } from 'zustand';
import { Driver, TestRecord, TestStep, AppState, AppActions } from '../types';
import { mockDrivers, mockRecords } from '../data/mockData';

interface AppStore extends AppState, AppActions {}

const generatePassCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateRecordId = (): string => {
  return `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const useAppStore = create<AppStore>((set, get) => ({
  drivers: mockDrivers,
  currentDriver: null,
  testStep: 'idle',
  testResult: null,
  records: mockRecords,
  currentAlcoholLevel: null,
  currentPassCode: null,

  selectDriver: (driverId: string) => {
    const driver = get().drivers.find(d => d.id === driverId);
    if (driver && driver.status === 'waiting') {
      set({
        currentDriver: driver,
        testStep: 'idle',
        testResult: null,
        currentAlcoholLevel: null,
        currentPassCode: null,
      });
    }
  },

  selectDriverByCard: (cardNumber: string) => {
    const driver = get().drivers.find(d => d.cardNumber === cardNumber);
    if (driver && driver.status === 'waiting') {
      set({
        currentDriver: driver,
        testStep: 'idle',
        testResult: null,
        currentAlcoholLevel: null,
        currentPassCode: null,
      });
    }
  },

  startTest: () => {
    const { currentDriver, drivers } = get();
    if (!currentDriver) return;

    const updatedDrivers = drivers.map(d =>
      d.id === currentDriver.id ? { ...d, status: 'testing' as const } : d
    );

    set({
      drivers: updatedDrivers,
      currentDriver: { ...currentDriver, status: 'testing' },
      testStep: 'blow',
    });
  },

  setTestStep: (step: TestStep) => {
    set({ testStep: step });
  },

  completeTest: (result: 'passed' | 'failed', alcoholLevel: number) => {
    const { currentDriver, drivers, records } = get();
    if (!currentDriver) return;

    const passCode = result === 'passed' ? generatePassCode() : undefined;
    const newRecord: TestRecord = {
      id: generateRecordId(),
      driverId: currentDriver.id,
      driverName: currentDriver.name,
      busPlate: currentDriver.busPlate,
      timestamp: Date.now(),
      result,
      alcoholLevel,
      passCode,
    };

    const updatedDrivers = drivers.map(d =>
      d.id === currentDriver.id ? { ...d, status: result } : d
    );

    const updatedQueueDrivers = updatedDrivers.map(d => {
      if (d.status === 'waiting' && d.queuePosition > currentDriver.queuePosition) {
        return { ...d, queuePosition: d.queuePosition - 1 };
      }
      return d;
    });

    set({
      drivers: updatedQueueDrivers,
      currentDriver: { ...currentDriver, status: result },
      testStep: 'result',
      testResult: result,
      currentAlcoholLevel: alcoholLevel,
      currentPassCode: passCode || null,
      records: [...records, newRecord],
    });

    if (result === 'failed') {
      console.warn('[安全告警] 酒测不合格，已推送给安全主管：', {
        driver: currentDriver.name,
        time: new Date().toLocaleString('zh-CN'),
        busPlate: currentDriver.busPlate,
      });
    }
  },

  resetTest: () => {
    const { currentDriver, drivers } = get();
    if (!currentDriver) return;

    const updatedDrivers = drivers.map(d =>
      d.id === currentDriver.id ? { ...d, status: 'waiting' as const } : d
    );

    set({
      drivers: updatedDrivers,
      currentDriver: null,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
  },

  confirmRelease: () => {
    set({
      currentDriver: null,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
  },

  resetDriverStatus: (driverId: string) => {
    const { drivers } = get();
    const maxQueue = Math.max(...drivers.filter(d => d.status === 'waiting').map(d => d.queuePosition), 0);
    
    const updatedDrivers = drivers.map(d =>
      d.id === driverId ? { ...d, status: 'waiting' as const, queuePosition: maxQueue + 1 } : d
    );

    set({ drivers: updatedDrivers });
  },
}));
