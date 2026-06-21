export interface Driver {
  id: string;
  name: string;
  avatar: string;
  cardNumber: string;
  busPlate: string;
  route: string;
  status: 'waiting' | 'testing' | 'passed' | 'failed';
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
}

export type TestStep = 'idle' | 'blow' | 'waiting' | 'result';

export type CardScanResult =
  | { type: 'success'; driver: Driver }
  | { type: 'not_found'; cardNumber: string }
  | { type: 'already_tested'; driver: Driver };

export type AlertStatus = 'pending' | 'contacted' | 'reviewed';

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
  reviewedAt?: number;
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
}

export interface AppActions {
  selectDriver: (driverId: string) => void;
  selectDriverByCard: (cardNumber: string) => CardScanResult;
  startTest: () => void;
  setTestStep: (step: TestStep) => void;
  completeTest: (result: 'passed' | 'failed', alcoholLevel: number) => void;
  resetTest: () => void;
  confirmRelease: () => void;
  resetDriverStatus: (driverId: string) => void;
  updateAlertStatus: (alertId: string, status: AlertStatus) => void;
  verifyPassCode: (code: string) => { valid: boolean; record?: TestRecord; alreadyReleased: boolean };
  markRecordReleased: (recordId: string) => void;
}
