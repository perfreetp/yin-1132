import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, PsqiAssessment, FollowupTask, Intervention, ContactRecord, PsqiScores } from '../types';
import { mockPatients } from '../data/patients';
import { mockAssessments } from '../data/assessments';
import { mockTasks } from '../data/tasks';
import { mockInterventions, mockContactRecords } from '../data/interventions';
import { calculatePsqiTotal, getRiskLevel, getFollowupInterval, isPsqiComplete } from '../utils/psqi';
import { addDaysToDate, getTodayString } from '../utils/date';

interface AppState {
  patients: Patient[];
  assessments: PsqiAssessment[];
  tasks: FollowupTask[];
  interventions: Intervention[];
  contactRecords: ContactRecord[];
  currentUser: { name: string; role: string };
  searchQuery: string;
  filterRisk: string;
  filterStatus: string;
}

interface AppActions {
  setSearchQuery: (query: string) => void;
  setFilterRisk: (risk: string) => void;
  setFilterStatus: (status: string) => void;
  addPatient: (patient: Omit<Patient, 'id' | 'createDate' | 'riskLevel' | 'latestPsqiScore' | 'status'>) => void;
  addAssessment: (patientId: string, scores: PsqiScores, formData: {
    chiefComplaint: string;
    symptoms: string;
    aggravatingFactors: string;
    relievingFactors: string;
    doctorConclusion: string;
  }) => { success: boolean; message?: string };
  updateTaskStatus: (taskId: string, status: FollowupTask['status'], notes?: string) => void;
  addContactRecord: (record: Omit<ContactRecord, 'id'>) => void;
  addIntervention: (intervention: Omit<Intervention, 'id'>) => void;
  getPatientById: (id: string) => Patient | undefined;
  getAssessmentsByPatientId: (patientId: string) => PsqiAssessment[];
  getTasksByPatientId: (patientId: string) => FollowupTask[];
  getInterventionsByPatientId: (patientId: string) => Intervention[];
  getContactRecordsByPatientId: (patientId: string) => ContactRecord[];
  getFilteredPatients: () => Patient[];
  getPendingTasks: () => FollowupTask[];
  getHighRiskPatients: () => Patient[];
  getOverdueTasks: () => FollowupTask[];
  getTodayTasks: () => FollowupTask[];
}

const generateId = (prefix: string) => {
  return `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 4)}`;
};

