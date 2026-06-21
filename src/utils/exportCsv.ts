import { TestRecord, AlertRecord } from '../types';
import { formatTime } from './formatTime';

export const exportRecordsToCSV = (records: TestRecord[], alerts: AlertRecord[]): string => {
  const headers = [
    '检测时间',
    '司机姓名',
    '车牌号码',
    '行驶线路',
    '检测结果',
    '酒精含量(mg/100ml)',
    '放行码',
    '是否已放行',
    '主管复核结论',
    '复核备注',
  ];

  const getAlertForRecord = (record: TestRecord) =>
    alerts.find(a => a.driverId === record.driverId &&
      Math.abs(a.timestamp - record.timestamp) < 60_000);

  const conclusionText = (c?: 'cleared' | 'suspended') =>
    c === 'cleared' ? '复核通过，可放行' :
    c === 'suspended' ? '禁止上岗，拦停' : '';

  const rows = records.map(r => {
    const alert = getAlertForRecord(r);
    return [
      formatTime(r.timestamp),
      r.driverName,
      r.busPlate,
      r.route,
      r.result === 'passed' ? '通过' : '待复核',
      r.alcoholLevel?.toFixed(1) ?? '',
      r.passCode ?? '',
      r.released ? '已放行' : '未放行',
      conclusionText(alert?.reviewConclusion ?? r.reviewConclusion),
      alert?.reviewNote ?? '',
    ].map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  return '\ufeff' + [headers.join(','), ...rows].join('\n');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
