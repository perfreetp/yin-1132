import { format, parseISO, addDays, differenceInDays, isBefore, isToday } from 'date-fns';

export { differenceInDays };
import { zhCN } from 'date-fns/locale';

export const formatDate = (date: string | Date, fmt: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: zhCN });
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
};

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const now = new Date();
  const diff = differenceInDays(d, now);

  if (isToday(d)) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 0 && diff < 7) return `${diff}天后`;
  if (diff < 0 && diff > -7) return `${Math.abs(diff)}天前`;
  return formatDate(d);
};

export const isOverdue = (date: string | Date): boolean => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(d, new Date()) && !isToday(d);
};

export const addDaysToDate = (date: string | Date, days: number): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(addDays(d, days), 'yyyy-MM-dd');
};

export const getTodayString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}分${secs}秒`;
};
