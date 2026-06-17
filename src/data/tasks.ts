import type { FollowupTask } from '../types';
import { addDaysToDate, getTodayString } from '../utils/date';

export const mockTasks: FollowupTask[] = [
  {
    id: 'T001',
    patientId: 'P001',
    patientName: '张明华',
    createDate: addDaysToDate(getTodayString(), -3),
    scheduledDate: getTodayString(),
    type: 'phone',
    priority: 'urgent',
    status: 'pending',
    assignedTo: '李护士',
    notes: 'PSQI评分18分，极高风险，需尽快联系，询问近期用药情况'
  },
  {
    id: 'T002',
    patientId: 'P002',
    patientName: '李雪梅',
    createDate: addDaysToDate(getTodayString(), -7),
    scheduledDate: getTodayString(),
    type: 'phone',
    priority: 'high',
    status: 'pending',
    assignedTo: '王护士',
    notes: '高风险患者，复评时间已到，提醒按时复诊'
  },
  {
    id: 'T003',
    patientId: 'P009',
    patientName: '吴大伟',
    createDate: addDaysToDate(getTodayString(), -2),
    scheduledDate: addDaysToDate(getTodayString(), 1),
    type: 'clinic',
    priority: 'urgent',
    status: 'pending',
    assignedTo: '张医生',
    notes: 'OSAHS可疑，PSG检查预约，需加号复诊'
  },
  {
    id: 'T004',
    patientId: 'P003',
    patientName: '王建国',
    createDate: addDaysToDate(getTodayString(), -5),
    scheduledDate: addDaysToDate(getTodayString(), 2),
    type: 'sms',
    priority: 'high',
    status: 'pending',
    assignedTo: '随访专员小赵',
    notes: '发送短信提醒监测血糖和睡眠情况'
  },
  {
    id: 'T005',
    patientId: 'P010',
    patientName: '郑秀兰',
    createDate: addDaysToDate(getTodayString(), -1),
    scheduledDate: addDaysToDate(getTodayString(), 6),
    type: 'phone',
    priority: 'high',
    status: 'pending',
    assignedTo: '李护士',
    notes: '新患者，抑郁史，需密切关注'
  },
  {
    id: 'T006',
    patientId: 'P006',
    patientName: '赵丽娟',
    createDate: addDaysToDate(getTodayString(), -12),
    scheduledDate: addDaysToDate(getTodayString(), 2),
    type: 'phone',
    priority: 'medium',
    status: 'pending',
    assignedTo: '王护士',
    notes: '甲亢患者，询问睡眠变化'
  },
  {
    id: 'T007',
    patientId: 'P004',
    patientName: '陈美玲',
    createDate: addDaysToDate(getTodayString(), -10),
    scheduledDate: addDaysToDate(getTodayString(), 4),
    type: 'sms',
    priority: 'medium',
    status: 'pending',
    assignedTo: '随访专员小赵',
    notes: '发送睡眠卫生教育短信'
  },
  {
    id: 'T008',
    patientId: 'P005',
    patientName: '刘伟强',
    createDate: addDaysToDate(getTodayString(), -8),
    scheduledDate: addDaysToDate(getTodayString(), 6),
    type: 'phone',
    priority: 'medium',
    status: 'pending',
    assignedTo: '李护士',
    notes: '老年患者，冠心病史，常规随访'
  },
  {
    id: 'T009',
    patientId: 'P012',
    patientName: '马晓燕',
    createDate: addDaysToDate(getTodayString(), -20),
    scheduledDate: addDaysToDate(getTodayString(), -10),
    type: 'phone',
    priority: 'medium',
    status: 'cancelled',
    assignedTo: '王护士',
    notes: '多次联系不上，已标记为失访',
    completedDate: addDaysToDate(getTodayString(), -5)
  },
  {
    id: 'T010',
    patientId: 'P011',
    patientName: '钱国华',
    createDate: addDaysToDate(getTodayString(), -30),
    scheduledDate: addDaysToDate(getTodayString(), -5),
    type: 'clinic',
    priority: 'low',
    status: 'completed',
    assignedTo: '张医生',
    notes: '患者康复良好，顺利结案',
    completedDate: addDaysToDate(getTodayString(), -5)
  },
  {
    id: 'T011',
    patientId: 'P007',
    patientName: '孙志强',
    createDate: addDaysToDate(getTodayString(), -10),
    scheduledDate: addDaysToDate(getTodayString(), 20),
    type: 'sms',
    priority: 'low',
    status: 'pending',
    assignedTo: '随访专员小赵',
    notes: '低风险患者，发送常规随访问候'
  },
  {
    id: 'T012',
    patientId: 'P008',
    patientName: '周小芳',
    createDate: addDaysToDate(getTodayString(), -8),
    scheduledDate: addDaysToDate(getTodayString(), 22),
    type: 'sms',
    priority: 'low',
    status: 'pending',
    assignedTo: '随访专员小赵',
    notes: '低风险患者，发送睡眠健康科普'
  }
];
