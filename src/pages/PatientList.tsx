import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, ClipboardList, Phone, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../store';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { PatientModal } from '../components/PatientModal';
import { formatDate, formatRelative, isOverdue } from '../utils/date';

export const PatientList = () => {
  const navigate = useNavigate();
  const {
    searchQuery,
    filterRisk,
    filterStatus,
    setSearchQuery,
    setFilterRisk,
    setFilterStatus,
    getFilteredPatients,
    getPatientById,
    getTasksByPatientId
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRiskFilter, setShowRiskFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const handlePhoneFollowup = (patientId: string) => {
    const tasks = getTasksByPatientId(patientId);
    const pendingTask = tasks.find(t => t.status === 'pending');
    if (pendingTask) {
      navigate(`/followup?taskId=${pendingTask.id}&patientId=${patientId}`);
    } else {
      navigate(`/followup?patientId=${patientId}`);
    }
  };

  const patients = getFilteredPatients();

  const riskOptions = [
    { value: 'all', label: '全部风险' },
    { value: 'low', label: '低风险' },
    { value: 'medium', label: '中风险' },
    { value: 'high', label: '高风险' },
    { value: 'extreme', label: '极高风险' }
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'active', label: '管理中' },
    { value: 'discharged', label: '已结案' },
    { value: 'lost', label: '失访' }
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '管理中';
      case 'discharged': return '已结案';
      case 'lost': return '失访';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'discharged': return 'bg-green-50 text-green-700 border-green-200';
      case 'lost': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-xl w-full">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索患者姓名、ID、电话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
            <button
              onClick={() => { setShowRiskFilter(!showRiskFilter); setShowStatusFilter(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-700">
                {riskOptions.find((o) => o.value === filterRisk)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showRiskFilter && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-40">
                {riskOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterRisk(option.value); setShowRiskFilter(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                      filterRisk === option.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => { setShowStatusFilter(!showStatusFilter); setShowRiskFilter(false); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="text-sm text-slate-700">
                {statusOptions.find((o) => o.value === filterStatus)?.label}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            {showStatusFilter && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-40">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilterStatus(option.value); setShowStatusFilter(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                      filterStatus === option.value ? 'text-blue-600 font-medium bg-blue-50' : 'text-slate-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            <span>新建患者</span>
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '管理中患者', value: patients.filter(p => p.status === 'active').length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '极高风险', value: patients.filter(p => p.riskLevel === 'extreme').length, color: 'text-red-600', bg: 'bg-red-50' },
          { label: '高风险', value: patients.filter(p => p.riskLevel === 'high').length, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: '今日待随访', value: patients.filter(p => p.nextFollowupDate === formatDate(new Date()) && p.status === 'active').length, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <div className={`w-3 h-3 rounded-full ${stat.color} opacity-50`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 患者列表 */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">患者信息</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">PSQI评分</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">风险等级</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">末次评估</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">下次随访</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">状态</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {patients.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedPatient(selectedPatient === patient.id ? null : patient.id)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white ${
                        patient.gender === 'male' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                      }`}>
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{patient.name}</div>
                        <div className="text-xs text-slate-500">
                          {patient.id} · {patient.gender === 'male' ? '男' : '女'} · {patient.age}岁 · {patient.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ScoreDisplay score={patient.latestPsqiScore} size="sm" showLabel={false} />
                  </td>
                  <td className="px-6 py-4">
                    <RiskBadge level={patient.riskLevel} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {patient.latestAssessmentDate ? formatDate(patient.latestAssessmentDate) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {patient.nextFollowupDate ? (
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          isOverdue(patient.nextFollowupDate) ? 'text-red-600' : 'text-slate-700'
                        }`}>
                          {formatDate(patient.nextFollowupDate)}
                        </span>
                        <span className={`text-xs ${
                          isOverdue(patient.nextFollowupDate) ? 'text-red-500' : 'text-slate-400'
                        }`}>
                          {formatRelative(patient.nextFollowupDate)}
                          {isOverdue(patient.nextFollowupDate) && ' · 已逾期'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">未安排</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(patient.status)}`}>
                      {getStatusLabel(patient.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/assessment/${patient.id}`)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors group/btn"
                        title="PSQI评估"
                      >
                        <ClipboardList className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handlePhoneFollowup(patient.id)}
                        className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                        title="电话随访"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedPatient(selectedPatient === patient.id ? null : patient.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          selectedPatient === patient.id
                            ? 'text-white bg-purple-500'
                            : 'text-purple-500 hover:bg-purple-50'
                        }`}
                        title="查看详情"
                      >
                        {selectedPatient === patient.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {patients.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">未找到匹配的患者</p>
          </div>
        )}
      </div>

      {/* 患者详情展开 */}
      {selectedPatient && (() => {
        const patient = getPatientById(selectedPatient);
        if (!patient) return null;
        const assessments = useAppStore.getState().getAssessmentsByPatientId(selectedPatient);
        const interventions = useAppStore.getState().getInterventionsByPatientId(selectedPatient);

        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-4">基本信息</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">患者ID</span>
                    <span className="text-slate-800 font-mono">{patient.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">联系电话</span>
                    <span className="text-slate-800">{patient.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">身份证号</span>
                    <span className="text-slate-800 font-mono">{patient.idCard || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">现住址</span>
                    <span className="text-slate-800 text-right max-w-[200px]">{patient.address || '-'}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-500 block mb-1">既往病史</span>
                    <span className="text-slate-700">{patient.medicalHistory || '无'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">过敏史</span>
                    <span className="text-slate-700">{patient.allergyHistory || '无'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4">最近评估</h3>
                {assessments.length > 0 ? (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-600">{formatDate(assessments[0].assessmentDate)}</span>
                        <ScoreDisplay score={assessments[0].totalScore} size="md" />
                      </div>
                      <p className="text-sm text-slate-700 mb-2">
                        <span className="font-medium">主诉：</span>{assessments[0].chiefComplaint}
                      </p>
                      {assessments[0].doctorConclusion && (
                        <p className="text-sm text-slate-600 bg-white/60 rounded-lg p-2">
                          <span className="font-medium">医生结论：</span>{assessments[0].doctorConclusion}
                        </p>
                      )}
                    </div>
                    {assessments.length > 1 && (
                      <div className="text-sm text-slate-500">
                        历史评估 {assessments.length} 次
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无评估记录</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 mb-4">干预方案</h3>
                {interventions.length > 0 ? (
                  <div className="space-y-3">
                    {interventions.slice(0, 3).map((iv) => (
                      <div key={iv.id} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            {iv.type === 'medication' ? '药物治疗' : iv.type === 'non_drug' ? '非药物治疗' : '联合治疗'}
                          </span>
                          <span className="text-xs text-slate-500">{formatDate(iv.date)}</span>
                        </div>
                        {iv.medicationName && (
                          <p className="text-sm text-slate-700 mb-1">
                            <span className="font-medium">用药：</span>{iv.medicationName} {iv.medicationDosage}
                          </p>
                        )}
                        {iv.nonDrugType && (
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">方案：</span>{iv.nonDrugType}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无干预记录</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      <PatientModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
