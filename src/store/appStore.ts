import { create } from 'zustand';
import {
  Driver, TestRecord, TestStep, AlertRecord, AlertStatus,
  AppState, AppActions, CardScanResult, ReviewConclusion,
  ShiftHandoverRecord, DisposalRecord, ShiftType, TimelineEvent,
} from '../types';
import { mockDrivers } from '../data/mockData';
import {
  loadRecords, saveRecords, loadAlerts, saveAlerts,
  loadShiftHandover, saveShiftHandover,
  loadDisposalRecords, saveDisposalRecords,
  loadCurrentShift, saveCurrentShift,
  loadDrivers, saveDrivers,
} from '../utils/storage';
import { exportRecordsToCSV, downloadCSV } from '../utils/exportCsv';

interface AppStore extends AppState, AppActions {}

const isSameDay = (ts1: number, ts2: number) =>
  new Date(ts1).toDateString() === new Date(ts2).toDateString();

const generatePassCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

const persistRecords = (records: TestRecord[]) => saveRecords(records);
const persistAlerts = (alerts: AlertRecord[]) => saveAlerts(alerts);
const persistShiftHandover = (r: ShiftHandoverRecord[]) => saveShiftHandover(r);
const persistDisposalRecords = (r: DisposalRecord[]) => saveDisposalRecords(r);
const persistDrivers = (d: Driver[]) => saveDrivers(d);

const initDrivers = (): Driver[] => {
  const saved = loadDrivers();
  if (saved && saved.length > 0) return saved;
  return mockDrivers;
};

