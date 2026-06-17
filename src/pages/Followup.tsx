import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Phone, MessageSquare, Calendar, Home, Check, X, Clock, AlertTriangle, User, FileText, Plus, ChevronRight, Save, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { Modal } from '../components/Modal';
import { formatDate, formatRelative, isOverdue, formatDuration, getTodayString } from '../utils/date';
import type { FollowupTask, ContactRecord, Intervention } from '../types';

type TabType = 'pending' | 'today' | 'overdue' | 'completed';

export const Followup = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { tasks, getPatientById, getContactRecordsByPatientId, getInterventionsByPatientId, getTasksByPatientId, updateTaskStatus, addContactRecord, addIntervention, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [selectedTask, setSelectedTask] = useState<FollowupTask | null>(null);
  const [fromPatientList, setFromPatientList] = useState(false);

  useEffect(() => {
    const taskId = searchParams.get('taskId');
    const patientId = searchParams.get('patientId');
    
    if (searchParams.get('patientId')) {
      setFromPatientList(true);
    }

    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        if (isOverdue(task.scheduledDate)) {
          setActiveTab('overdue');
        } else if (task.scheduledDate === getTodayString()) {
          setActiveTab('today');
        } else {
          setActiveTab('pending');
        }
      }
    } else if (patientId) {
      const patientTasks = getTasksByPatientId(patientId);
      const pendingTask = patientTasks.find(t => t.status === 'pending');
      if (pendingTask) {
        setSelectedTask(pendingTask);
        if (isOverdue(pendingTask.scheduledDate)) {
          setActiveTab('overdue');
        } else if (pendingTask.scheduledDate === getTodayString()) {
          setActiveTab('today');
        } else {
          setActiveTab('pending');
        }
      } else if (patientTasks.length > 0) {
        setSelectedTask(patientTasks[0]);
      }
    }
  }, [location.search, tasks, getTasksByPatientId]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    contactType: 'phone' as ContactRecord['contactType'],
    contactResult: 'success' as ContactRecord['contactResult'],
    duration: '',
    notes: ''
  });
  const [interventionForm, setInterventionForm] = useState({
    type: 'both' as Intervention['type'],
    medicationName: '',
    medicationDosage: '',
    medicationFrequency: '',
    nonDrugType: '',
    description: ''
  });

  const filteredTasks = tasks.filter((task) => {
    const today = getTodayString();
    switch (activeTab) {
      case 'today':
        return task.scheduledDate === today && task.status === 'pending';
      case 'pending':
        return task.status === 'pending';
      case 'overdue':
        return task.status === 'pending' && task.scheduledDate < today;
      case 'completed':
        return task.status === 'completed' || task.status === 'cancelled';
      default:
        return true;
    }
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.scheduledDate.localeCompare(b.scheduledDate);
  });

  const getTaskTypeIcon = (type: FollowupTask['type']) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'clinic': return <Calendar className="w-4 h-4" />;
      case 'home': return <Home className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type: FollowupTask['type']) => {
    switch (type) {
      case 'phone': return '电话随访';
      case 'sms': return '短信提醒';
      case 'clinic': return '门诊复诊';
      case 'home': return '家庭访视';
    }
  };

  const getPriorityColor = (priority: FollowupTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-green-500';
    }
  };

  const getPriorityLabel = (priority: FollowupTask['priority']) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
    }
  };

  const getResultLabel = (result: ContactRecord['contactResult']) => {
    switch (result) {
      case 'success': return '成功';
      case 'no_answer': return '未接';
      case 'rejected': return '拒接';
      case 'wrong_number': return '号码错误';
    }
  };

  const getResultColor = (result: ContactRecord['contactResult']) => {
    switch (result) {
      case 'success': return 'bg-green-100 text-green-700';
      case 'no_answer': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-orange-100 text-orange-700';
      case 'wrong_number': return 'bg-red-100 text-red-700';
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    addContactRecord({
      patientId: selectedTask.patientId,
      taskId: selectedTask.id,
      contactDate: getTodayString(),
      contactType: contactForm.contactType,
      contactResult: contactForm.contactResult,
      duration: contactForm.duration ? parseInt(contactForm.duration) : undefined,
      notes: contactForm.notes,
      operator: currentUser.name
    });

    if (contactForm.contactResult === 'success') {
      updateTaskStatus(selectedTask.id, 'completed', contactForm.notes);
    }

    setShowContactModal(false);
    setContactForm({
      contactType: 'phone',
      contactResult: 'success',
      duration: '',
      notes: ''
    });
    setSelectedTask(null);
  };

  const handleInterventionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    addIntervention({
      patientId: selectedTask.patientId,
      date: getTodayString(),
      type: interventionForm.type,
      medicationName: interventionForm.medicationName || undefined,
      medicationDosage: interventionForm.medicationDosage || undefined,
      medicationFrequency: interventionForm.medicationFrequency || undefined,
      nonDrugType: interventionForm.nonDrugType || undefined,
      description: interventionForm.description || undefined
    });

    setShowInterventionModal(false);
    setInterventionForm({
      type: 'both',
      medicationName: '',
      medicationDosage: '',
      medicationFrequency: '',
      nonDrugType: '',
      description: ''
    });
  };

  const stats = {
    today: tasks.filter(t => t.scheduledDate === getTodayString() && t.status === 'pending').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => t.status === 'pending' && t.scheduledDate < getTodayString()).length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'cancelled').length
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {fromPatientList && (
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-white rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-slate-800">随访计划</h1>
            <p className="text-sm text-slate-500 mt-1">管理患者随访任务，记录触达结果</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日待随访', value: stats.today, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'today' as TabType },
          { label: '待处理任务', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', tab: 'pending' as TabType },
          { label: '已逾期', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50', tab: 'overdue' as TabType },
          { label: '已完成', value: stats.completed, color: 'text-green-600', bg: 'bg-green-50', tab: 'completed' as TabType }
        ].map((stat, index) => (
          <button
            key={index}
            onClick={() => setActiveTab(stat.tab)}
            className={`bg-white rounded-2xl p-5 border-2 transition-all text-left ${
              activeTab === stat.tab ? 'border-blue-500 shadow-md' : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <div className={`w-3 h-3 rounded-full ${stat.color} opacity-50`}></div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 任务列表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：任务列表 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {sortedTasks.length === 0 ? (
                <div className="py-16 text-center">
                  <Clock className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">暂无{activeTab === 'today' ? '今日' : activeTab === 'overdue' ? '逾期' : activeTab === 'completed' ? '已完成' : ''}任务</p>
                </div>
              ) : (
                sortedTasks.map((task) => {
                  const patient = getPatientById(task.patientId);
                  const taskOverdue = isOverdue(task.scheduledDate);

                  return (
                    <div
                      key={task.id}
                      className={`p-5 cursor-pointer transition-all hover:bg-slate-50 ${
                        selectedTask?.id === task.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${
                            patient?.gender === 'male' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                          }`}>
                            {patient?.name.charAt(0)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-slate-800">{task.patientName}</h3>
                                <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={getPriorityLabel(task.priority)} />
                                {taskOverdue && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                                    <AlertTriangle className="w-3 h-3" /> 已逾期
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                                {getTaskTypeIcon(task.type)}
                                <span>{getTaskTypeLabel(task.type)}</span>
                                <span className="text-slate-300">·</span>
                                <span>{patient && <RiskBadge level={patient.riskLevel} size="sm" />}</span>
                              </div>
                              {patient && (
                                <div className="flex items-center gap-3 mt-2">
                                  <ScoreDisplay score={patient.latestPsqiScore} size="sm" showLabel={false} />
                                  <span className="text-xs text-slate-400">PSQI</span>
                                </div>
                              )}
                            </div>

                            <div className="text-right flex-shrink-0">
                              <div className={`text-sm font-medium ${taskOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                {formatDate(task.scheduledDate)}
                              </div>
                              <div className={`text-xs ${taskOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                {formatRelative(task.scheduledDate)}
                              </div>
                              <div className="text-xs text-slate-400 mt-1">
                                负责人：{task.assignedTo}
                              </div>
                            </div>
                          </div>

                          {task.notes && (
                            <p className="text-sm text-slate-600 mt-3 bg-slate-50 rounded-lg p-3">
                              {task.notes}
                            </p>
                          )}

                          {task.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-4">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowContactModal(true); }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                              >
                                <Check className="w-4 h-4" /> 记录触达
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setShowInterventionModal(true); }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium"
                              >
                                <FileText className="w-4 h-4" /> 干预记录
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 右侧：任务详情 */}
        <div className="space-y-6">
          {selectedTask ? (() => {
            const patient = getPatientById(selectedTask.patientId);
            const contactRecords = getContactRecordsByPatientId(selectedTask.patientId);
            const interventions = getInterventionsByPatientId(selectedTask.patientId);

            return (
              <>
                {/* 患者信息卡片 */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold ${
                      patient?.gender === 'male' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                    }`}>
                      {patient?.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">{selectedTask.patientName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {patient && <RiskBadge level={patient.riskLevel} />}
                      </div>
                    </div>
                  </div>

                  {patient && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-sm">
                        <span className="text-slate-500">年龄</span>
                        <p className="font-medium text-slate-800">{patient.age}岁</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">性别</span>
                        <p className="font-medium text-slate-800">{patient.gender === 'male' ? '男' : '女'}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">电话</span>
                        <p className="font-medium text-slate-800 font-mono">{patient.phone}</p>
                      </div>
                      <div className="text-sm">
                        <span className="text-slate-500">PSQI评分</span>
                        <p className="font-medium text-slate-800 font-mono">{patient.latestPsqiScore}分</p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="text-sm text-slate-500 mb-1">随访任务</div>
                    <div className="font-medium text-slate-800">{getTaskTypeLabel(selectedTask.type)}</div>
                    <div className="text-sm text-slate-500 mt-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {formatDate(selectedTask.scheduledDate)} ({formatRelative(selectedTask.scheduledDate)})
                      </span>
                    </div>
                    {selectedTask.notes && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <div className="text-sm text-slate-500 mb-1">任务备注</div>
                        <div className="text-sm text-slate-700">{selectedTask.notes}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 触达记录时间线 */}
                {contactRecords.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      触达记录
                    </h3>
                    <div className="space-y-4 max-h-80 overflow-auto">
                      {contactRecords.slice(0, 5).map((record, idx) => (
                        <div key={record.id} className="relative pl-6">
                          {idx < contactRecords.slice(0, 5).length - 1 && (
                            <div className="absolute left-[7px] top-6 bottom-0 w-px bg-slate-200" />
                          )}
                          <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
                          <div className="bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {record.contactType === 'phone' ? (
                                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                                ) : record.contactType === 'sms' ? (
                                  <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-purple-500" />
                                )}
                                <span className="text-xs text-slate-500">
                                  {record.contactType === 'phone' ? '电话' : record.contactType === 'sms' ? '短信' : record.contactType === 'wechat' ? '微信' : '门诊'}
                                </span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getResultColor(record.contactResult)}`}>
                                {getResultLabel(record.contactResult)}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 mb-1">{record.notes}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span>{formatDate(record.contactDate)}</span>
                              {record.duration && <span>{formatDuration(record.duration)}</span>}
                              <span>{record.operator}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 干预记录 */}
                {interventions.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      干预方案
                    </h3>
                    <div className="space-y-3">
                      {interventions.slice(0, 3).map((iv) => (
                        <div key={iv.id} className="p-3 bg-slate-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                              {iv.type === 'medication' ? '药物治疗' : iv.type === 'non_drug' ? '非药物治疗' : '联合治疗'}
                            </span>
                            <span className="text-xs text-slate-400">{formatDate(iv.date)}</span>
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
                  </div>
                )}
              </>
            );
          })() : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChevronRight className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-500">选择一个任务查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 触达记录弹窗 */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="记录触达结果" size="md">
        <form onSubmit={handleContactSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              触达方式
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: 'phone', label: '电话', icon: Phone },
                { value: 'sms', label: '短信', icon: MessageSquare },
                { value: 'wechat', label: '微信', icon: MessageSquare },
                { value: 'clinic', label: '门诊', icon: Calendar }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setContactForm({ ...contactForm, contactType: option.value as any })}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    contactForm.contactType === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <option.icon className={`w-5 h-5 mx-auto mb-2 ${
                    contactForm.contactType === option.value ? 'text-blue-500' : 'text-slate-400'
                  }`} />
                  <span className={`text-sm ${
                    contactForm.contactType === option.value ? 'text-blue-700 font-medium' : 'text-slate-600'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              触达结果
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'success', label: '成功' },
                { value: 'no_answer', label: '未接' },
                { value: 'rejected', label: '拒接' },
                { value: 'wrong_number', label: '号码错误' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setContactForm({ ...contactForm, contactResult: option.value as any })}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    contactForm.contactResult === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-100 hover:border-blue-200 text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {contactForm.contactType === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                通话时长（秒）
              </label>
              <input
                type="number"
                value={contactForm.duration}
                onChange={(e) => setContactForm({ ...contactForm, duration: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="请输入通话时长"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              沟通备注
            </label>
            <textarea
              value={contactForm.notes}
              onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="请记录沟通内容、患者反馈、注意事项等..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowContactModal(false)}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              保存记录
            </button>
          </div>
        </form>
      </Modal>

      {/* 干预记录弹窗 */}
      <Modal isOpen={showInterventionModal} onClose={() => setShowInterventionModal(false)} title="记录干预方案" size="lg">
        <form onSubmit={handleInterventionSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              干预类型
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'medication', label: '药物治疗' },
                { value: 'non_drug', label: '非药物治疗' },
                { value: 'both', label: '联合治疗' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setInterventionForm({ ...interventionForm, type: option.value as any })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    interventionForm.type === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <span className={`text-sm font-medium ${
                    interventionForm.type === option.value ? 'text-blue-700' : 'text-slate-600'
                  }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {(interventionForm.type === 'medication' || interventionForm.type === 'both') && (
            <div className="p-5 bg-blue-50/50 rounded-2xl space-y-4">
              <h4 className="font-medium text-blue-800 flex items-center gap-2">
                <Plus className="w-4 h-4" /> 药物治疗
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">药物名称</label>
                  <input
                    type="text"
                    value={interventionForm.medicationName}
                    onChange={(e) => setInterventionForm({ ...interventionForm, medicationName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    placeholder="如：右佐匹克隆"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">剂量</label>
                  <input
                    type="text"
                    value={interventionForm.medicationDosage}
                    onChange={(e) => setInterventionForm({ ...interventionForm, medicationDosage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    placeholder="如：3mg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">频次</label>
                  <input
                    type="text"
                    value={interventionForm.medicationFrequency}
                    onChange={(e) => setInterventionForm({ ...interventionForm, medicationFrequency: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                    placeholder="如：每晚1次"
                  />
                </div>
              </div>
            </div>
          )}

          {(interventionForm.type === 'non_drug' || interventionForm.type === 'both') && (
            <div className="p-5 bg-green-50/50 rounded-2xl space-y-4">
              <h4 className="font-medium text-green-800 flex items-center gap-2">
                <Plus className="w-4 h-4" /> 非药物治疗
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">治疗类型</label>
                  <select
                    value={interventionForm.nonDrugType}
                    onChange={(e) => setInterventionForm({ ...interventionForm, nonDrugType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">请选择治疗类型</option>
                    <option value="CBT-I认知行为治疗">CBT-I认知行为治疗</option>
                    <option value="睡眠卫生教育">睡眠卫生教育</option>
                    <option value="放松训练">放松训练</option>
                    <option value="正念冥想">正念冥想</option>
                    <option value="运动疗法">运动疗法</option>
                    <option value="刺激控制疗法">刺激控制疗法</option>
                    <option value="睡眠限制疗法">睡眠限制疗法</option>
                    <option value="生物反馈治疗">生物反馈治疗</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">详细说明</label>
                  <textarea
                    value={interventionForm.description}
                    onChange={(e) => setInterventionForm({ ...interventionForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white"
                    rows={3}
                    placeholder="请详细描述治疗方案..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowInterventionModal(false)}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              保存方案
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
