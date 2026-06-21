import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useSpeech } from './useSpeech';

export const useAlcoholTest = () => {
  const {
    currentDriver,
    testStep,
    startTest,
    setTestStep,
    completeTest,
    resetTest,
  } = useAppStore();

  const { speak } = useSpeech();
  const blowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blowProgress, setBlowProgress] = useState(0);
  const [waitCountdown, setWaitCountdown] = useState(0);

  const BLOW_DURATION = 5000;
  const WAIT_DURATION = 3000;

  const clearTimers = useCallback(() => {
    if (blowTimerRef.current) {
      clearTimeout(blowTimerRef.current);
      blowTimerRef.current = null;
    }
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  const simulateTestResult = useCallback((): { result: 'passed' | 'failed'; level: number } => {
    const random = Math.random();
    if (random < 0.85) {
      return {
        result: 'passed',
        level: Math.random() * 15,
      };
    } else {
      return {
        result: 'failed',
        level: 30 + Math.random() * 100,
      };
    }
  }, []);

  const beginTest = useCallback(() => {
    if (!currentDriver || testStep !== 'idle') return;
    startTest();
  }, [currentDriver, testStep, startTest]);

  const startBlowing = useCallback(() => {
    if (testStep !== 'blow') return;

    speak('请开始吹气，保持5秒');
    setBlowProgress(0);

    const startTime = Date.now();
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / BLOW_DURATION) * 100, 100);
      setBlowProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
      }
    }, 50);

    blowTimerRef.current = setTimeout(() => {
      clearInterval(progressInterval);
      setTestStep('waiting');
      speak('吹气完成，正在分析结果');
    }, BLOW_DURATION);
  }, [testStep, setTestStep, speak]);

  const analyzeResult = useCallback(() => {
    if (testStep !== 'waiting') return;

    setWaitCountdown(3);
    const countdownInterval = setInterval(() => {
      setWaitCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    waitTimerRef.current = setTimeout(() => {
      clearInterval(countdownInterval);
      const { result, level } = simulateTestResult();
      completeTest(result, level);

      if (result === 'passed') {
        speak('检测通过，可以进场');
      } else {
        speak('请到值班室复核');
      }
    }, WAIT_DURATION);
  }, [testStep, completeTest, simulateTestResult, speak]);

  const handleBack = useCallback(() => {
    clearTimers();
    resetTest();
  }, [clearTimers, resetTest]);

  useEffect(() => {
    if (testStep === 'blow' && blowProgress === 0) {
      startBlowing();
    }
  }, [testStep, blowProgress, startBlowing]);

  useEffect(() => {
    if (testStep === 'waiting' && waitCountdown === 0) {
      analyzeResult();
    }
  }, [testStep, waitCountdown, analyzeResult]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    beginTest,
    handleBack,
    blowProgress,
    waitCountdown,
    testStep,
    currentDriver,
  };
};
