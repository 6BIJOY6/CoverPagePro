
import React, { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { CoverPageData, PageSize, TemplateType } from '../types';
import { PAGE_DIMENSIONS } from '../constants';
import { FileImage, FileOutput, ZoomIn, ZoomOut, Maximize, Search, Loader2 } from 'lucide-react';
import * as docx from 'docx';

interface PreviewPanelProps {
  data: CoverPageData;
  previewRef: React.RefObject<HTMLDivElement>;
}

const DetailRow: React.FC<{ label: string; value: string; fontSize: number }> = ({ label, value, fontSize }) => (
  <>
    <div className="col-span-4 font-bold text-slate-700" style={{ fontSize: `${fontSize}px` }}>{label}</div>
    <div className="col-span-1 text-center text-slate-300" style={{ fontSize: `${fontSize}px` }}>:</div>
    <div className="col-span-7 font-medium text-slate-900" style={{ fontSize: `${fontSize}px` }}>{value}</div>
  </>
);

const PreviewPanel: React.FC<PreviewPanelProps> = ({ data, previewRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5); // Default to a visible middle-ground
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const dimensions = PAGE_DIMENSIONS[data.pageSize];

  const calculateAutoFit = () => {
    if (containerRef.current && containerRef.current.offsetWidth > 0) {
      const containerWidth = containerRef.current.offsetWidth;
      const horizontalPadding = window.innerWidth < 768 ? 32 : 80;
      const pageWidthPx = parseFloat(dimensions.width) * 3.78; 
      
      const newScale = (containerWidth - horizontalPadding) / pageWidthPx;
      return Math.max(0.2, Math.min(newScale, 1.1));
    }
    return null;
  };

  // Use ResizeObserver for more reliable dimension tracking (especially when switching tabs)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && isAutoFit) {
          const newScale = calculateAutoFit();
          if (newScale) {
            setScale(newScale);
            setIsInitializing(false);
          }
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    
    // Initial calculation attempt
    const initial = calculateAutoFit();
    if (initial) {
      setScale(initial);
      setIsInitializing(false);
    }

    return () => resizeObserver.disconnect();
  }, [dimensions.width, isAutoFit]);

  const handleManualZoom = (direction: 'in' | 'out') => {
    setIsAutoFit(false);
    setScale(prev => {
      const next = direction === 'in' ? prev + 0.1 : prev - 0.1;
      return Math.max(0.15, Math.min(next, 2.0));
    });
  };

  const toggleAutoFit = () => {
    setIsAutoFit(true);
    const newScale = calculateAutoFit();
    if (newScale) setScale(newScale);
  };

  const exportAsImage = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    const originalScale = scale;
    const originalAutoFit = isAutoFit;
    
    setScale(1);
    setIsAutoFit(false);
    
    setTimeout(async () => {
      try {
        const scaleFactor = 3; 
        const canvas = await (window as any).html2canvas(previewRef.current, {
          scale: scaleFactor,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: parseFloat(dimensions.width) * 3.78,
          windowHeight: parseFloat(dimensions.height) * 3.78
        });
        
        const link = document.createElement('a');
        link.download = `cover-page-${data.reportTitle.slice(0, 15)}.${format}`;
        link.href = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, format === 'jpg' ? 0.92 : 1);
        link.click();
      } catch (err) {
        console.error("Export failed:", err);
      } finally {
        setScale(originalScale);
        setIsAutoFit(originalAutoFit);
      }
    }, 200);
  };

  const exportAsDocx = async () => {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle, VerticalAlign } = docx;

    const children: any[] = [];

    if (data.showLogo && data.universityLogo) {
        try {
            const base64Data = data.universityLogo.split(',')[1];
            const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            children.push(new Paragraph({
                alignment: data.alignment === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
                children: [new ImageRun({
                    data: buffer,
                    transformation: { width: 100, height: 100 },
                } as any)],
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

    if (data.professorDesignation) {
      tableRows.push(['Designation', data.professorDesignation]);
    }

    data.students.forEach((s, i) => {
      tableRows.push([i === 0 ? 'Submitted By' : '', `${s.name} (${s.studentId})`]);
    });

    tableRows.push(['Session', data.session]);
    tableRows.push(['Date', data.submissionDate]);

    if (data.diagnosis) tableRows.push(['Diagnosis/Group', data.diagnosis]);
    data.customFields.forEach(f => tableRows.push([f.label, f.value]));

    const docxTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
        },
        rows: tableRows.map(row => new TableRow({
            children: [
                new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, size: data.detailsFontSize * 2 })] })],
                    verticalAlign: VerticalAlign.CENTER,
                    borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' } }
                }),
                new TableCell({
                    width: { size: 60, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: row[1], size: data.detailsFontSize * 2 })] })],
                    verticalAlign: VerticalAlign.CENTER,
                    borders: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'EEEEEE' } }
                }),
            ],
        })),
    });

    children.push(docxTable);

    const doc = new Document({
        sections: [{
            properties: {
                page: { size: { width: data.pageSize === PageSize.A4 ? 11906 : 12240, height: data.pageSize === PageSize.A4 ? 16838 : 15840 } }
            },
            children: children,
        }],
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cover-page-${data.reportTitle.slice(0, 15)}.docx`;
    link.click();
  };

  const getTemplateStyles = () => {
    switch(data.template) {
      case TemplateType.ACADEMIC:
        return {
          header: "flex flex-row items-start gap-4 md:gap-8 border-b-2 pb-6",
          headerTitle: "flex-1 text-left",
          logoSize: "w-16 h-16 md:w-24 md:h-24",
          accentLine: true
        };
      case TemplateType.MODERN:
        return {
          header: "flex flex-col items-start gap-4",
          headerTitle: "text-left border-l-4 pl-6",
          logoSize: "w-12 h-12 md:w-16 md:h-16 absolute top-8 right-8",
          accentLine: false
        };
      default: // FORMAL
        return {
          header: `flex flex-col items-center gap-4 md:gap-6 ${data.alignment === 'left' ? 'items-start' : 'items-center'}`,
          headerTitle: `w-full ${data.alignment === 'left' ? 'text-left' : 'text-center'}`,
          logoSize: "w-24 h-24 md:w-32 md:h-32",
          accentLine: true
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-4 md:gap-6 w-full h-full min-h-[500px] no-print pb-24 md:pb-10">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full bg-white/90 backdrop-blur-xl p-3 md:p-4 rounded-2xl shadow-xl border border-white/20 sticky top-0 z-40 transition-all">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 md:gap-2 bg-slate-100/80 p-1 rounded-xl">
          <button 
            onClick={() => handleManualZoom('out')}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 active:scale-95"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <div className="flex items-center gap-1.5 px-2 min-w-[70px] justify-center select-none">
            <span className="text-xs font-black text-slate-800 tracking-tighter">{Math.round(scale * 100)}%</span>
          </div>
          <button 
            onClick={() => handleManualZoom('in')}
            className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-600 active:scale-95"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <div className="w-px h-4 bg-slate-300 mx-1" />
          <button 
            onClick={toggleAutoFit}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all uppercase tracking-wider ${isAutoFit ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
          >
            <Maximize size={14} />
            <span>Fit Screen</span>
          </button>
        </div>

        {/* Export Options */}
        <div className="flex items-center gap-1.5 md:gap-2">
          <button onClick={() => exportAsImage('png')} className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md active:scale-95">
            <FileImage size={16} />
            <span>PNG</span>
          </button>
          <button onClick={() => exportAsImage('jpg')} className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md active:scale-95">
            <FileImage size={16} />
            <span>JPG</span>
          </button>
          <button onClick={exportAsDocx} className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs md:text-sm font-bold transition-all shadow-md active:scale-95">
            <FileOutput size={16} />
            <span>DOCX</span>
          </button>
        </div>
      </div>

      {/* Main Page Canvas Container */}
      <div 
        className="w-full flex-grow flex justify-center py-6 md:py-12 overflow-visible relative"
        style={{ perspective: '2000px' }}
      >
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-50/50 z-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium text-slate-500">Preparing Preview...</p>
          </div>
        )}

        <div 
          className="relative origin-top transition-transform duration-500 ease-out"
          style={{ 
            transform: `scale(${scale})`, 
            width: dimensions.width,
            height: dimensions.height,
            marginBottom: `-${parseFloat(dimensions.height) * (1 - scale)}mm`, // Compensate for scaled height in flex container
            imageRendering: 'auto',
            textRendering: 'optimizeLegibility'
          }}
        >
          <div 
            id="print-area"
            ref={previewRef}
            className="bg-white relative flex flex-col"
            style={{ 
              width: dimensions.width, 
              height: dimensions.height,
              padding: '25mm',
              fontFamily: data.font,
              color: '#1a1a1a',
              boxSizing: 'border-box',
              boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              border: '1px solid #ddd',
              willChange: 'transform'
            }}
          >
            {/* Paper Subtle Finish */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-multiply" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }} />

            {/* Header Section */}
            <div className={`${styles.header} relative mb-8 z-10`}>
              {data.showLogo && data.universityLogo && (
                <div className={styles.logoSize}>
                  <img src={data.universityLogo} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              
              <div className={`${styles.headerTitle} ${data.alignment === 'center' ? 'text-center' : 'text-left'}`} style={{ borderLeftColor: data.accentColor }}>
                <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight leading-none mb-2" style={{ color: data.accentColor }}>
                  {data.universityName}
                </h2>
                <h3 className="text-lg md:text-xl font-medium text-slate-600">
                  {data.department}
                </h3>
              </div>
            </div>

            {styles.accentLine && (
              <div className="h-[3px] w-full mb-10 relative z-10 rounded-full" style={{ background: `linear-gradient(90deg, ${data.accentColor}, transparent)` }} />
            )}

            {/* Middle Section - Centered Vertically */}
            <div className={`flex-grow flex flex-col justify-center relative z-10 ${data.alignment === 'center' ? 'text-center' : 'text-left'}`}>
              <p className="text-xl md:text-2xl font-bold text-slate-400 tracking-[0.3em] uppercase mb-6">
                {data.assignmentType}
              </p>
              <h1 
                className="font-bold leading-[1.15]" 
                style={{ 
                  fontSize: `${data.titleFontSize}px`,
                }}
              >
                {data.reportTitle}
              </h1>
            </div>

            {/* Details Section - Bottom */}
            <div className="mt-8 md:mt-16 space-y-2 relative z-10">
              <div className="grid grid-cols-12 gap-y-3 md:gap-y-5 pt-8 md:pt-12 border-t-[2px]" style={{ borderTopColor: '#f1f1f1' }}>
                <DetailRow fontSize={data.detailsFontSize} label="Course Title" value={`${data.courseTitle} (${data.courseCode})`} />
                <DetailRow fontSize={data.detailsFontSize} label="Submitted To" value={data.professorName} />
                
                {data.professorDesignation && (
                  <DetailRow fontSize={data.detailsFontSize} label="Designation" value={data.professorDesignation} />
                )}
                
                {data.students.map((student, index) => (
                   <DetailRow 
                    key={student.id} 
                    fontSize={data.detailsFontSize} 
                    label={index === 0 ? "Submitted By" : ""} 
                    value={`${student.name} (${student.studentId})`} 
                  />
                ))}

                <DetailRow fontSize={data.detailsFontSize} label="Session" value={data.session} />
                <DetailRow fontSize={data.detailsFontSize} label="Submission Date" value={new Date(data.submissionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
                {data.diagnosis && <DetailRow fontSize={data.detailsFontSize} label="Diagnosis / Group" value={data.diagnosis} />}
                
                {data.customFields.map(field => (
                  field.label && field.value && <DetailRow fontSize={data.detailsFontSize} key={field.id} label={field.label} value={field.value} />
                ))}
              </div>
            </div>

            {data.showFooter && (
              <div className="absolute bottom-8 md:bottom-10 left-0 w-full text-center text-[9px] md:text-[11px] text-slate-300 font-bold uppercase tracking-[0.4em] no-print opacity-60">
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
