import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, TrendingDown, TrendingUp, Minus, Save, User, FileText, Search, Plus, Stethoscope } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAppStore } from '../store';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { psqiQuestions, calculatePsqiTotal, getRiskLevel, getFollowupInterval, isPsqiComplete, getIncompleteItems } from '../utils/psqi';
import type { PsqiScores } from '../types';
import { formatDate, addDaysToDate, getTodayString } from '../utils/date';
import { PatientModal } from '../components/PatientModal';

export const Assessment = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { getPatientById, getAssessmentsByPatientId, addAssessment, getFilteredPatients } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPatientModalOpen, setIsNewPatientModalOpen] = useState(false);
  const [showError, setShowError] = useState('');

  const patient = patientId ? getPatientById(patientId) : undefined;
  const assessments = patientId ? getAssessmentsByPatientId(patientId) : [];
  const lastAssessment = assessments[0];

  const [scores, setScores] = useState<PsqiScores>({
    sleepQuality: null,
    sleepLatency: null,
    sleepDuration: null,
    sleepEfficiency: null,
    sleepDisturbance: null,
    hypnoticDrug: null,
    daytimeDysfunction: null
  });

  const [formData, setFormData] = useState({
    chiefComplaint: '',
    symptoms: '',
    aggravatingFactors: '',
    relievingFactors: '',
    doctorConclusion: ''
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const totalScore = useMemo(() => calculatePsqiTotal(scores), [scores]);
  const riskLevel = useMemo(() => getRiskLevel(totalScore), [totalScore]);
  const followupDays = useMemo(() => getFollowupInterval(riskLevel), [riskLevel]);
  const suggestedFollowupDate = useMemo(() => addDaysToDate(getTodayString(), followupDays), [followupDays]);
  const isComplete = useMemo(() => isPsqiComplete(scores), [scores]);
  const incompleteItems = useMemo(() => getIncompleteItems(scores), [scores]);

  const scoreChange = lastAssessment ? totalScore - lastAssessment.totalScore : 0;

  const allPatients = useMemo(() => {
    const patients = getFilteredPatients();
    if (!searchQuery.trim()) return patients;
    return patients.filter(p => 
      p.name.includes(searchQuery) || 
      p.id.includes(searchQuery) || 
      p.phone.includes(searchQuery)
    );
  }, [searchQuery, getFilteredPatients]);

  const handleScoreChange = (key: keyof PsqiScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
    setShowError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    const result = addAssessment(patientId, scores, formData);
    if (!result.success) {
      setShowError(result.message || '保存失败');
      return;
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/patients');
    }, 1500);
  };

  const trendChartData = assessments.slice(0, 6).reverse().map((a, idx) => ({
    name: `第${assessments.length - idx}次`,
    date: formatDate(a.assessmentDate),
    score: a.totalScore
  }));

  const radarData = psqiQuestions.map((q) => ({
    subject: q.label.replace(/^\d+\.\s*/, ''),
    current: scores[q.key as keyof PsqiScores] ?? 0,
    previous: lastAssessment ? lastAssessment[q.key as keyof PsqiScores] : 0,
    fullMark: 3
  }));

  const componentScores = psqiQuestions.map((q) => ({
    key: q.key,
    label: q.label,
    current: scores[q.key as keyof PsqiScores],
    previous: lastAssessment ? lastAssessment[q.key as keyof PsqiScores] : null
  }));

  if (!patientId || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800">选择患者开始PSQI评估</h1>
          </div>
          <button
            onClick={() => setIsNewPatientModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200"
          >
            <Plus className="w-5 h-5" />
            <span>新建患者</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-2">PSQI量表评估</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                请先从下方列表选择一位患者，或点击右上角"新建患者"按钮创建新档案。
                <br />
                评估包含7个分项，全部完成后才能保存，系统将自动计算总分和风险等级。
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索患者姓名、ID、电话..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm text-base"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {allPatients.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/assessment/${p.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white ${
                    p.gender === 'male' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                  }`}>
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-800 flex items-center gap-2">
                      {p.name}
                      <RiskBadge level={p.riskLevel} size="sm" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {p.id} · {p.gender === 'male' ? '男' : '女'} · {p.age}岁 · {p.phone}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {p.latestPsqiScore > 0 && (
                    <div className="text-right">
                      <div className="text-xs text-slate-400">最近PSQI</div>
                      <ScoreDisplay score={p.latestPsqiScore} size="sm" showLabel={false} />
                    </div>
                  )}
                  <div className="p-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {allPatients.length === 0 && (
            <div className="py-16 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">未找到匹配的患者</p>
            </div>
          )}
        </div>

        <PatientModal isOpen={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/assessment')}
            className="p-2 hover:bg-white rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-slate-800">PSQI量表评估</h1>
              <RiskBadge level={riskLevel} size="sm" />
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <User className="w-4 h-4" />
              <span>{patient.name}</span>
              <span className="text-slate-300">|</span>
              <span>{patient.gender === 'male' ? '男' : '女'}</span>
              <span className="text-slate-300">|</span>
              <span>{patient.age}岁</span>
              <span className="text-slate-300">|</span>
              <span>{patient.id}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {lastAssessment && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100">
              <span className="text-sm text-slate-500">历史最高</span>
              <span className="text-xl font-bold text-slate-800 font-mono">{lastAssessment.totalScore}</span>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                scoreChange < 0 ? 'text-green-500' : scoreChange > 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {scoreChange < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : scoreChange > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {scoreChange !== 0 && (
                  <span>{scoreChange > 0 ? '+' : ''}{scoreChange}</span>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-100 px-5 py-3">
            <ScoreDisplay score={totalScore} size="lg" />
          </div>
        </div>
      </div>

      {showError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-700 font-medium">{showError}</p>
            {incompleteItems.length > 0 && (
              <p className="text-red-600 text-sm mt-1">
                未完成的分项：{incompleteItems.join('、')}
              </p>
            )}
          </div>
        </div>
      )}

      {!isComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-700 font-medium">
              还有 {incompleteItems.length} 个分项未完成
            </p>
            <p className="text-amber-600 text-sm mt-1">
              请完成：{incompleteItems.join('、')}
            </p>
          </div>
          <div className="ml-auto text-sm text-amber-600 font-medium">
            {7 - incompleteItems.length} / 7
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                匹兹堡睡眠质量指数（PSQI）
              </h2>

              <div className="space-y-8">
                {psqiQuestions.map((question, qIndex) => {
                  const currentScore = scores[question.key as keyof PsqiScores];
                  const isAnswered = currentScore !== null;
                  return (
                    <div key={question.key} className={`group ${!isAnswered ? 'opacity-90' : ''}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg ${
                          isAnswered
                            ? 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-100'
                            : 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-100'
                        }`}>
                          {qIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-medium mb-1 ${
                            isAnswered ? 'text-slate-800' : 'text-slate-600'
                          }`}>
                            {question.label}
                            {!isAnswered && <span className="text-amber-500 ml-2 text-sm">*未完成</span>}
                          </h3>
                          <p className="text-sm text-slate-500">{question.description}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-2xl font-bold font-mono ${
                            currentScore === null ? 'text-slate-300' :
                            currentScore >= 2 ? 'text-red-500' :
                            currentScore >= 1 ? 'text-orange-500' : 'text-green-500'
                          }`}>
                            {currentScore !== null ? currentScore : '-'}
                          </span>
                          <span className="text-sm text-slate-400">/3</span>
                        </div>
                      </div>

                      <div className="ml-12 grid grid-cols-4 gap-3">
                        {question.options.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleScoreChange(question.key as keyof PsqiScores, option.value)}
                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              currentScore === option.value
                                ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                                : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                                currentScore === option.value
                                  ? 'border-blue-500 bg-blue-500'
                                  : 'border-slate-300'
                              }`}>
                                {currentScore === option.value && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-slate-400 mb-1">{option.value}分</div>
                                <div className={`text-sm ${
                                  currentScore === option.value
                                    ? 'text-blue-700 font-medium'
                                    : 'text-slate-700'
                                }`}>
                                  {option.label}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">临床信息</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    失眠主诉 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.chiefComplaint}
                    onChange={(e) => {
                      setFormData({ ...formData, chiefComplaint: e.target.value });
                      setShowError('');
                    }}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={2}
                    placeholder="请描述患者的主要失眠症状及持续时间..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    症状详细描述
                  </label>
                  <textarea
                    value={formData.symptoms}
                    onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="入睡困难、夜间觉醒、早醒、多梦、白天功能影响等..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      加重因素
                    </label>
                    <input
                      type="text"
                      value={formData.aggravatingFactors}
                      onChange={(e) => setFormData({ ...formData, aggravatingFactors: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="如：工作压力、咖啡因、熬夜等"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      缓解因素
                    </label>
                    <input
                      type="text"
                      value={formData.relievingFactors}
                      onChange={(e) => setFormData({ ...formData, relievingFactors: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="如：运动、泡脚、冥想等"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    医生结论与处理意见
                  </label>
                  <textarea
                    value={formData.doctorConclusion}
                    onChange={(e) => setFormData({ ...formData, doctorConclusion: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                    placeholder="诊断结论、治疗方案、用药建议、注意事项..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`bg-gradient-to-br ${
              riskLevel === 'extreme' ? 'from-red-500 to-red-600' :
              riskLevel === 'high' ? 'from-orange-500 to-orange-600' :
              riskLevel === 'medium' ? 'from-amber-500 to-amber-600' :
              'from-green-500 to-green-600'
            } rounded-2xl p-6 text-white shadow-xl`}>
              <div className="text-center">
                <div className="text-sm opacity-90 mb-2">PSQI 总分</div>
                <div className="text-6xl font-bold font-mono mb-2">
                  {isComplete ? totalScore : '-'}
                </div>
                <div className="text-sm opacity-75">/ 21</div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="text-sm opacity-90 mb-1">风险等级</div>
                  <div className="text-lg font-semibold">
                    {riskLevel === 'extreme' ? '极高风险' :
                     riskLevel === 'high' ? '高风险' :
                     riskLevel === 'medium' ? '中风险' : '低风险'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-3">复诊建议</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-slate-600">风险等级</span>
                  <RiskBadge level={riskLevel} size="sm" />
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm text-slate-600">建议随访间隔</span>
                  <span className="font-medium text-slate-800">{followupDays}天</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-slate-600">建议下次随访</span>
                  <span className="font-medium text-green-700">{formatDate(suggestedFollowupDate)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-semibold text-slate-800 mb-4">分项得分</h3>
              <div className="space-y-3">
                {componentScores.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-slate-500 truncate" title={item.label}>
                      {item.label.replace(/^\d+\.\s*/, '')}
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.current === null ? 'bg-slate-200' :
                          item.current >= 2 ? 'bg-red-500' :
                          item.current >= 1 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${((item.current ?? 0) / 3) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right">
                      <span className={`text-sm font-bold font-mono ${
                        item.current === null ? 'text-slate-300' :
                        item.current >= 2 ? 'text-red-600' :
                        item.current >= 1 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {item.current !== null ? item.current : '-'}
                      </span>
                      {item.previous !== null && item.previous !== undefined && (
                        <span className="text-xs text-slate-400">/{item.previous}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {lastAssessment && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-4">分项对比</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 3]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="本次"
                        dataKey="current"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Radar
                        name="上次"
                        dataKey="previous"
                        stroke="#94a3b8"
                        fill="#94a3b8"
                        fillOpacity={0.15}
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs text-slate-500">本次评估</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-xs text-slate-500">上次评估</span>
                  </div>
                </div>
              </div>
            )}

            {trendChartData.length > 1 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <h3 className="font-semibold text-slate-800 mb-4">评分趋势</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[0, 21]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#2563eb' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 rounded-2xl p-4 shadow-lg -mx-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500">
                评估日期：<span className="font-medium text-slate-700">{formatDate(getTodayString())}</span>
              </div>
              {!isComplete && (
                <div className="text-sm text-amber-600 font-medium">
                  已完成 {7 - incompleteItems.length}/7 项
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/assessment')}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!isComplete}
                className={`px-8 py-2.5 rounded-xl transition-colors font-medium shadow-lg flex items-center gap-2 ${
                  isComplete
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-200'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <Save className="w-5 h-5" />
                保存评估
              </button>
            </div>
          </div>
        </div>
      </form>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-in zoom-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">评估保存成功</h3>
            <p className="text-slate-500">随访任务已自动生成</p>
          </div>
        </div>
      )}

      <PatientModal isOpen={isNewPatientModalOpen} onClose={() => setIsNewPatientModalOpen(false)} />
    </div>
  );
};
