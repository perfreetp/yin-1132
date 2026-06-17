export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ContactResult = 'success' | 'no_answer' | 'rejected' | 'wrong_number';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type PatientStatus = 'active' | 'discharged' | 'lost';

export interface Patient {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: number;
  phone: string;
  idCard?: string;
  address?: string;
  medicalHistory?: string;
  allergyHistory?: string;
  createDate: string;
  riskLevel: RiskLevel;
  latestPsqiScore: number;
  latestAssessmentDate?: string;
  nextFollowupDate?: string;
  status: PatientStatus;
}

export interface PsqiAssessment {
  id: string;
  patientId: string;
  assessmentDate: string;
  sleepQuality: number;
  sleepLatency: number;
  sleepDuration: number;
  sleepEfficiency: number;
  sleepDisturbance: number;
  hypnoticDrug: number;
  daytimeDysfunction: number;
  totalScore: number;
  chiefComplaint: string;
  symptoms: string;
  aggravatingFactors?: string;
  relievingFactors?: string;
  doctorConclusion?: string;
}

export interface FollowupTask {
  id: string;
  patientId: string;
  patientName: string;
  createDate: string;
  scheduledDate: string;
  type: 'phone' | 'sms' | 'clinic' | 'home';
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  notes?: string;
  completedDate?: string;
}

export interface Intervention {
  id: string;
  patientId: string;
  date: string;
  type: 'medication' | 'non_drug' | 'both';
  medicationName?: string;
  medicationDosage?: string;
  medicationFrequency?: string;
  nonDrugType?: string;
  description?: string;
}

export interface ContactRecord {
  id: string;
  patientId: string;
  taskId?: string;
  contactDate: string;
  contactType: 'phone' | 'sms' | 'wechat' | 'clinic';
  contactResult: ContactResult;
  duration?: number;
  notes?: string;
  operator: string;
}

export interface PsqiScores {
  sleepQuality: number;
  sleepLatency: number;
  sleepDuration: number;
  sleepEfficiency: number;
  sleepDisturbance: number;
  hypnoticDrug: number;
  daytimeDysfunction: number;
}
