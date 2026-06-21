export interface Driver {
  id: string;
  name: string;
  avatar: string;
  cardNumber: string;
  busPlate: string;
  route: string;
  status: 'waiting' | 'testing' | 'passed' | 'failed' | 'suspended';
  queuePosition: number;
}

export interface TestRecord {
  id: string;
  driverId: string;
  driverName: string;
  busPlate: string;
  route: string;
  timestamp: number;
  result: 'passed' | 'failed';
  alcoholLevel?: number;
  passCode?: string;
  released: boolean;
  releasedAt?: number;
  releaseType?: 'direct' | 'review';
  reviewConclusion?: 'cleared' | 'suspended';
  disposalRecordId?: string;
}

export type TestStep = 'idle' | 'blow' | 'waiting' | 'result';

export type CardScanResult =
  | { type: 'success'; driver: Driver }
  | { type: 'not_found'; cardNumber: string }
  | { type: 'already_passed'; driver: Driver; passCode?: string }
  | { type: 'failed_pending'; driver: Driver }
  | { type: 'suspended'; driver: Driver }
  | { type: 'testing'; driver: Driver };

export type AlertStatus = 'pending' | 'contacted' | 'reviewed';
export type ReviewConclusion = 'cleared' | 'suspended';

export interface AlertRecord {
  id: string;
  driverId: string;
  driverName: string;
  busPlate: string;
  route: string;
  timestamp: number;
  alcoholLevel: number;
  status: AlertStatus;
  contactedAt?: number;
  contactNote?: string;
  reviewedAt?: number;
  reviewConclusion?: ReviewConclusion;
  reviewNote?: string;
  disposalRecordId?: string;
}

export type ShiftType = 'morning' | 'evening';

export interface ShiftHandoverRecord {
  id: string;
  date: string;
  outgoingShift: ShiftType;
  incomingShift: ShiftType;
  outgoingGuard: string;
  incomingGuard: string;
  handoverNote: string;
  handoverTime: number;
  snapshot: {
    pendingVerifyCount: number;
    pendingReviewCount: number;
    suspendedCount: number;
    pendingVerify: Array<{ driverName: string; busPlate: string; route: string; passCode?: string }>;
    pendingReview: Array<{ driverName: string; busPlate: string; route: string; status: AlertStatus }>;
    suspended: Array<{ driverName: string; busPlate: string; route: string }>;
  };
}

export interface DisposalRecord {
  id: string;
  alertId: string;
  driverId: string;
  driverName: string;
  busPlate: string;
  route: string;
  alcoholLevel: number;
  conclusion: ReviewConclusion;
  contactNote?: string;
  reviewNote: string;
  createdAt: number;
  executed: boolean;
  executedAt?: number;
}

export interface TimelineEvent {
  type: 'test_failed' | 'alert_created' | 'contacted' | 'reviewed' | 'executed';
  timestamp: number;
  title: string;
  description?: string;
  operator?: string;
}

export interface AppState {
  drivers: Driver[];
  currentDriver: Driver | null;
  testStep: TestStep;
  testResult: 'passed' | 'failed' | null;
  records: TestRecord[];
  alerts: AlertRecord[];
  currentAlcoholLevel: number | null;
  currentPassCode: string | null;
  currentShift: ShiftType | null;
  shiftHandoverRecords: ShiftHandoverRecord[];
  disposalRecords: DisposalRecord[];
}

export interface AppActions {
  selectDriver: (driverId: string) => { ok: boolean; reason?: string };
  selectDriverByCard: (cardNumber: string) => CardScanResult;
  startTest: () => void;
  setTestStep: (step: TestStep) => void;
  completeTest: (result: 'passed' | 'failed', alcoholLevel: number) => void;
  resetTest: () => void;
  confirmRelease: () => void;
  resetDriverStatus: (driverId: string) => void;
  updateAlertContact: (alertId: string, note: string) => void;
  updateAlertReview: (alertId: string, conclusion: ReviewConclusion, note: string) => DisposalRecord | null;
  verifyPassCode: (code: string) => { valid: boolean; record?: TestRecord; alreadyReleased: boolean };
  markRecordReleased: (recordId: string) => void;
  exportTodayLedger: () => string;
  setCurrentShift: (shift: ShiftType) => void;
  createShiftHandover: (data: { outgoingGuard: string; incomingGuard: string; handoverNote: string }) => ShiftHandoverRecord;
  getPendingItems: () => {
    pendingVerify: TestRecord[];
    pendingReview: AlertRecord[];
    suspended: Driver[];
  };
  markDisposalExecuted: (disposalId: string) => void;
  parseQrContent: (content: string) => { passCode?: string; driverName?: string; busPlate?: string; error?: string };
  getDisposalTimeline: (disposalId: string) => TimelineEvent[];
}
