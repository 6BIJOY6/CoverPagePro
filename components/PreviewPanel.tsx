
import React, { useEffect, useState, useRef } from 'react';
import { CoverPageData, PageSize, TemplateType } from '../types';
import { PAGE_DIMENSIONS } from '../constants';
import { FileOutput, ZoomIn, ZoomOut, Maximize, Loader2 } from 'lucide-react';
import * as docx from 'docx';

interface PreviewPanelProps {
  data: CoverPageData;
  previewRef: React.RefObject<HTMLDivElement>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ data, previewRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const dimensions = PAGE_DIMENSIONS[data.pageSize];

  const calculateAutoFit = () => {
    if (containerRef.current && containerRef.current.offsetWidth > 0) {
      const containerWidth = containerRef.current.offsetWidth;
      const horizontalPadding = window.innerWidth < 768 ? 24 : 64;
      const pageWidthPx = parseFloat(dimensions.width) * 3.78; 
      const newScale = (containerWidth - horizontalPadding) / pageWidthPx;
      return Math.max(0.1, Math.min(newScale, 1.2));
    }
    return null;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (isAutoFit) {
        const newScale = calculateAutoFit();
        if (newScale) setScale(newScale);
      }
    });
    resizeObserver.observe(containerRef.current);
    const initial = calculateAutoFit();
    if (initial) { setScale(initial); setIsInitializing(false); }
    return () => resizeObserver.disconnect();
  }, [dimensions.width, isAutoFit]);

  const handleManualZoom = (direction: 'in' | 'out') => {
    setIsAutoFit(false);
    setScale(prev => Math.max(0.05, Math.min(direction === 'in' ? prev + 0.1 : prev - 0.1, 3.0)));
  };

  const toggleAutoFit = () => {
    setIsAutoFit(prev => {
      const next = !prev;
      if (next) {
        const fitScale = calculateAutoFit();
        if (fitScale) setScale(fitScale);
      }
      return next;
    });
  };

  const exportAsDocx = async () => {
    setIsExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle, VerticalAlign } = docx;
      const children: any[] = [];
      
      if (data.showLogo && data.universityLogo) {
          try {
              const base64Data = data.universityLogo.split(',')[1];
              const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
              children.push(new Paragraph({
                  alignment: data.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                  children: [new ImageRun({ data: buffer, transformation: { width: 100, height: 100 } } as any)],
                  spacing: { after: 400 }
              }));
          } catch(e) {}
      }
      
      children.push(new Paragraph({
          alignment: data.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: data.universityName, bold: true, size: 36, color: data.accentColor.replace('#', '') })],
          spacing: { after: 100 }
      }));
      
      if (data.department) {
          children.push(new Paragraph({
              alignment: data.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [new TextRun({ text: data.department, size: 24 })],
              spacing: { after: 1200 }
          }));
      }
      
      children.push(new Paragraph({
          alignment: data.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: data.assignmentType.toUpperCase(), size: 28, bold: true, color: '666666' })],
          spacing: { after: 200 }
      }));
      
      children.push(new Paragraph({
          alignment: data.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: [new TextRun({ text: data.reportTitle, bold: true, size: data.titleFontSize * 2 })],
          spacing: { after: 1500 }
      }));
      
      const tableRows = [
          ['Course', `${data.courseTitle} (${data.courseCode})`],
          ['Submitted To', data.professorName],
      ];
      
      if (data.professorDesignation) tableRows.push(['Designation', data.professorDesignation]);
      data.students.forEach((s, i) => tableRows.push([i === 0 ? 'Submitted By' : '', `${s.name} (${s.studentId})`]));
      tableRows.push(['Session', data.session]);
      tableRows.push(['Date', data.submissionDate]);
      if (data.diagnosis) tableRows.push(['Diagnosis/Group', data.diagnosis]);
      data.customFields.forEach(f => tableRows.push([f.label, f.value]));
      
      const docxTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }, insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE } },
          rows: tableRows.map(row => new TableRow({
              children: [
                  new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, size: data.detailsFontSize * 2 })] })], verticalAlign: VerticalAlign.CENTER, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' } } }),
                  new TableCell({ width: { size: 60, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: row[1], size: data.detailsFontSize * 2 })] })], verticalAlign: VerticalAlign.CENTER, borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' } } }),
              ],
          })),
      });
      
      children.push(docxTable);
      
      const doc = new Document({ sections: [{ properties: { page: { size: { width: data.pageSize === PageSize.A4 ? 11906 : 12240, height: data.pageSize === PageSize.A4 ? 16838 : 15840 } } }, children: children }] });
      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cover-page-${data.reportTitle.slice(0, 15).replace(/\s+/g, '-')}.docx`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("DOCX generation failed.");
    } finally {
      setIsExporting(false);
    }
  };

  const getTemplateStyles = () => {
    const isCentered = data.alignment === 'center';
    switch(data.template) {
      case TemplateType.ACADEMIC:
        return {
          header: { display: 'block', borderBottom: `3px solid ${data.accentColor}`, paddingBottom: '30px', marginBottom: '50px', textAlign: data.alignment as any },
          logo: { display: 'inline-block', width: '100px', height: '100px', marginRight: '30px', verticalAlign: 'middle' },
          titles: { display: 'inline-block', verticalAlign: 'middle', width: 'calc(100% - 150px)' },
          line: false
        };
      case TemplateType.MODERN:
        return {
          header: { display: 'block', borderLeft: `12px solid ${data.accentColor}`, paddingLeft: '40px', marginBottom: '60px', textAlign: 'left' as any },
          logo: { position: 'absolute' as any, top: '100px', right: '100px', width: '85px', height: '85px' },
          titles: { display: 'block' },
          line: false
        };
      default: // FORMAL
        return {
          header: { display: 'block', marginBottom: '60px', textAlign: data.alignment as any },
          logo: { display: 'block', width: '150px', height: '150px', margin: isCentered ? '0 auto 30px auto' : '0 0 30px 0' },
          titles: { display: 'block' },
          line: true
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 w-full h-full min-h-[400px] no-print pb-24 md:pb-10">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => handleManualZoom('out')} className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><ZoomOut size={18} /></button>
          <div className="px-2 min-w-[60px] text-center select-none font-bold text-slate-800 text-xs">{Math.round(scale * 100)}%</div>
          <button onClick={() => handleManualZoom('in')} className="p-2 hover:bg-white rounded-lg text-slate-600 transition-colors"><ZoomIn size={18} /></button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button onClick={toggleAutoFit} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider ${isAutoFit ? 'bg-blue-600 text-white' : 'text-slate-600 bg-white'}`}>
            <Maximize size={14} className="inline mr-1" /> Fit
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isExporting ? (
            <div className="px-6 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold animate-pulse flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" /> EXPORTING...
            </div>
          ) : (
            <button 
              onClick={exportAsDocx} 
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <FileOutput size={16} /> DOWNLOAD DOCX
            </button>
          )}
        </div>
      </div>

      <div className="w-full flex-grow flex justify-center py-6 overflow-visible relative">
        <div 
          className="relative transition-all duration-300 origin-top"
          style={{ 
            transform: `scale(${scale})`, 
            width: dimensions.width,
            height: dimensions.height,
            marginBottom: `calc(-1 * ${parseFloat(dimensions.height)}mm * (1 - ${scale}))`,
            visibility: isInitializing ? 'hidden' : 'visible'
          }}
        >
          <div 
            id="print-area"
            ref={previewRef}
            className="bg-white"
            style={{ 
              width: dimensions.width, 
              height: dimensions.height,
              padding: '30mm',
              fontFamily: data.font,
              color: '#000',
              boxSizing: 'border-box',
              position: 'relative',
              boxShadow: '0 40px 100px -20px rgba(0,0,0,0.1)',
              border: '1px solid #eee'
            }}
          >
            {/* Header Block */}
            <div style={styles.header as any}>
              {data.showLogo && data.universityLogo && (
                <div style={styles.logo as any}>
                  <img src={data.universityLogo} className="w-full h-full object-contain" crossOrigin="anonymous" />
                </div>
              )}
              <div style={styles.titles as any}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: data.accentColor, textTransform: 'uppercase', lineHeight: '1.1', marginBottom: '10px' }}>
                  {data.universityName}
                </div>
                <div style={{ fontSize: '20px', fontWeight: '500', color: '#666', lineHeight: '1.2' }}>
                  {data.department}
                </div>
              </div>
            </div>

            {styles.line && (
              <div style={{ width: '100%', height: '4px', background: `linear-gradient(90deg, ${data.accentColor}, #eee)`, marginBottom: '50px', borderRadius: '4px' }} />
            )}

            {/* Title Section Block */}
            <div style={{ width: '100%', marginTop: '60px', textAlign: data.alignment as any }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '40px' }}>
                {data.assignmentType}
              </div>
              <div style={{ 
                  fontSize: `${data.titleFontSize}px`, 
                  fontWeight: 'bold', 
                  color: '#000', 
                  lineHeight: '1.3', 
                  display: 'block',
                  width: '100%',
                  wordWrap: 'break-word'
              }}>
                {data.reportTitle}
              </div>
            </div>

            {/* Details Section Block - Using TABLE for ultimate stability */}
            <div style={{ 
                position: 'absolute', bottom: '30mm', left: '30mm', right: '30mm',
                borderTop: '2px solid #eee', paddingTop: '40px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <tbody>
                  {[
                    ['Course Title', `${data.courseTitle} (${data.courseCode})`],
                    ['Submitted To', data.professorName],
                    ...(data.professorDesignation ? [['Designation', data.professorDesignation]] : []),
                    ...data.students.map((s, i) => [i === 0 ? 'Submitted By' : '', `${s.name} (${s.studentId})`]),
                    ['Session', data.session],
                    ['Date', new Date(data.submissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })],
                    ...(data.diagnosis ? [['Group/ID', data.diagnosis]] : []),
                    ...data.customFields.filter(f => f.label && f.value).map(f => [f.label, f.value])
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ width: '35%', padding: '6px 0', verticalAlign: 'top', fontSize: `${data.detailsFontSize}px`, fontWeight: 'bold', color: '#444' }}>{row[0]}</td>
                      <td style={{ width: '5%', padding: '6px 0', verticalAlign: 'top', fontSize: `${data.detailsFontSize}px`, color: '#ccc', textAlign: 'center' }}>{row[0] ? ':' : ''}</td>
                      <td style={{ width: '60%', padding: '6px 0', verticalAlign: 'top', fontSize: `${data.detailsFontSize}px`, fontWeight: '500', color: '#000' }}>{row[1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.showFooter && (
              <div style={{ position: 'absolute', bottom: '12mm', left: 0, width: '100%', textAlign: 'center', fontSize: '11px', color: '#ddd', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.6em' }}>
                Generated with CoverPage Pro
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
