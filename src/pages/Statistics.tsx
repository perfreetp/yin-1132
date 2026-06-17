import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Users, UserCheck, UserX, Activity, CalendarCheck, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store';
import { formatDate } from '../utils/date';
import type { Patient, PsqiAssessment, FollowupTask, Intervention } from '../types';

const RISK_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  extreme: '#ef4444'
};

const RISK_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  extreme: '极高风险'
};

const GENDER_LABELS: Record<string, string> = {
  male: '男性',
  female: '女性'
};

const INTERVENTION_LABELS: Record<string, string> = {
  medication: '药物治疗',
  non_drug: '非药物治疗',
  both: '联合治疗'
};

export const Statistics = () => {
  const { patients, assessments, tasks, interventions } = useAppStore();

  const stats = useMemo(() => {
    const totalPatients = patients.length;
    const activePatients = patients.filter((p: Patient) => p.status === 'active').length;
    const dischargedPatients = patients.filter((p: Patient) => p.status === 'discharged').length;
    const avgPsqi = patients.length > 0
      ? (patients.reduce((sum: number, p: Patient) => sum + p.latestPsqiScore, 0) / patients.length).toFixed(1)
      : '0';
    
    const completedTasks = tasks.filter((t: FollowupTask) => t.status === 'completed').length;
    const totalTasks = tasks.filter((t: FollowupTask) => t.status !== 'cancelled').length;
    const followupRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0';

    return {
      totalPatients,
      activePatients,
      dischargedPatients,
      avgPsqi,
      followupRate
    };
  }, [patients, tasks]);

  const riskData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, extreme: 0 };
    patients.forEach((p: Patient) => {
      counts[p.riskLevel] = (counts[p.riskLevel] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: RISK_LABELS[name] || name,
      value,
      color: RISK_COLORS[name]
    }));
  }, [patients]);

  const ageData = useMemo(() => {
    const ageGroups = [
      { name: '18-30岁', min: 18, max: 30, count: 0 },
      { name: '31-40岁', min: 31, max: 40, count: 0 },
      { name: '41-50岁', min: 41, max: 50, count: 0 },
      { name: '51-60岁', min: 51, max: 60, count: 0 },
      { name: '60岁以上', min: 61, max: 200, count: 0 }
    ];
    
    patients.forEach((p: Patient) => {
      const group = ageGroups.find(g => p.age >= g.min && p.age <= g.max);
      if (group) group.count++;
    });
    
    return ageGroups.map(g => ({ name: g.name, value: g.count }));
  }, [patients]);

  const genderData = useMemo(() => {
    const counts: Record<string, number> = { male: 0, female: 0 };
    patients.forEach((p: Patient) => {
      counts[p.gender] = (counts[p.gender] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: GENDER_LABELS[name] || name,
      value,
      color: name === 'male' ? '#3b82f6' : '#ec4899'
    }));
  }, [patients]);

  const psqiTrendData = useMemo(() => {
    const months: { name: string; avgScore: number; count: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = formatDate(date, 'yyyy-MM');
      months.push({ name: monthStr, avgScore: 0, count: 0 });
    }
    
    assessments.forEach((a: PsqiAssessment) => {
      const assessmentMonth = a.assessmentDate.substring(0, 7);
      const monthData = months.find(m => m.name === assessmentMonth);
      if (monthData) {
        monthData.avgScore += a.totalScore;
        monthData.count++;
      }
    });
    
    return months.map(m => ({
      name: m.name.substring(5) + '月',
      avgScore: m.count > 0 ? parseFloat((m.avgScore / m.count).toFixed(1)) : 0
    }));
  }, [assessments]);

  const followupRateData = useMemo(() => {
    const months: { name: string; completed: number; total: number }[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = formatDate(date, 'yyyy-MM');
      months.push({ name: monthStr, completed: 0, total: 0 });
    }
    
    tasks.forEach((t: FollowupTask) => {
      if (t.status === 'cancelled') return;
      const taskMonth = t.scheduledDate.substring(0, 7);
      const monthData = months.find(m => m.name === taskMonth);
      if (monthData) {
        monthData.total++;
        if (t.status === 'completed') monthData.completed++;
      }
    });
    
    return months.map(m => ({
      name: m.name.substring(5) + '月',
      完成率: m.total > 0 ? parseFloat(((m.completed / m.total) * 100).toFixed(1)) : 0
    }));
  }, [tasks]);

  const interventionData = useMemo(() => {
    const counts: Record<string, number> = { medication: 0, non_drug: 0, both: 0 };
    interventions.forEach((i: Intervention) => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: INTERVENTION_LABELS[name] || name,
      value
    }));
  }, [interventions]);

  const statCards = [
    { label: '总患者数', value: stats.totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '管理中', value: stats.activePatients, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: '已结案', value: stats.dischargedPatients, icon: UserX, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: '平均PSQI', value: stats.avgPsqi, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: '随访完成率', value: `${stats.followupRate}%`, icon: CalendarCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">统计报表</h2>
          <p className="text-sm text-slate-500">睡眠门诊患者数据概览</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-sm text-slate-500 mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">风险分层分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">年龄分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="人数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">性别分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">PSQI评分趋势（近6个月）</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={psqiTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 21]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#f97316"
                  strokeWidth={3}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  name="平均PSQI评分"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">随访完成率（近6个月）</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={followupRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value: number) => [`${value}%`, '完成率']} />
                <Bar dataKey="完成率" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">干预类型分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interventionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="干预次数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