export const useAppStore = create<AppStore>((set, get) => ({
  drivers: initDrivers(),
  currentDriver: null,
  testStep: 'idle' as TestStep,
  testResult: null,
  records: loadRecords(),
  alerts: loadAlerts(),
  currentAlcoholLevel: null,
  currentPassCode: null,
  currentShift: loadCurrentShift(),
  shiftHandoverRecords: loadShiftHandover(),
  disposalRecords: loadDisposalRecords(),

  selectDriver: (driverId: string) => {
    const driver = get().drivers.find(d => d.id === driverId);
    if (!driver) return { ok: false, reason: '未找到该司机' };

    const todayRecords = get().records.filter(r =>
      r.driverId === driverId && isSameDay(r.timestamp, Date.now())
    );

    if (driver.status === 'suspended') {
      return { ok: false, reason: 'suspended' };
    }
    if (todayRecords.some(r => r.result === 'passed')) {
      return { ok: false, reason: 'already_passed' };
    }
    if (todayRecords.some(r => r.result === 'failed')) {
      return { ok: false, reason: 'failed_pending' };
    }
    if (driver.status === 'testing') {
      return { ok: false, reason: 'testing' };
    }
    if (driver.status !== 'waiting') {
      return { ok: false, reason: 'already_tested' };
    }

    set({
      currentDriver: driver,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
    return { ok: true };
  },

  selectDriverByCard: (cardNumber: string): CardScanResult => {
    const driver = get().drivers.find(d => d.cardNumber === cardNumber);
    if (!driver) {
      return { type: 'not_found', cardNumber };
    }

    const todayRecords = get().records.filter(r =>
      r.driverId === driver.id && isSameDay(r.timestamp, Date.now())
    );
    const passedToday = todayRecords.find(r => r.result === 'passed');
    const failedToday = todayRecords.find(r => r.result === 'failed');

    if (driver.status === 'suspended') {
      return { type: 'suspended', driver };
    }
    if (passedToday) {
      return { type: 'already_passed', driver, passCode: passedToday.passCode };
    }
    if (failedToday || driver.status === 'failed') {
      return { type: 'failed_pending', driver };
    }
    if (driver.status === 'testing') {
      return { type: 'testing', driver };
    }
    if (driver.status !== 'waiting') {
      return { type: 'already_passed', driver };
    }

    set({
      currentDriver: driver,
      testStep: 'idle',
      testResult: null,
      currentAlcoholLevel: null,
      currentPassCode: null,
    });
    return { type: 'success', driver };
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
    const { currentDriver, drivers, records, alerts } = get();
    if (!currentDriver) return;

    const todaySame = records.find(r =>
      r.driverId === currentDriver.id && isSameDay(r.timestamp, Date.now())
    );
    if (todaySame) {
      set({
        currentDriver: { ...currentDriver, status: result },
        testStep: 'result',
        testResult: result,
        currentAlcoholLevel: alcoholLevel,
        currentPassCode: todaySame.passCode || null,
      });
      return;
    }

    const passCode = result === 'passed' ? generatePassCode() : undefined;
    const newRecord: TestRecord = {
      id: generateId('REC'),
      driverId: currentDriver.id,
      driverName: currentDriver.name,
      busPlate: currentDriver.busPlate,
      route: currentDriver.route,
      timestamp: Date.now(),
      result,
      alcoholLevel,
      passCode,
      released: false,
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

    let updatedAlerts = alerts;
    if (result === 'failed') {
      const newAlert: AlertRecord = {
        id: generateId('ALT'),
        driverId: currentDriver.id,
        driverName: currentDriver.name,
        busPlate: currentDriver.busPlate,
        route: currentDriver.route,
        timestamp: Date.now(),
        alcoholLevel,
        status: 'pending',
      };
      updatedAlerts = [...alerts, newAlert];
      persistAlerts(updatedAlerts);
    }

    const updatedRecords = [...records, newRecord];
    persistRecords(updatedRecords);

    set({
      drivers: updatedQueueDrivers,
      currentDriver: { ...currentDriver, status: result },
      testStep: 'result',
      testResult: result,
      currentAlcoholLevel: alcoholLevel,
      currentPassCode: passCode || null,
      records: updatedRecords,
      alerts: updatedAlerts,
    });
  },

  resetTest: () => {
    set({
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
      d.id === driverId
        ? { ...d, status: 'waiting' as const, queuePosition: maxQueue + 1 }
        : d
    );
    set({ drivers: updatedDrivers });
  },

  updateAlertContact: (alertId: string, note: string) => {
    const { alerts } = get();
    const updatedAlerts = alerts.map(a =>
      a.id === alertId
        ? { ...a, status: 'contacted' as AlertStatus, contactedAt: Date.now(), contactNote: note }
        : a
    );
    persistAlerts(updatedAlerts);
    set({ alerts: updatedAlerts });
  },

  updateAlertReview: (alertId: string, conclusion: ReviewConclusion, note: string) => {
    const { alerts, drivers, records, disposalRecords } = get();
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return null;

    const now = Date.now();
    const disposalId = generateId('DSP');

    const disposalRecord: DisposalRecord = {
      id: disposalId,
      alertId,
      driverId: alert.driverId,
      driverName: alert.driverName,
      busPlate: alert.busPlate,
      route: alert.route,
      alcoholLevel: alert.alcoholLevel,
      conclusion,
      contactNote: alert.contactNote,
      reviewNote: note,
      createdAt: now,
      executed: false,
    };

    const updatedDisposalRecords = [...disposalRecords, disposalRecord];
    persistDisposalRecords(updatedDisposalRecords);

    const updatedAlerts = alerts.map(a =>
      a.id === alertId
        ? {
            ...a,
            status: 'reviewed' as AlertStatus,
            reviewedAt: now,
            contactedAt: a.contactedAt || now,
            reviewConclusion: conclusion,
            reviewNote: note,
            disposalRecordId: disposalId,
          }
        : a
    );
    persistAlerts(updatedAlerts);

    const updatedDrivers = drivers.map(d =>
      d.id === alert.driverId
        ? { ...d, status: conclusion === 'cleared' ? ('waiting' as const) : ('suspended' as const) }
        : d
    );
    persistDrivers(updatedDrivers);

    const updatedRecords = records.map(r =>
      r.driverId === alert.driverId && isSameDay(r.timestamp, now)
        ? { ...r, reviewConclusion: conclusion, disposalRecordId: disposalId }
        : r
    );
    persistRecords(updatedRecords);

    set({
      alerts: updatedAlerts,
      drivers: updatedDrivers,
      records: updatedRecords,
      disposalRecords: updatedDisposalRecords,
    });

    return disposalRecord;
  },

  verifyPassCode: (code: string) => {
    const { records } = get();
    const record = records.find(r => r.passCode === code.trim().toUpperCase());
    if (!record) return { valid: false, alreadyReleased: false };
    return { valid: true, record, alreadyReleased: record.released };
  },

  markRecordReleased: (recordId: string) => {
    const { records } = get();
    const now = Date.now();
    const updatedRecords = records.map(r =>
      r.id === recordId ? { ...r, released: true, releasedAt: now, releaseType: 'direct' as const } : r
    );
    persistRecords(updatedRecords);
    set({ records: updatedRecords });
  },

  exportTodayLedger: () => {
    const { records, alerts } = get();
    const today = Date.now();
    const todayRecords = records.filter(r => isSameDay(r.timestamp, today));
    const csv = exportRecordsToCSV(todayRecords, alerts);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `校车酒测台账_${dateStr}.csv`);
    return csv;
  },

  setCurrentShift: (shift: ShiftType) => {
    saveCurrentShift(shift);
    set({ currentShift: shift });
  },

  getPendingItems: () => {
    const { records, alerts, drivers } = get();
    const today = Date.now();

    const pendingVerify = records.filter(r =>
      r.result === 'passed' &&
      !r.released &&
      isSameDay(r.timestamp, today)
    );

    const pendingReview = alerts.filter(a =>
      a.status !== 'reviewed' &&
      isSameDay(a.timestamp, today)
    );

    const suspended = drivers.filter(d => d.status === 'suspended');

    return { pendingVerify, pendingReview, suspended };
  },

  createShiftHandover: (data: { outgoingGuard: string; incomingGuard: string; handoverNote: string }) => {
    const { currentShift, shiftHandoverRecords } = get();
    const { pendingVerify, pendingReview, suspended } = get().getPendingItems();

    const now = Date.now();
    const outgoingShift: ShiftType = currentShift || 'morning';
    const incomingShift: ShiftType = outgoingShift === 'morning' ? 'evening' : 'morning';

    const record: ShiftHandoverRecord = {
      id: generateId('SHF'),
      date: new Date(now).toISOString().slice(0, 10),
      outgoingShift,
      incomingShift,
      outgoingGuard: data.outgoingGuard,
      incomingGuard: data.incomingGuard,
      handoverNote: data.handoverNote,
      handoverTime: now,
      snapshot: {
        pendingVerifyCount: pendingVerify.length,
        pendingReviewCount: pendingReview.length,
        suspendedCount: suspended.length,
        pendingVerify: pendingVerify.map(r => ({
          driverName: r.driverName,
          busPlate: r.busPlate,
          route: r.route,
          passCode: r.passCode,
        })),
        pendingReview: pendingReview.map(a => ({
          driverName: a.driverName,
          busPlate: a.busPlate,
          route: a.route,
          status: a.status,
        })),
        suspended: suspended.map(d => ({
          driverName: d.name,
          busPlate: d.busPlate,
          route: d.route,
        })),
      },
    };

    const updatedRecords = [...shiftHandoverRecords, record];
    persistShiftHandover(updatedRecords);
    saveCurrentShift(incomingShift);
    set({
      shiftHandoverRecords: updatedRecords,
      currentShift: incomingShift,
    });

    return record;
  },

  markDisposalExecuted: (disposalId: string) => {
    const { disposalRecords, records } = get();
    const now = Date.now();
    const disposal = disposalRecords.find(d => d.id === disposalId);
    if (!disposal) return;

    const updatedDisposals = disposalRecords.map(d =>
      d.id === disposalId ? { ...d, executed: true, executedAt: now } : d
    );
    persistDisposalRecords(updatedDisposals);

    let updatedRecords = records;
    if (disposal.conclusion === 'cleared') {
      const today = Date.now();
      const targetRecord = records.find(r =>
        r.driverId === disposal.driverId &&
        r.result === 'passed' &&
        !r.released &&
        isSameDay(r.timestamp, today)
      );
      if (targetRecord) {
        updatedRecords = records.map(r =>
          r.id === targetRecord.id ? { ...r, released: true, releasedAt: now, releaseType: 'review' as const } : r
        );
        persistRecords(updatedRecords);
      }
    }

    set({
      disposalRecords: updatedDisposals,
      records: updatedRecords,
    });
  },

  parseQrContent: (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return { error: '请输入二维码内容' };

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.passCode && typeof parsed.passCode === 'string') {
        return {
          passCode: parsed.passCode.toUpperCase(),
          driverName: parsed.driverName,
          busPlate: parsed.busPlate,
        };
      }
      return { error: '二维码中未找到放行码' };
    } catch {
      const upper = trimmed.toUpperCase();
      if (/^[A-Z2-9]{6}$/.test(upper)) {
        return { passCode: upper };
      }
      return { error: '二维码内容格式不正确' };
    }
  },

  getDisposalTimeline: (disposalId: string) => {
    const { disposalRecords, alerts, records } = get();
    const disposal = disposalRecords.find(d => d.id === disposalId);
    if (!disposal) return [];

    const alert = alerts.find(a => a.id === disposal.alertId);
    if (!alert) return [];

    const testRecord = records.find(r =>
      r.driverId === disposal.driverId &&
      r.result === 'failed' &&
      isSameDay(r.timestamp, disposal.createdAt)
    );

    const events: TimelineEvent[] = [];

    if (testRecord) {
      events.push({
        type: 'test_failed',
        timestamp: testRecord.timestamp,
        title: '酒测检测不合格',
        description: `酒精含量 ${testRecord.alcoholLevel?.toFixed(1)} mg/100ml`,
        operator: '检测终端',
      });
    }

    events.push({
      type: 'alert_created',
      timestamp: alert.timestamp,
      title: '生成告警记录',
      description: '系统自动推送至安全主管',
      operator: '系统',
    });

    if (alert.contactedAt && alert.contactNote) {
      events.push({
        type: 'contacted',
        timestamp: alert.contactedAt,
        title: '主管已联系',
        description: alert.contactNote,
        operator: '安全主管',
      });
    }

    events.push({
      type: 'reviewed',
      timestamp: disposal.createdAt,
      title: disposal.conclusion === 'cleared' ? '复核通过' : '禁止上岗',
      description: alert.reviewNote,
      operator: '安全主管',
    });

    if (disposal.executed && disposal.executedAt) {
      events.push({
        type: 'executed',
        timestamp: disposal.executedAt,
        title: disposal.conclusion === 'cleared' ? '保安确认已放行' : '保安确认已拦停',
        operator: '门岗保安',
      });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  },
}));
