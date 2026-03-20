import React, { useState, useRef } from 'react';
import { PatientCase } from '../types';
import { Copy, Download, User, Stethoscope, Activity, TestTube, FileText, HelpCircle, GraduationCap, AlertCircle, FileDown, Plus, Loader2, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

interface CaseViewProps {
  patientCase: PatientCase;
  onReset?: () => void;
  diagnosticMode?: boolean;
}

export default function CaseView({ patientCase, onReset, diagnosticMode }: CaseViewProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const caseRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    const text = generateTextContent(patientCase);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const text = generateTextContent(patientCase);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClinicalCase_${patientCase.demographics.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    setIsExporting(true);
    try {
      const c = patientCase;
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: `CLINICAL CASE: ${c.demographics.name}`,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Generated: ${new Date(c.timestamp).toLocaleString()}`,
                    italics: true,
                  }),
                ],
              }),
              
              new Paragraph({ text: "PATIENT DEMOGRAPHICS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ children: [new TextRun({ text: "Name: ", bold: true }), new TextRun(c.demographics.name)] }),
              new Paragraph({ children: [new TextRun({ text: "Age: ", bold: true }), new TextRun(c.demographics.age)] }),
              new Paragraph({ children: [new TextRun({ text: "Sex: ", bold: true }), new TextRun(c.demographics.sex)] }),
              new Paragraph({ children: [new TextRun({ text: "Race: ", bold: true }), new TextRun(c.demographics.race)] }),
              new Paragraph({ children: [new TextRun({ text: "Occupation: ", bold: true }), new TextRun(c.demographics.occupation)] }),
              new Paragraph({ children: [new TextRun({ text: "Marital Status: ", bold: true }), new TextRun(c.demographics.maritalStatus)] }),
              new Paragraph({ children: [new TextRun({ text: "Location: ", bold: true }), new TextRun(c.demographics.location || 'N/A')] }),

              new Paragraph({ text: "CHIEF COMPLAINT", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ children: [new TextRun({ text: `"${c.chiefComplaint}"`, italics: true })] }),

              new Paragraph({ text: "HISTORY OF PRESENT ILLNESS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.historyOfPresentIllness }),

              new Paragraph({ text: "PAST MEDICAL HISTORY", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.pastMedicalHistory.join(', ') }),

              new Paragraph({ text: "MEDICATIONS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.medications.join(', ') }),

              new Paragraph({ text: "ALLERGIES", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.allergies.join(', ') }),

              new Paragraph({ text: "FAMILY & SOCIAL HISTORY", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ children: [new TextRun({ text: "Family History: ", bold: true }), new TextRun(c.familyHistory)] }),
              new Paragraph({ children: [new TextRun({ text: "Social History: ", bold: true }), new TextRun(c.socialHistory)] }),

              new Paragraph({ text: "REVIEW OF SYSTEMS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.reviewOfSystems }),

              new Paragraph({ text: "PHYSICAL EXAM", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ children: [new TextRun({ text: "Vitals: ", bold: true }), new TextRun(`BP ${c.physicalExam.vitals.bp}, HR ${c.physicalExam.vitals.hr}, RR ${c.physicalExam.vitals.rr}, Temp ${c.physicalExam.vitals.temp}, SpO2 ${c.physicalExam.vitals.spo2}`)] }),
              new Paragraph({ children: [new TextRun({ text: "General: ", bold: true }), new TextRun(c.physicalExam.general)] }),
              new Paragraph({ children: [new TextRun({ text: "HEENT: ", bold: true }), new TextRun(c.physicalExam.heent)] }),
              new Paragraph({ children: [new TextRun({ text: "Cardiovascular: ", bold: true }), new TextRun(c.physicalExam.cardiovascular)] }),
              new Paragraph({ children: [new TextRun({ text: "Respiratory: ", bold: true }), new TextRun(c.physicalExam.respiratory)] }),
              new Paragraph({ children: [new TextRun({ text: "Abdomen: ", bold: true }), new TextRun(c.physicalExam.abdomen)] }),
              new Paragraph({ children: [new TextRun({ text: "Neurological: ", bold: true }), new TextRun(c.physicalExam.neurological)] }),
              new Paragraph({ children: [new TextRun({ text: "Musculoskeletal: ", bold: true }), new TextRun(c.physicalExam.musculoskeletal)] }),
              new Paragraph({ children: [new TextRun({ text: "Skin: ", bold: true }), new TextRun(c.physicalExam.skin)] }),

              new Paragraph({ text: "LABORATORY RESULTS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              ...c.labs.map(l => new Paragraph({ 
                text: `${l.testName}: ${l.value} ${l.unit} (${l.referenceRange}) [${l.flag || 'Normal'}]`,
                bullet: { level: 0 }
              })),

              new Paragraph({ text: "IMAGING & DIAGNOSTICS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              ...c.imaging.flatMap(i => [
                new Paragraph({ children: [new TextRun({ text: i.modality, bold: true })] }),
                new Paragraph({ text: `Findings: ${i.findings}` }),
                new Paragraph({ children: [new TextRun({ text: `Impression: ${i.impression}`, italics: true })] }),
                new Paragraph({ text: "" }),
              ]),

              new Paragraph({ text: "DIFFERENTIAL DIAGNOSIS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.differentialDiagnosis.join(', ') }),

              new Paragraph({ text: "FINAL DIAGNOSIS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ children: [new TextRun({ text: c.finalDiagnosis, bold: true, size: 28, color: "2563eb" })] }),

              new Paragraph({ text: "DISCUSSION & TEACHING", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              ...c.discussionQuestions.flatMap(q => [
                new Paragraph({ children: [new TextRun({ text: `Q: ${q.question}`, bold: true })] }),
                new Paragraph({ children: [new TextRun({ text: `A: ${q.answer}`, italics: true })] }),
                new Paragraph({ text: "" }),
              ]),

              new Paragraph({ text: "TEACHING POINTS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              ...c.teachingPoints.map(tp => new Paragraph({ text: tp, bullet: { level: 0 } })),

              new Paragraph({ text: "RED HERRINGS", heading: HeadingLevel.HEADING_2, spacing: { before: 400 } }),
              new Paragraph({ text: c.redHerrings?.join(', ') || 'None' }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `ClinicalCase_${c.demographics.name.replace(/[^a-z0-9]/gi, '_')}.docx`);
    } catch (error) {
      console.error('Word export failed:', error);
      alert('Failed to generate Word document. Try using the "Copy" button or "Download Text" as a fallback.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateTextContent = (c: PatientCase) => {
    return `
CLINICAL CASE: ${c.demographics.name}
Generated: ${new Date(c.timestamp).toLocaleString()}
Complexity: ${c.input.complexity}

1. PATIENT DEMOGRAPHICS
Name: ${c.demographics.name}
Age: ${c.demographics.age}
Sex: ${c.demographics.sex}
Race: ${c.demographics.race}
Occupation: ${c.demographics.occupation}
Marital Status: ${c.demographics.maritalStatus}
Location: ${c.demographics.location || 'N/A'}

2. CHIEF COMPLAINT
"${c.chiefComplaint}"

3. HISTORY OF PRESENT ILLNESS
${c.historyOfPresentIllness}

4. PAST MEDICAL HISTORY
${c.pastMedicalHistory.join(', ')}

5. MEDICATIONS
${c.medications.join(', ')}

6. ALLERGIES
${c.allergies.join(', ')}

7. FAMILY HISTORY
${c.familyHistory}

8. SOCIAL HISTORY
${c.socialHistory}

9. REVIEW OF SYSTEMS
${c.reviewOfSystems}

10. PHYSICAL EXAM
Vitals: BP ${c.physicalExam.vitals.bp}, HR ${c.physicalExam.vitals.hr}, RR ${c.physicalExam.vitals.rr}, Temp ${c.physicalExam.vitals.temp}, SpO2 ${c.physicalExam.vitals.spo2}
General: ${c.physicalExam.general}
HEENT: ${c.physicalExam.heent}
Cardiovascular: ${c.physicalExam.cardiovascular}
Respiratory: ${c.physicalExam.respiratory}
Abdomen: ${c.physicalExam.abdomen}
Neurological: ${c.physicalExam.neurological}
Musculoskeletal: ${c.physicalExam.musculoskeletal}
Skin: ${c.physicalExam.skin}

11. LABORATORY RESULTS
${c.labs.map(l => `${l.testName}: ${l.value} ${l.unit} (${l.referenceRange}) [${l.flag || 'Normal'}]`).join('\n')}

12. IMAGING & DIAGNOSTICS
${c.imaging.map(i => `${i.modality} - Impression: ${i.impression}\nFindings: ${i.findings}`).join('\n\n')}

13. DIFFERENTIAL DIAGNOSIS
${c.differentialDiagnosis.join(', ')}

14. FINAL DIAGNOSIS
${c.finalDiagnosis}

15. DISCUSSION & TEACHING
Questions:
${c.discussionQuestions.map(q => `[${q.difficulty}] Q: ${q.question}\nA: ${q.answer}`).join('\n\n')}

Teaching Points:
${c.teachingPoints.map(tp => `- ${tp}`).join('\n')}

RED HERRINGS:
${c.redHerrings?.join(', ') || 'None'}
    `.trim();
  };

  const Section = ({ title, icon: Icon, children, className = "" }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
    <div className={`p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
        <Icon className="w-5 h-5" />
        <h3 className="font-bold uppercase tracking-wider text-xs">{title}</h3>
      </div>
      <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-5xl mx-auto pb-20"
    >
      {/* Diagnostic Info */}
      {diagnosticMode && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-2 uppercase tracking-wider">
            <Settings className="w-3 h-3" /> Case Metadata (Diagnostic)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Case ID:</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{patientCase.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Generated At:</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{new Date(patientCase.timestamp).toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Complexity:</p>
              <p className="font-mono font-bold text-slate-900 dark:text-white">{patientCase.input.complexity}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-slate-50/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md py-4 z-10 px-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{patientCase.demographics.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {patientCase.demographics.age} • {patientCase.demographics.sex} • {patientCase.demographics.race}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Case
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? 'Copied!' : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
          <div className="flex bg-blue-600 rounded-xl overflow-hidden">
            <button
              onClick={handleDownloadDocx}
              disabled={isExporting}
              className="flex items-center gap-2 px-6 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Download Word
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 text-blue-100 hover:bg-blue-700 border-l border-blue-500 transition-colors"
              title="Download Text"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div ref={caseRef} data-pdf-content className="space-y-6 p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Section title="Demographics" icon={User}>
            <div className="grid grid-cols-2 gap-y-2">
              <div className="text-slate-500">Race/Ethnicity:</div>
              <div>{patientCase.demographics.race}</div>
              <div className="text-slate-500">Occupation:</div>
              <div>{patientCase.demographics.occupation}</div>
              <div className="text-slate-500">Marital Status:</div>
              <div>{patientCase.demographics.maritalStatus}</div>
              <div className="text-slate-500">Location:</div>
              <div>{patientCase.demographics.location || 'N/A'}</div>
            </div>
          </Section>

        <Section title="Chief Complaint" icon={AlertCircle} className="md:col-span-2">
          <p className="text-lg italic font-serif text-slate-900 dark:text-slate-100">
            "{patientCase.chiefComplaint}"
          </p>
        </Section>

        <Section title="History of Present Illness" icon={FileText} className="md:col-span-3">
          <p className="whitespace-pre-wrap">{patientCase.historyOfPresentIllness}</p>
        </Section>

        <Section title="Medical History" icon={Activity}>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2">Past Medical History</h4>
              <ul className="list-disc list-inside space-y-1">
                {patientCase.pastMedicalHistory.map((h, i) => <li key={i}>{h}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2">Medications</h4>
              <ul className="list-disc list-inside space-y-1">
                {patientCase.medications.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2">Allergies</h4>
              <ul className="list-disc list-inside space-y-1">
                {patientCase.allergies.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Social & Family History" icon={User}>
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2">Family History</h4>
              <p>{patientCase.familyHistory}</p>
            </div>
            <div>
              <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2">Social History</h4>
              <p>{patientCase.socialHistory}</p>
            </div>
          </div>
        </Section>

        <Section title="Review of Systems" icon={Stethoscope}>
          <p>{patientCase.reviewOfSystems}</p>
        </Section>

        <Section title="Physical Exam" icon={Stethoscope} className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-3">Vital Signs</h4>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between"><span>BP:</span> <span className="font-bold">{patientCase.physicalExam.vitals.bp}</span></div>
                <div className="flex justify-between"><span>HR:</span> <span className="font-bold">{patientCase.physicalExam.vitals.hr}</span></div>
                <div className="flex justify-between"><span>RR:</span> <span className="font-bold">{patientCase.physicalExam.vitals.rr}</span></div>
                <div className="flex justify-between"><span>Temp:</span> <span className="font-bold">{patientCase.physicalExam.vitals.temp}</span></div>
                <div className="flex justify-between"><span>SpO2:</span> <span className="font-bold">{patientCase.physicalExam.vitals.spo2}</span></div>
              </div>
            </div>
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(patientCase.physicalExam).map(([key, value]) => {
                if (key === 'vitals') return null;
                return (
                  <div key={key}>
                    <h5 className="font-bold text-[10px] uppercase text-slate-400 mb-1">{key}</h5>
                    <p className="text-xs">{value as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        <Section title="Laboratory Results" icon={TestTube} className="md:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="text-left py-2">Test</th>
                  <th className="text-left py-2">Value</th>
                  <th className="text-left py-2">Unit</th>
                  <th className="text-left py-2">Ref Range</th>
                  <th className="text-center py-2">Flag</th>
                </tr>
              </thead>
              <tbody>
                {patientCase.labs.map((lab, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-900 last:border-0">
                    <td className="py-2 font-medium">{lab.testName}</td>
                    <td className={`py-2 font-bold ${lab.flag === 'H' || lab.flag === 'L' ? 'text-red-500' : ''}`}>
                      {lab.value}
                    </td>
                    <td className="py-2 text-slate-500">{lab.unit}</td>
                    <td className="py-2 text-slate-500">{lab.referenceRange}</td>
                    <td className="py-2 text-center">
                      {lab.flag === 'H' && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-[10px] font-bold">HIGH</span>}
                      {lab.flag === 'L' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold">LOW</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Imaging & Diagnostics" icon={Activity}>
          <div className="space-y-4">
            {patientCase.imaging.map((img, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="font-bold text-xs mb-1">{img.modality}</div>
                <div className="text-[10px] text-slate-500 mb-2 italic">Indication: {img.indication}</div>
                <p className="text-xs mb-2">{img.findings}</p>
                <div className="text-xs font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
                  Impression: {img.impression}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Differential Diagnosis" icon={HelpCircle} className="md:col-span-1">
          <ul className="list-disc list-inside space-y-1">
            {patientCase.differentialDiagnosis.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </Section>

        <Section title="Final Diagnosis" icon={GraduationCap} className="md:col-span-2 bg-blue-50/30 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
          <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{patientCase.finalDiagnosis}</p>
        </Section>

        <Section title="Discussion Questions" icon={HelpCircle} className="md:col-span-3">
          <div className="space-y-6">
            {patientCase.discussionQuestions.map((q, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                    q.difficulty === 'Medium' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {q.difficulty}
                  </span>
                  <p className="font-bold">Q: {q.question}</p>
                </div>
                <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 italic">
                  A: {q.answer}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Teaching Points" icon={GraduationCap} className="md:col-span-2">
          <ul className="space-y-3">
            {patientCase.teachingPoints.map((tp, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
                <p>{tp}</p>
              </li>
            ))}
          </ul>
        </Section>

        {patientCase.redHerrings && patientCase.redHerrings.length > 0 && (
          <Section title="Red Herrings" icon={AlertCircle} className="bg-orange-50/30 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
            <ul className="list-disc list-inside space-y-1 text-orange-800 dark:text-orange-400">
              {patientCase.redHerrings.map((rh, i) => <li key={i}>{rh}</li>)}
            </ul>
          </Section>
        )}
      </div>
    </div>
    </motion.div>
  );
}
