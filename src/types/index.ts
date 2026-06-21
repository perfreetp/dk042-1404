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
  timestamp: number;
  result: 'passed' | 'failed';
  alcoholLevel?: number;
  passCode?: string;
}

export type TestStep = 'idle' | 'blow' | 'waiting' | 'result';

export interface AppState {
  drivers: Driver[];
  currentDriver: Driver | null;
  testStep: TestStep;
  testResult: 'passed' | 'failed' | null;
  records: TestRecord[];
  currentAlcoholLevel: number | null;
  currentPassCode: string | null;
}

export interface AppActions {
  selectDriver: (driverId: string) => void;
  selectDriverByCard: (cardNumber: string) => void;
  startTest: () => void;
  setTestStep: (step: TestStep) => void;
  completeTest: (result: 'passed' | 'failed', alcoholLevel: number) => void;
  resetTest: () => void;
  confirmRelease: () => void;
  resetDriverStatus: (driverId: string) => void;
}
