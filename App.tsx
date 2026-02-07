
import React, { useState, useRef } from 'react';
import { INITIAL_DATA } from './constants';
import { CoverPageData } from './types';
import FormPanel from './components/FormPanel';
import PreviewPanel from './components/PreviewPanel';
import { FileDown, Printer, Save, Upload, RotateCcw, FileType, Layout, Edit3, Eye } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<CoverPageData>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');
  const previewRef = useRef<HTMLDivElement>(null);

  const updateField = <K extends keyof CoverPageData>(field: K, value: CoverPageData[K]) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const resetData = () => {
    if (window.confirm('Are you sure you want to reset all fields?')) {
      setData(INITIAL_DATA);
    }
  };

  const saveJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-page-${data.reportTitle.slice(0, 15)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const loaded = JSON.parse(event.target?.result as string);
          setData(loaded);
        } catch (err) {
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen font-['Inter'] bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shrink-0">
            <FileType className="text-white w-4 h-4 md:w-5 md:h-5" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight hidden sm:block">CoverPage Pro</h1>
          <h1 className="text-lg font-bold text-slate-800 sm:hidden">CP Pro</h1>
        </div>
        
        <div className="flex items-center gap-1.5 md:gap-2">
          <label className="flex items-center gap-1 px-2 md:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer text-xs md:text-sm transition-colors">
            <Upload size={16} />
            <span className="hidden md:inline">Load</span>
            <input type="file" accept=".json" onChange={loadJson} className="hidden" />
          </label>
          <button 
            onClick={saveJson}
            className="flex items-center gap-1 px-2 md:px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs md:text-sm transition-colors"
            title="Save JSON"
          >
            <Save size={16} />
            <span className="hidden md:inline">Save</span>
          </button>
          <button 
            onClick={resetData}
            className="flex items-center gap-1 px-2 md:px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs md:text-sm transition-colors"
            title="Reset"
          >
            <RotateCcw size={16} />
            <span className="hidden md:inline">Reset</span>
          </button>
          <div className="h-6 w-px bg-slate-200 mx-1 md:mx-2" />
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs md:text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} />
            <span>PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
        {/* Form Controls - Responsive container */}
        <div className={`
          ${activeTab === 'form' ? 'flex' : 'hidden'} 
          md:flex w-full md:w-[400px] lg:w-[480px] shrink-0 no-print flex-col bg-slate-50 border-r border-slate-200
        `}>
          <FormPanel data={data} updateField={updateField} />
        </div>

        {/* Preview Panel - Responsive container */}
        <div className={`
          ${activeTab === 'preview' ? 'flex' : 'hidden'} 
          md:flex flex-1 min-w-0 bg-slate-200/50 p-4 md:p-6 lg:p-8 flex justify-center items-start overflow-auto
        `}>
          <PreviewPanel data={data} previewRef={previewRef} />
        </div>
      </main>

      {/* Mobile Bottom Tab Switcher */}
      <div className="md:hidden flex border-t border-slate-200 bg-white sticky bottom-0 z-50 no-print">
        <button 
          onClick={() => setActiveTab('form')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 ${activeTab === 'form' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}
        >
          <Edit3 size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Details</span>
        </button>
        <button 
          onClick={() => setActiveTab('preview')}
          className={`flex-1 flex flex-col items-center py-3 gap-1 ${activeTab === 'preview' ? 'text-blue-600 bg-blue-50/50' : 'text-slate-500'}`}
        >
          <Eye size={20} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Preview</span>
        </button>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-400 text-[10px] md:text-xs no-print hidden md:block">
        &copy; 2024 CoverPage Pro. Created with precision for academia.
      </footer>
    </div>
  );
};

export default App;
