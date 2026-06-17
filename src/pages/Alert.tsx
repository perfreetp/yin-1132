import { useState } from 'react';
import { AlertTriangle, Clock, User, Phone, Calendar, Check, AlertCircle, TrendingUp, Bell, ChevronRight, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { RiskBadge } from '../components/RiskBadge';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { formatDate, formatRelative, isOverdue, getTodayString } from '../utils/date';
import { differenceInDays } from 'date-fns';
import type { FollowupTask, Patient } from '../types';
import { Modal } from '../components/Modal';

export const Alert = () => {
  const {
    patients,
    tasks,
    getTasksByPatientId,
    updateTaskStatus,
    currentUser
  } = useAppStore();

  const [selectedTask, setSelectedTask] = useState<FollowupTask | null>(null);
  const [showHandleModal, setShowHandleModal] = useState(false);
  const [handleNotes, setHandleNotes] = useState('');

  const today = getTodayString();

  const stats = {
    todayFollowup: tasks.filter(t => t.scheduledDate === today && t.status === 'pending').length,
    overdue: tasks.filter(t => t.status === 'pending' && t.scheduledDate < today).length,
    extremeRisk: patients.filter(p => p.riskLevel === 'extreme' && p.status === 'active').length,
    highRisk: patients.filter(p => p.riskLevel === 'high' && p.status === 'active').length
  };

  const extremeRiskPatients = patients.filter(p => p.riskLevel === 'extreme' && p.status === 'active');

  const highRiskPatients = patients.filter(p => p.riskLevel === 'high' && p.status === 'active');

  const overdueTasks = tasks
    .filter(t => t.status === 'pending' && t.scheduledDate < today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  const getOverdueDays = (date: string) => {
    return Math.abs(differenceInDays(new Date(date), new Date(today)));
  };

  const getPriorityScore = (task: FollowupTask) => {
    const patient = patients.find(p => p.id === task.patientId);
    const riskScore = { extreme: 4, high: 3, medium: 2, low: 1 }[patient?.riskLevel || 'low'];
    const overdue = isOverdue(task.scheduledDate);
    const overdueDays = overdue ? getOverdueDays(task.scheduledDate) : 0;
    const urgencyScore = overdue ? Math.min(overdueDays, 7) : 0;
    return riskScore * 10 + urgencyScore;
  };

  const priorityQueue = [...tasks]
    .filter(t => t.status === 'pending')
    .sort((a, b) => getPriorityScore(b) - getPriorityScore(a))
    .slice(0, 10);

  const getTaskTypeLabel = (type: FollowupTask['type']) => {
    switch (type) {
      case 'phone': return '电话随访';
      case 'sms': return '短信提醒';
      case 'clinic': return '门诊复诊';
      case 'home': return '家庭访视';
    }
  };

  const getTaskTypeIcon = (type: FollowupTask['type']) => {
    switch (type) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'sms': return <Bell className="w-4 h-4" />;
      case 'clinic': return <Calendar className="w-4 h-4" />;
      case 'home': return <User className="w-4 h-4" />;
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

  const handleQuickProcess = (task: FollowupTask) => {
    setSelectedTask(task);
    setHandleNotes('');
    setShowHandleModal(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedTask) return;
    updateTaskStatus(selectedTask.id, 'completed', handleNotes);
    setShowHandleModal(false);
    setSelectedTask(null);
    setHandleNotes('');
  };

  const PatientCard = ({ patient, isExtreme = false }: { patient: Patient; isExtreme?: boolean }) => {
    const patientTasks = getTasksByPatientId(patient.id);
    const pendingTask = patientTasks.find(t => t.status === 'pending');
    const taskOverdue = pendingTask && isOverdue(pendingTask.scheduledDate);
    const overdueDays = pendingTask && taskOverdue ? getOverdueDays(pendingTask.scheduledDate) : 0;

    return (
      <div className={`rounded-2xl border-2 overflow-hidden shadow-sm transition-all hover:shadow-md ${
        isExtreme
          ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
          : 'bg-white border-slate-100'
      }`}>
        {isExtreme && (
          <div className="bg-red-500 text-white px-4 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-semibold">极高风险警报</span>
          </div>
        )}
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0 ${
              isExtreme
                ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200'
                : patient.gender === 'male'
                  ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                  : 'bg-gradient-to-br from-pink-400 to-rose-500'
            }`}>
              {patient.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-lg ${isExtreme ? 'text-red-900' : 'text-slate-800'}`}>
                  {patient.name}
                </h3>
                <RiskBadge level={patient.riskLevel} size="sm" />
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 mb-3">
                <span>{patient.gender === 'male' ? '男' : '女'}</span>
                <span>·</span>
                <span>{patient.age}岁</span>
                <span>·</span>
                <span className="font-mono">{patient.phone}</span>
              </div>
              <div className="flex items-center gap-4">
                <ScoreDisplay score={patient.latestPsqiScore} size="lg" showLabel={false} />
                {pendingTask && (
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${taskOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                      {getTaskTypeLabel(pendingTask.type)}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className={`w-3.5 h-3.5 ${taskOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                      <span className={taskOverdue ? 'text-red-500' : 'text-slate-500'}>
                        {formatDate(pendingTask.scheduledDate)}
                      </span>
                      {taskOverdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                          逾期{overdueDays}天
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {isExtreme && (
            <div className="mt-4 pt-4 border-t border-red-200">
              <button
                onClick={() => pendingTask && handleQuickProcess(pendingTask)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold shadow-lg shadow-red-200"
              >
                <Zap className="w-5 h-5" />
                紧急处理
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            预警看板
          </h1>
          <p className="text-sm text-slate-500 mt-1">实时监控高风险患者和逾期任务，优先处理紧急情况</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-500">当前时间</div>
          <div className="font-mono text-slate-800">{formatDate(today, 'yyyy年MM月dd日')}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '今日待随访', value: stats.todayFollowup, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
          { label: '逾期未访', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
          { label: '极高风险', value: stats.extremeRisk, color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertCircle },
          { label: '高风险', value: stats.highRisk, color: 'text-orange-600', bg: 'bg-orange-50', icon: TrendingUp }
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {extremeRiskPatients.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-800">极高风险患者</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
              PSQI {'>'} 15分
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {extremeRiskPatients.map(patient => (
              <PatientCard key={patient.id} patient={patient} isExtreme />
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-slate-800">高风险患者</h2>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
              PSQI 11-15分
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {highRiskPatients.length === 0 ? (
              <div className="py-12 text-center">
                <Check className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-slate-500">暂无高风险患者</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {highRiskPatients.map(patient => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-slate-800">逾期任务队列</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
              {overdueTasks.length}个
            </span>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {overdueTasks.length === 0 ? (
              <div className="py-12 text-center">
                <Check className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-slate-500">暂无逾期任务</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {overdueTasks.map(task => {
                  const patient = patients.find(p => p.id === task.patientId);
                  const overdueDays = getOverdueDays(task.scheduledDate);
                  return (
                    <div key={task.id} className="p-4 hover:bg-red-50 transition-colors cursor-pointer"
                      onClick={() => handleQuickProcess(task)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            patient?.gender === 'male' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                          }`}>
                            {patient?.name.charAt(0)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-800">{task.patientName}</h3>
                            <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                            {getTaskTypeIcon(task.type)}
                            <span>{getTaskTypeLabel(task.type)}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-bold text-red-600">
                            逾期{overdueDays}天
                          </div>
                          <div className="text-xs text-red-400">
                            {formatDate(task.scheduledDate)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-800">优先级队列</h2>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">
            按风险+逾期时间综合排序
          </span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">优先级</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">患者</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">任务类型</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">PSQI</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">计划时间</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">状态</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">负责人</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {priorityQueue.map((task, index) => {
                  const patient = patients.find(p => p.id === task.patientId);
                  const taskOverdue = isOverdue(task.scheduledDate);
                  const overdueDays = taskOverdue ? getOverdueDays(task.scheduledDate) : 0;
                  return (
                    <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index < 3 ? 'bg-red-500' : index < 6 ? 'bg-orange-500' : 'bg-amber-500'
                          }`}>
                            {index + 1}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} title={getPriorityLabel(task.priority)} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            patient?.gender === 'male' ? 'bg-gradient-to-br from-blue-400 to-blue-500' : 'bg-gradient-to-br from-pink-400 to-rose-500'
                          }`}>
                            {patient?.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{task.patientName}</div>
                            {patient && <RiskBadge level={patient.riskLevel} size="sm" />}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          {getTaskTypeIcon(task.type)}
                          <span className="text-sm">{getTaskTypeLabel(task.type)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {patient && <ScoreDisplay score={patient.latestPsqiScore} size="sm" showLabel={false} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className={taskOverdue ? 'text-red-600' : 'text-slate-600'}>
                          <div className="text-sm font-medium">{formatDate(task.scheduledDate)}</div>
                          <div className={`text-xs ${taskOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                            {taskOverdue ? `逾期${overdueDays}天` : formatRelative(task.scheduledDate)}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {taskOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" /> 已逾期
                          </span>
                        ) : task.scheduledDate === today ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" /> 今日
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" /> 待处理
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{task.assignedTo}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleQuickProcess(task)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                        >
                          <Check className="w-3.5 h-3.5" />
                          标记处理
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showHandleModal} onClose={() => setShowHandleModal(false)} title="快速处理任务" size="md">
        {selectedTask && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold ${
                  patients.find(p => p.id === selectedTask.patientId)?.gender === 'male'
                    ? 'bg-gradient-to-br from-blue-400 to-blue-500'
                    : 'bg-gradient-to-br from-pink-400 to-rose-500'
                }`}>
                  {selectedTask.patientName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{selectedTask.patientName}</h3>
                  <div className="text-sm text-slate-500">
                    {getTaskTypeLabel(selectedTask.type)} · {formatDate(selectedTask.scheduledDate)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                处理备注
              </label>
              <textarea
                value={handleNotes}
                onChange={(e) => setHandleNotes(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={4}
                placeholder="请记录处理内容、患者反馈、后续安排等..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowHandleModal(false)}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmProcess}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200 flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                确认完成
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
