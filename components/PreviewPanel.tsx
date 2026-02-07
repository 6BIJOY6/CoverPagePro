
import React, { useEffect, useState, useRef } from 'react';
import { CoverPageData, PageSize, TemplateType } from '../types';
import { PAGE_DIMENSIONS } from '../constants';
import { FileImage, FileOutput } from 'lucide-react';
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
  const [scale, setScale] = useState(1);
  const dimensions = PAGE_DIMENSIONS[data.pageSize];

  // Logic to auto-scale the A4 preview to fit the container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Convert mm to pixels (approx 3.78px per mm)
        const pageWidthPx = parseFloat(dimensions.width) * 3.78;
        
        if (containerWidth < pageWidthPx) {
          const newScale = (containerWidth - 40) / pageWidthPx;
          setScale(newScale);
        } else {
          setScale(1);
        }
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [dimensions.width]);

  const exportAsImage = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    const originalScale = scale;
    // Temporarily reset scale for high-res capture
    setScale(1);
    
    // Use a small timeout to ensure DOM update
    setTimeout(async () => {
      const scaleFactor = 3; 
      const canvas = await (window as any).html2canvas(previewRef.current, {
        scale: scaleFactor,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `cover-page-${data.reportTitle.slice(0, 15)}.${format}`;
      link.href = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, format === 'jpg' ? 0.92 : 1);
      link.click();
      
      // Restore the visual scale
      setScale(originalScale);
    }, 100);
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
    <div ref={containerRef} className="flex flex-col items-center gap-6 w-full max-w-full no-print pb-20">
      {/* Export Toolbar */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 md:gap-2 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg border border-white sticky top-0 z-10 w-full md:w-auto">
        <button onClick={() => exportAsImage('png')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-black text-white rounded-lg text-xs md:text-sm transition-all group">
          <FileImage size={14} />
          <span>PNG</span>
        </button>
        <button onClick={() => exportAsImage('jpg')} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-black text-white rounded-lg text-xs md:text-sm transition-all group">
          <FileImage size={14} />
          <span>JPG</span>
        </button>
        <button onClick={exportAsDocx} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-sm transition-all group">
          <FileOutput size={14} />
          <span>DOCX</span>
        </button>
      </div>

      {/* Scaling Wrapper */}
      <div 
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          width: scale !== 1 ? 'auto' : dimensions.width,
          height: scale !== 1 ? `${parseFloat(dimensions.height) * scale}mm` : dimensions.height,
          transition: 'transform 0.2s ease-out'
        }}
      >
        <div 
          id="print-area"
          ref={previewRef}
          className="bg-white shadow-2xl overflow-hidden relative flex flex-col"
          style={{ 
            width: dimensions.width, 
            height: dimensions.height,
            padding: '25mm',
            fontFamily: data.font,
            color: '#1a1a1a',
            boxSizing: 'border-box'
          }}
        >
          {/* Header Section */}
          <div className={`${styles.header} relative mb-6`}>
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
            <div className="h-[2px] w-full mb-8" style={{ background: `linear-gradient(90deg, ${data.accentColor}, transparent)` }} />
          )}

          {/* Middle Section - Centered Vertically */}
          <div className={`flex-grow flex flex-col justify-center ${data.alignment === 'center' ? 'text-center' : 'text-left'}`}>
            <p className="text-lg md:text-xl font-bold text-slate-400 tracking-[0.2em] uppercase mb-4">
              {data.assignmentType}
            </p>
            <h1 
              className="font-bold leading-tight" 
              style={{ 
                fontSize: `${data.titleFontSize}px`,
                lineHeight: 1.2
              }}
            >
              {data.reportTitle}
            </h1>
          </div>

          {/* Details Section - Bottom */}
          <div className="mt-8 md:mt-12 space-y-2">
            <div className="grid grid-cols-12 gap-y-2 md:gap-y-3 pt-6 md:pt-8 border-t-2" style={{ borderTopColor: '#f1f1f1' }}>
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
            <div className="absolute bottom-6 md:bottom-8 left-0 w-full text-center text-[8px] md:text-[9px] text-slate-200 uppercase tracking-widest no-print">
              Generated by CoverPage Pro
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
