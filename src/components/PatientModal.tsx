import { useState } from 'react';
import { Modal } from './Modal';
import { useAppStore } from '../store';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PatientModal = ({ isOpen, onClose }: PatientModalProps) => {
  const addPatient = useAppStore((state) => state.addPatient);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    age: '',
    phone: '',
    idCard: '',
    address: '',
    medicalHistory: '',
    allergyHistory: '',
    nextFollowupDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gender || !formData.age || !formData.phone) {
      alert('请填写必填项');
      return;
    }

    addPatient({
      name: formData.name,
      gender: formData.gender,
      age: parseInt(formData.age),
      phone: formData.phone,
      idCard: formData.idCard,
      address: formData.address,
      medicalHistory: formData.medicalHistory,
      allergyHistory: formData.allergyHistory,
      nextFollowupDate: formData.nextFollowupDate || undefined
    });

    setFormData({
      name: '',
      gender: 'male',
      age: '',
      phone: '',
      idCard: '',
      address: '',
      medicalHistory: '',
      allergyHistory: '',
      nextFollowupDate: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="新建患者档案" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入患者姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              性别 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">男</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">女</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              年龄 <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入年龄"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              联系电话 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入联系电话"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              身份证号
            </label>
            <input
              type="text"
              value={formData.idCard}
              onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入身份证号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              预约随访日期
            </label>
            <input
              type="date"
              value={formData.nextFollowupDate}
              onChange={(e) => setFormData({ ...formData, nextFollowupDate: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              现住址
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="请输入详细地址"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              既往病史
            </label>
            <textarea
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={3}
              placeholder="请输入既往病史、手术史等"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              过敏史
            </label>
            <textarea
              value={formData.allergyHistory}
              onChange={(e) => setFormData({ ...formData, allergyHistory: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              rows={2}
              placeholder="请输入药物、食物等过敏史"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-200"
          >
            保存患者
          </button>
        </div>
      </form>
    </Modal>
  );
};
