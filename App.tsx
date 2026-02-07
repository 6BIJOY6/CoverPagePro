
import React, { useState, useRef, useCallback } from 'react';
import { INITIAL_DATA } from './constants';
import { CoverPageData, TemplateType, FontType, PageSize, CustomField } from './types';
import FormPanel from './components/FormPanel';
import PreviewPanel from './components/PreviewPanel';
import { FileDown, Printer, Save, Upload, RotateCcw, FileType } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<CoverPageData>(INITIAL_DATA);
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
    <div className="flex flex-col min-h-screen font-['Inter']">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm no-print">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileType className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">CoverPage Pro</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer text-sm transition-colors">
            <Upload size={16} />
            <span>Load JSON</span>
            <input type="file" accept=".json" onChange={loadJson} className="hidden" />
          </label>
          <button 
            onClick={saveJson}
            className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-sm transition-colors"
          >
            <Save size={16} />
            <span>Save Data</span>
          </button>
          <button 
            onClick={resetData}
            className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-sm transition-colors"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
          <div className="h-6 w-px bg-slate-200 mx-2" />
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors shadow-sm"
          >
            <Printer size={16} />
            <span>Print / PDF</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 lg:p-8">
        {/* Form Controls - Left */}
        <div className="w-full md:w-[450px] shrink-0 no-print">
          <FormPanel data={data} updateField={updateField} />
        </div>

        {/* Preview Panel - Right */}
        <div className="flex-1 min-w-0 bg-slate-200/50 rounded-xl border border-slate-300/50 p-4 md:p-8 flex justify-center items-start overflow-auto">
          <PreviewPanel data={data} previewRef={previewRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-500 text-sm no-print">
        &copy; 2024 CoverPage Pro. Created with precision for academia.
      </footer>
    </div>
  );
};

export default App;
