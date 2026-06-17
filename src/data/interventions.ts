import type { Intervention, ContactRecord } from '../types';
import { addDaysToDate, getTodayString } from '../utils/date';

export const mockInterventions: Intervention[] = [
  {
    id: 'I001',
    patientId: 'P001',
    date: addDaysToDate(getTodayString(), -60),
    type: 'both',
    medicationName: '右佐匹克隆片',
    medicationDosage: '3mg',
    medicationFrequency: '每晚1次，睡前服用',
    nonDrugType: 'CBT-I认知行为治疗',
    description: '睡眠卫生教育、刺激控制疗法、睡眠限制疗法'
  },
  {
    id: 'I002',
    patientId: 'P001',
    date: addDaysToDate(getTodayString(), -30),
    type: 'both',
    medicationName: '右佐匹克隆片',
    medicationDosage: '3mg',
    medicationFrequency: '每晚1次',
    nonDrugType: 'CBT-I认知行为治疗',
    description: '继续CBT-I治疗，每周1次'
  },
  {
    id: 'I003',
    patientId: 'P001',
    date: addDaysToDate(getTodayString(), -3),
    type: 'medication',
    medicationName: '右佐匹克隆片 + 米氮平',
    medicationDosage: '右佐匹克隆3mg qn，米氮平7.5mg qn',
    medicationFrequency: '每晚睡前服用'
  },
  {
    id: 'I004',
    patientId: 'P002',
    date: addDaysToDate(getTodayString(), -45),
    type: 'non_drug',
    nonDrugType: 'CBT-I认知行为治疗',
    description: '睡眠卫生教育，放松训练，正念冥想'
  },
  {
    id: 'I005',
    patientId: 'P002',
    date: addDaysToDate(getTodayString(), -20),
    type: 'non_drug',
    nonDrugType: '运动疗法',
    description: '每日有氧运动30分钟，避免睡前2小时运动'
  },
  {
    id: 'I006',
    patientId: 'P003',
    date: addDaysToDate(getTodayString(), -30),
    type: 'both',
    medicationName: '二甲双胍 + 佐匹克隆',
    medicationDosage: '二甲双胍500mg bid，佐匹克隆7.5mg qn',
    medicationFrequency: '二甲双胍早晚餐后，佐匹克隆睡前',
    nonDrugType: '糖尿病教育',
    description: '严格血糖控制，睡眠限制疗法'
  },
  {
    id: 'I007',
    patientId: 'P004',
    date: addDaysToDate(getTodayString(), -25),
    type: 'non_drug',
    nonDrugType: '睡眠卫生指导',
    description: '建立规律作息，避免咖啡因，减少屏幕时间'
  },
  {
    id: 'I008',
    patientId: 'P009',
    date: addDaysToDate(getTodayString(), -5),
    type: 'both',
    medicationName: '暂未处方',
    nonDrugType: '生活方式干预',
    description: '减肥、戒酒、侧卧位睡眠，预约PSG检查'
  },
  {
    id: 'I009',
    patientId: 'P010',
    date: addDaysToDate(getTodayString(), -3),
    type: 'both',
    medicationName: '舍曲林 + 唑吡坦',
    medicationDosage: '舍曲林50mg qd，唑吡坦10mg qn',
    medicationFrequency: '舍曲林早饭后，唑吡坦睡前',
    nonDrugType: '心理治疗',
    description: '精神科联合诊疗，抗抑郁治疗联合睡眠干预'
  },
  {
    id: 'I010',
    patientId: 'P006',
    date: addDaysToDate(getTodayString(), -15),
    type: 'non_drug',
    nonDrugType: '甲亢治疗 + 睡眠指导',
    description: '积极治疗原发病，普萘洛尔控制心率，睡眠卫生指导'
  }
];

export const mockContactRecords: ContactRecord[] = [
  {
    id: 'C001',
    patientId: 'P001',
    taskId: 'T001',
    contactDate: addDaysToDate(getTodayString(), -10),
    contactType: 'phone',
    contactResult: 'success',
    duration: 480,
    notes: '患者自述失眠加重，工作压力大，已嘱其按时服药，预约本周复诊',
    operator: '李护士'
  },
  {
    id: 'C002',
    patientId: 'P001',
    taskId: 'T001',
    contactDate: addDaysToDate(getTodayString(), -7),
    contactType: 'sms',
    contactResult: 'success',
    notes: '发送复诊提醒短信，患者已阅读',
    operator: '随访专员小赵'
  },
  {
    id: 'C003',
    patientId: 'P002',
    taskId: 'T002',
    contactDate: addDaysToDate(getTodayString(), -14),
    contactType: 'phone',
    contactResult: 'success',
    duration: 360,
    notes: '患者睡眠情况稳定，继续CBT-I治疗，预约2周后复评',
    operator: '王护士'
  },
  {
    id: 'C004',
    patientId: 'P003',
    taskId: 'T004',
    contactDate: addDaysToDate(getTodayString(), -7),
    contactType: 'phone',
    contactResult: 'no_answer',
    notes: '电话未接通，稍后再拨',
    operator: '随访专员小赵'
  },
  {
    id: 'C005',
    patientId: 'P003',
    taskId: 'T004',
    contactDate: addDaysToDate(getTodayString(), -7),
    contactType: 'sms',
    contactResult: 'success',
    notes: '发送血糖监测提醒和睡眠健康科普短信',
    operator: '随访专员小赵'
  },
  {
    id: 'C006',
    patientId: 'P003',
    taskId: 'T004',
    contactDate: addDaysToDate(getTodayString(), -6),
    contactType: 'phone',
    contactResult: 'success',
    duration: 240,
    notes: '已联系患者家属，告知注意事项',
    operator: '随访专员小赵'
  },
  {
    id: 'C007',
    patientId: 'P009',
    taskId: 'T003',
    contactDate: addDaysToDate(getTodayString(), -2),
    contactType: 'phone',
    contactResult: 'success',
    duration: 600,
    notes: '患者憋气症状加重，已紧急预约PSG检查，嘱其尽快就诊，必要时急诊',
    operator: '张医生'
  },
  {
    id: 'C008',
    patientId: 'P012',
    taskId: 'T009',
    contactDate: addDaysToDate(getTodayString(), -12),
    contactType: 'phone',
    contactResult: 'no_answer',
    notes: '电话未接通',
    operator: '王护士'
  },
  {
    id: 'C009',
    patientId: 'P012',
    taskId: 'T009',
    contactDate: addDaysToDate(getTodayString(), -10),
    contactType: 'phone',
    contactResult: 'no_answer',
    notes: '第二次拨打未接通',
    operator: '王护士'
  },
  {
    id: 'C010',
    patientId: 'P012',
    taskId: 'T009',
    contactDate: addDaysToDate(getTodayString(), -8),
    contactType: 'phone',
    contactResult: 'wrong_number',
    notes: '电话为空号，已标记为失访',
    operator: '王护士'
  },
  {
    id: 'C011',
    patientId: 'P011',
    taskId: 'T010',
    contactDate: addDaysToDate(getTodayString(), -5),
    contactType: 'clinic',
    contactResult: 'success',
    duration: 900,
    notes: '患者复诊，PSQI评分2分，睡眠恢复良好，准予结案',
    operator: '张医生'
  },
  {
    id: 'C012',
    patientId: 'P004',
    taskId: 'T007',
    contactDate: addDaysToDate(getTodayString(), -10),
    contactType: 'sms',
    contactResult: 'success',
    notes: '发送睡眠卫生教育系列短信第1/3期',
    operator: '随访专员小赵'
  }
];
