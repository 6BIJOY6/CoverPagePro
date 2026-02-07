
import React from 'react';
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
  const dimensions = PAGE_DIMENSIONS[data.pageSize];

  const exportAsImage = async (format: 'png' | 'jpg') => {
    if (!previewRef.current) return;
    const scale = 3; 
    const canvas = await (window as any).html2canvas(previewRef.current, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `cover-page-${data.reportTitle.slice(0, 15)}.${format}`;
    link.href = canvas.toDataURL(`image/${format === 'png' ? 'png' : 'jpeg'}`, format === 'jpg' ? 0.92 : 1);
    link.click();
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
                })],
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
          header: "flex flex-row items-start gap-8 border-b-2 pb-6",
          headerTitle: "flex-1 text-left",
          logoSize: "w-24 h-24",
          accentLine: true
        };
      case TemplateType.MODERN:
        return {
          header: "flex flex-col items-start gap-4",
          headerTitle: "text-left border-l-4 pl-6",
          logoSize: "w-16 h-16 absolute top-8 right-8",
          accentLine: false
        };
      default: // FORMAL
        return {
          header: `flex flex-col items-center gap-6 ${data.alignment === 'left' ? 'items-start' : 'items-center'}`,
          headerTitle: `w-full ${data.alignment === 'left' ? 'text-left' : 'text-center'}`,
          logoSize: "w-32 h-32",
          accentLine: true
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-full no-print pb-20">
      <div className="flex flex-wrap items-center justify-center gap-2 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-white sticky top-0 z-10 w-full md:w-auto">
        <span className="text-xs font-bold text-slate-400 uppercase px-2">Export As</span>
        <button onClick={() => exportAsImage('png')} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-sm transition-all shadow-md group">
          <FileImage size={16} />
          <span>PNG</span>
        </button>
        <button onClick={() => exportAsImage('jpg')} className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-sm transition-all shadow-md group">
          <FileImage size={16} />
          <span>JPG</span>
        </button>
        <button onClick={exportAsDocx} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all shadow-md group">
          <FileOutput size={16} />
          <span>Word</span>
        </button>
      </div>

      <div 
        id="print-area"
        ref={previewRef}
        className="bg-white shadow-2xl overflow-hidden relative transition-all duration-300 flex flex-col"
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
            <h2 className="text-3xl font-bold uppercase tracking-tight leading-none mb-2" style={{ color: data.accentColor }}>
              {data.universityName}
            </h2>
            <h3 className="text-xl font-medium text-slate-600">
              {data.department}
            </h3>
          </div>
        </div>

        {styles.accentLine && (
          <div className="h-[2px] w-full mb-8" style={{ background: `linear-gradient(90deg, ${data.accentColor}, transparent)` }} />
        )}

        {/* Middle Section - Centered Vertically */}
        <div className={`flex-grow flex flex-col justify-center ${data.alignment === 'center' ? 'text-center' : 'text-left'}`}>
          <p className="text-xl font-bold text-slate-400 tracking-[0.25em] uppercase mb-4">
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
        <div className="mt-12 space-y-2">
          <div className="grid grid-cols-12 gap-y-3 pt-8 border-t-2" style={{ borderTopColor: '#f1f1f1' }}>
            <DetailRow fontSize={data.detailsFontSize} label="Course Title" value={`${data.courseTitle} (${data.courseCode})`} />
            <DetailRow fontSize={data.detailsFontSize} label="Submitted To" value={data.professorName} />
            
            {/* New Professor Designation Row */}
            {data.professorDesignation && (
              <DetailRow fontSize={data.detailsFontSize} label="Designation" value={data.professorDesignation} />
            )}
            
            {/* Multiple Students Support */}
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
          <div className="absolute bottom-8 left-0 w-full text-center text-[9px] text-slate-200 uppercase tracking-widest no-print">
            Generated by CoverPage Pro
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;