const createFollowupTask = (patientId: string, patientName: string, riskLevel: string, assessmentDate: string): FollowupTask => {
  const interval = getFollowupInterval(riskLevel as any);
  const scheduledDate = addDaysToDate(assessmentDate, interval);
  const priorityMap: Record<string, FollowupTask['priority']> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    extreme: 'urgent'
  };

  return {
    id: generateId('T'),
    patientId,
    patientName,
    createDate: getTodayString(),
    scheduledDate,
    type: 'phone',
    priority: priorityMap[riskLevel] || 'medium',
    status: 'pending',
    assignedTo: '李护士'
  };
};

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      patients: mockPatients,
      assessments: mockAssessments,
      tasks: mockTasks,
      interventions: mockInterventions,
      contactRecords: mockContactRecords,
      currentUser: { name: '张医生', role: '医生' },
      searchQuery: '',
      filterRisk: 'all',
      filterStatus: 'all',

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterRisk: (risk) => set({ filterRisk: risk }),
      setFilterStatus: (status) => set({ filterStatus: status }),

      addPatient: (patientData) => {
        const newPatient: Patient = {
          ...patientData,
          id: generateId('P'),
          createDate: getTodayString(),
          riskLevel: 'low',
          latestPsqiScore: 0,
          status: 'active'
        };
        set((state) => ({
          patients: [...state.patients, newPatient]
        }));
      },

      addAssessment: (patientId, scores, formData) => {
        if (!isPsqiComplete(scores)) {
          return { success: false, message: '请完成所有7个PSQI分项评分后再保存' };
        }
        if (!formData.chiefComplaint.trim()) {
          return { success: false, message: '请填写失眠主诉' };
        }

        const totalScore = calculatePsqiTotal(scores);
        const riskLevel = getRiskLevel(totalScore);
        const today = getTodayString();

        const newAssessment: PsqiAssessment = {
          id: generateId('A'),
          patientId,
          assessmentDate: today,
          sleepQuality: scores.sleepQuality as number,
          sleepLatency: scores.sleepLatency as number,
          sleepDuration: scores.sleepDuration as number,
          sleepEfficiency: scores.sleepEfficiency as number,
          sleepDisturbance: scores.sleepDisturbance as number,
          hypnoticDrug: scores.hypnoticDrug as number,
          daytimeDysfunction: scores.daytimeDysfunction as number,
          totalScore,
          ...formData
        };

        const newTask = createFollowupTask(patientId, '', riskLevel, today);

        set((state) => {
          const patient = state.patients.find((p) => p.id === patientId);
          const updatedPatients = state.patients.map((p) =>
            p.id === patientId
              ? {
                  ...p,
                  latestPsqiScore: totalScore,
                  riskLevel,
                  latestAssessmentDate: today,
                  nextFollowupDate: newTask.scheduledDate
                }
              : p
          );

          newTask.patientName = patient?.name || '';

          return {
            assessments: [...state.assessments, newAssessment],
            patients: updatedPatients,
            tasks: [...state.tasks, newTask]
          };
        });

        return { success: true };
      },

      updateTaskStatus: (taskId, status, notes) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status,
                  notes: notes || task.notes,
                  completedDate: status === 'completed' ? getTodayString() : task.completedDate
                }
              : task
          )
        }));
      },

      addContactRecord: (record) => {
        const newRecord: ContactRecord = {
          ...record,
          id: generateId('C')
        };
        set((state) => ({
          contactRecords: [...state.contactRecords, newRecord]
        }));
      },

      addIntervention: (intervention) => {
        const newIntervention: Intervention = {
          ...intervention,
          id: generateId('I')
        };
        set((state) => ({
          interventions: [...state.interventions, newIntervention]
        }));
      },

      getPatientById: (id) => get().patients.find((p) => p.id === id),
      getAssessmentsByPatientId: (patientId) =>
        get().assessments.filter((a) => a.patientId === patientId).sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate)),
      getTasksByPatientId: (patientId) =>
        get().tasks.filter((t) => t.patientId === patientId).sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)),
      getInterventionsByPatientId: (patientId) =>
        get().interventions.filter((i) => i.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date)),
      getContactRecordsByPatientId: (patientId) =>
        get().contactRecords.filter((c) => c.patientId === patientId).sort((a, b) => b.contactDate.localeCompare(a.contactDate)),

      getFilteredPatients: () => {
        const { patients, searchQuery, filterRisk, filterStatus } = get();
        return patients.filter((patient) => {
          const matchSearch =
            patient.name.includes(searchQuery) ||
            patient.id.includes(searchQuery) ||
            patient.phone.includes(searchQuery);
          const matchRisk = filterRisk === 'all' || patient.riskLevel === filterRisk;
          const matchStatus = filterStatus === 'all' || patient.status === filterStatus;
          return matchSearch && matchRisk && matchStatus;
        });
      },

      getPendingTasks: () => get().tasks.filter((t) => t.status === 'pending'),
      getHighRiskPatients: () => get().patients.filter((p) => p.riskLevel === 'extreme' || p.riskLevel === 'high'),
      getOverdueTasks: () => {
        const today = getTodayString();
        return get().tasks.filter((t) => t.status === 'pending' && t.scheduledDate < today);
      },
      getTodayTasks: () => {
        const today = getTodayString();
        return get().tasks.filter((t) => t.scheduledDate === today && t.status === 'pending');
      }
    }),
    {
      name: 'sleep-clinic-storage',
      partialize: (state) => ({
        patients: state.patients,
        assessments: state.assessments,
        tasks: state.tasks,
        interventions: state.interventions,
        contactRecords: state.contactRecords
      })
    }
  )
);
