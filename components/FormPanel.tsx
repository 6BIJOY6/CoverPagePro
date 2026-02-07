
import React from 'react';
import { CoverPageData, TemplateType, FontType, PageSize, Student } from '../types';
import { Plus, Trash2, Image as ImageIcon, UserPlus } from 'lucide-react';

interface FormPanelProps {
  data: CoverPageData;
  updateField: <K extends keyof CoverPageData>(field: K, value: CoverPageData[K]) => void;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <div className="mb-8 last:mb-0">
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-1">{title}</h3>
    <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      {children}
    </div>
  </div>
);

const FormPanel: React.FC<FormPanelProps> = ({ data, updateField }) => {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateField('universityLogo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addStudent = () => {
    const newStudents = [...data.students, { id: Math.random().toString(36).substr(2, 9), name: '', studentId: '' }];
    updateField('students', newStudents);
  };

  const removeStudent = (id: string) => {
    if (data.students.length <= 1) return;
    const newStudents = data.students.filter(s => s.id !== id);
    updateField('students', newStudents);
  };

  const updateStudent = (id: string, key: 'name' | 'studentId', value: string) => {
    const newStudents = data.students.map(s => s.id === id ? { ...s, [key]: value } : s);
    updateField('students', newStudents);
  };

  const addCustomField = () => {
    const newFields = [...data.customFields, { id: Math.random().toString(36).substr(2, 9), label: '', value: '' }];
    updateField('customFields', newFields);
  };

  const removeCustomField = (id: string) => {
    const newFields = data.customFields.filter(f => f.id !== id);
    updateField('customFields', newFields);
  };

  const updateCustomField = (id: string, key: 'label' | 'value', value: string) => {
    const newFields = data.customFields.map(f => f.id === id ? { ...f, [key]: value } : f);
    updateField('customFields', newFields);
  };

  return (
    <div className="space-y-2 h-[calc(100vh-140px)] overflow-y-auto pr-2 pb-10">
      
      <Section title="Institutional Details">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">University Name *</label>
          <input 
            type="text" 
            value={data.universityName} 
            onChange={e => updateField('universityName', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="e.g. Stanford University"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Department / Faculty</label>
          <input 
            type="text" 
            value={data.department} 
            onChange={e => updateField('department', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. Faculty of Science"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <ImageIcon size={16} className="text-slate-400" />
                <span className="text-xs text-slate-600">Upload Image</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {data.universityLogo && (
                <button 
                  onClick={() => updateField('universityLogo', null)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
             <label className="block text-sm font-medium text-slate-700 mb-1">Visible</label>
             <input 
                type="checkbox" 
                checked={data.showLogo} 
                onChange={e => updateField('showLogo', e.target.checked)}
                className="w-5 h-5 accent-blue-600"
             />
          </div>
        </div>
      </Section>

      <Section title="Course & Report">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
            <input 
              type="text" 
              value={data.courseTitle} 
              onChange={e => updateField('courseTitle', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
            <input 
              type="text" 
              value={data.courseCode} 
              onChange={e => updateField('courseCode', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Assignment Type</label>
          <input 
            type="text" 
            value={data.assignmentType} 
            onChange={e => updateField('assignmentType', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            placeholder="Assignment, Term Paper, Lab Report, etc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Report Title *</label>
          <textarea 
            rows={2}
            value={data.reportTitle} 
            onChange={e => updateField('reportTitle', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          />
        </div>
      </Section>

      <Section title="Submission Details">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Submitted To (Professor)</label>
            <input 
              type="text" 
              value={data.professorName} 
              onChange={e => updateField('professorName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="Full Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Professor Designation</label>
            <input 
              type="text" 
              value={data.professorDesignation} 
              onChange={e => updateField('professorDesignation', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="e.g. Associate Professor"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Session</label>
            <input 
              type="text" 
              value={data.session} 
              onChange={e => updateField('session', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Submission Date *</label>
            <input 
              type="date" 
              value={data.submissionDate} 
              onChange={e => updateField('submissionDate', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis / Group (Optional)</label>
          <input 
            type="text" 
            value={data.diagnosis} 
            onChange={e => updateField('diagnosis', e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
          />
        </div>
      </Section>

      <Section title="Students (Group Members)">
        <div className="space-y-3">
          {data.students.map((student, index) => (
            <div key={student.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">STUDENT #{index + 1}</span>
                {data.students.length > 1 && (
                  <button onClick={() => removeStudent(student.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={student.name}
                  onChange={e => updateStudent(student.id, 'name', e.target.value)}
                  className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Student ID"
                  value={student.studentId}
                  onChange={e => updateStudent(student.id, 'studentId', e.target.value)}
                  className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
            </div>
          ))}
          <button 
            onClick={addStudent}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-blue-300 text-blue-600 rounded bg-blue-50/50 hover:bg-blue-50 transition-colors"
          >
            <UserPlus size={16} />
            <span className="text-sm font-medium">Add Group Member</span>
          </button>
        </div>
      </Section>

      <Section title="Custom Fields">
        <div className="space-y-3">
          {data.customFields.map((field) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Label"
                  value={field.label}
                  onChange={e => updateCustomField(field.id, 'label', e.target.value)}
                  className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Value"
                  value={field.value}
                  onChange={e => updateCustomField(field.id, 'value', e.target.value)}
                  className="px-2 py-1.5 border border-slate-300 rounded text-sm"
                />
              </div>
              <button 
                onClick={() => removeCustomField(field.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button 
            onClick={addCustomField}
            className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-slate-300 text-slate-500 rounded hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Add Custom Field</span>
          </button>
        </div>
      </Section>

      <Section title="Design & Layout">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Template</label>
            <select 
              value={data.template} 
              onChange={e => updateField('template', e.target.value as TemplateType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value={TemplateType.FORMAL}>Template A: Formal</option>
              <option value={TemplateType.ACADEMIC}>Template B: Academic</option>
              <option value={TemplateType.MODERN}>Template C: Modern</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Font Family</label>
            <select 
              value={data.font} 
              onChange={e => updateField('font', e.target.value as FontType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value={FontType.TIMES}>Times New Roman</option>
              <option value={FontType.GEORGIA}>Georgia</option>
              <option value={FontType.INTER}>Inter (Sans)</option>
              <option value={FontType.ARIAL}>Arial</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Title Font Size</label>
              <span className="text-xs font-bold text-blue-600">{data.titleFontSize}px</span>
            </div>
            <input 
              type="range" 
              min="20" 
              max="64" 
              value={data.titleFontSize} 
              onChange={e => updateField('titleFontSize', parseInt(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-700">Details Font Size</label>
              <span className="text-xs font-bold text-blue-600">{data.detailsFontSize}px</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="24" 
              value={data.detailsFontSize} 
              onChange={e => updateField('detailsFontSize', parseInt(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Accent Color</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={data.accentColor} 
                onChange={e => updateField('accentColor', e.target.value)}
                className="w-10 h-10 p-0.5 rounded border border-slate-300 cursor-pointer"
              />
              <input 
                type="text" 
                value={data.accentColor} 
                onChange={e => updateField('accentColor', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm uppercase"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Page Size</label>
            <select 
              value={data.pageSize} 
              onChange={e => updateField('pageSize', e.target.value as PageSize)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value={PageSize.A4}>A4 (Standard)</option>
              <option value={PageSize.LETTER}>Letter (US)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-center pt-2">
           <div className="flex items-center gap-2">
             <input 
                type="checkbox" 
                checked={data.showFooter} 
                onChange={e => updateField('showFooter', e.target.checked)}
                className="w-4 h-4 accent-blue-600"
                id="show-footer"
             />
             <label htmlFor="show-footer" className="text-sm text-slate-700 cursor-pointer">Show Footer Credit</label>
           </div>
           <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Alignment</label>
             <div className="flex border border-slate-300 rounded-md overflow-hidden">
                <button 
                  onClick={() => updateField('alignment', 'left')}
                  className={`flex-1 py-1 text-xs font-medium ${data.alignment === 'left' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  Left
                </button>
                <button 
                  onClick={() => updateField('alignment', 'center')}
                  className={`flex-1 py-1 text-xs font-medium ${data.alignment === 'center' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  Center
                </button>
             </div>
           </div>
        </div>
      </Section>
    </div>
  );
};

export default FormPanel;
