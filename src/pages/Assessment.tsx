import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, TrendingDown, TrendingUp, Minus, Save, User, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAppStore } from '../store';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { psqiQuestions, calculatePsqiTotal, getRiskLevel, getFollowupInterval } from '../utils/psqi';
import type { PsqiScores } from '../types';
import { formatDate, addDaysToDate, getTodayString } from '../utils/date';

export const Assessment = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { getPatientById, getAssessmentsByPatientId, addAssessment } = useAppStore();

  const patient = patientId ? getPatientById(patientId) : undefined;
  const assessments = patientId ? getAssessmentsByPatientId(patientId) : [];
  const lastAssessment = assessments[0];

  const [scores, setScores] = useState<PsqiScores>({
    sleepQuality: 0,
    sleepLatency: 0,
    sleepDuration: 0,
    sleepEfficiency: 0,
    sleepDisturbance: 0,
    hypnoticDrug: 0,
    daytimeDysfunction: 0
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

  const scoreChange = lastAssessment ? totalScore - lastAssessment.totalScore : 0;

  const handleScoreChange = (key: keyof PsqiScores, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    const hasAnyScore = Object.values(scores).some((s) => s > 0);
    if (!hasAnyScore) {
      alert('请至少完成一项PSQI评分');
      return;
    }
    if (!formData.chiefComplaint) {
      alert('请填写失眠主诉');
      return;
    }

    addAssessment(patientId, scores, formData);
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
    current: scores[q.key as keyof PsqiScores],
    previous: lastAssessment ? lastAssessment[q.key as keyof PsqiScores] : 0,
    fullMark: 3
  }));

  const componentScores = psqiQuestions.map((q) => ({
    key: q.key,
    label: q.label,
    current: scores[q.key as keyof PsqiScores],
    previous: lastAssessment ? lastAssessment[q.key as keyof PsqiScores] : null
  }));

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-4">未找到患者信息</p>
          <button
            onClick={() => navigate('/patients')}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
          >
            返回患者列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patients')}
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 主要内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：PSQI量表录入 */}
          <div className="lg:col-span-2 space-y-6">
            {/* PSQI 7个分项 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                匹兹堡睡眠质量指数（PSQI）
              </h2>

              <div className="space-y-8">
                {psqiQuestions.map((question, qIndex) => (
                  <div key={question.key} className="group">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 shadow-lg shadow-blue-100">
                        {qIndex + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 mb-1">{question.label}</h3>
                        <p className="text-sm text-slate-500">{question.description}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold font-mono ${
                          scores[question.key as keyof PsqiScores] >= 2 ? 'text-red-500' :
                          scores[question.key as keyof PsqiScores] >= 1 ? 'text-orange-500' : 'text-green-500'
                        }`}>
                          {scores[question.key as keyof PsqiScores]}
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
                            scores[question.key as keyof PsqiScores] === option.value
                              ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                              : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                              scores[question.key as keyof PsqiScores] === option.value
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-slate-300'
                            }`}>
                              {scores[question.key as keyof PsqiScores] === option.value && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-slate-400 mb-1">{option.value}分</div>
                              <div className={`text-sm ${
                                scores[question.key as keyof PsqiScores] === option.value
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
                ))}
              </div>
            </div>

            {/* 主诉与症状 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">临床信息</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    失眠主诉 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.chiefComplaint}
                    onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
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

          {/* 右侧：总分面板、对比、图表 */}
          <div className="space-y-6">
            {/* 总分与风险面板 */}
            <div className={`bg-gradient-to-br ${
              riskLevel === 'extreme' ? 'from-red-500 to-red-600' :
              riskLevel === 'high' ? 'from-orange-500 to-orange-600' :
              riskLevel === 'medium' ? 'from-amber-500 to-amber-600' :
              'from-green-500 to-green-600'
            } rounded-2xl p-6 text-white shadow-xl`}>
              <div className="text-center">
                <div className="text-sm opacity-90 mb-2">PSQI 总分</div>
                <div className="text-6xl font-bold font-mono mb-2">{totalScore}</div>
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

            {/* 复诊建议 */}
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

            {/* 分项得分对比 */}
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
                          item.current >= 2 ? 'bg-red-500' :
                          item.current >= 1 ? 'bg-orange-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(item.current / 3) * 100}%` }}
                      />
                    </div>
                    <div className="w-12 text-right">
                      <span className={`text-sm font-bold font-mono ${
                        item.current >= 2 ? 'text-red-600' :
                        item.current >= 1 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {item.current}
                      </span>
                      {item.previous !== null && item.previous !== undefined && (
                        <span className="text-xs text-slate-400">/{item.previous}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 雷达图 */}
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

            {/* 趋势图 */}
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

        {/* 底部操作栏 */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 rounded-2xl p-4 shadow-lg -mx-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-500">
                评估日期：<span className="font-medium text-slate-700">{formatDate(getTodayString())}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                保存评估
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* 成功提示 */}
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
    </div>
  );
};
