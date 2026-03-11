import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export type PaperTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'empirical' | 'review' | 'theoretical' | 'methodological';
  sections: TemplateSection[];
};

export type TemplateSection = {
  id: string;
  title: string;
  description: string;
  required: boolean;
  placeholder: string;
};

export const PAPER_TEMPLATES: PaperTemplate[] = [
  {
    id: 'empirical-original',
    name: 'Empirical Research Article',
    description: 'Standard IMRaD format for original research',
    category: 'empirical',
    sections: [
      { id: 'abstract', title: 'Abstract', description: '250 words max, structured background/methods/results/conclusion', required: true, placeholder: 'Context: [background]\nMethods: [design/sample/measures]\nResults: [key findings]\nConclusion: [implications]' },
      { id: 'introduction', title: 'Introduction', description: 'Problem statement, literature gap, research questions/hypotheses', required: true, placeholder: '1. Background and context\n2. Literature gap\n3. Research questions or hypotheses\n4. Study objectives' },
      { id: 'methods', title: 'Methods', description: 'Participants, design, measures, procedure, analysis plan', required: true, placeholder: '2.1 Participants/Sample\n2.2 Design\n2.3 Measures/Materials\n2.4 Procedure\n2.5 Data Analysis' },
      { id: 'results', title: 'Results', description: 'Findings organized by hypotheses/research questions', required: true, placeholder: '3.1 Descriptive statistics\n3.2 Primary analyses\n3.3 Additional/exploratory analyses\n[Include effect sizes and CIs]' },
      { id: 'discussion', title: 'Discussion', description: 'Interpretation, implications, limitations, future directions', required: true, placeholder: '4.1 Summary of findings\n4.2 Theoretical implications\n4.3 Practical implications\n4.4 Limitations\n4.5 Future research\n4.6 Conclusion' },
      { id: 'references', title: 'References', description: 'APA 7th edition format', required: true, placeholder: '[References in APA 7 format]' },
    ],
  },
  {
    id: 'systematic-review',
    name: 'Systematic Review / Meta-Analysis',
    description: 'PRISMA-compliant review template',
    category: 'review',
    sections: [
      { id: 'abstract', title: 'Abstract', description: 'PRISMA abstract checklist', required: true, placeholder: 'Background, Objectives, Data sources, Study eligibility, Participants, Interventions, Results, Conclusions' },
      { id: 'introduction', title: 'Introduction', description: 'Rationale and objectives', required: true, placeholder: 'Rationale for review\nObjectives and research question\nPICOS framework' },
      { id: 'methods', title: 'Methods', description: 'PRISMA methods: protocol, eligibility, information sources, search, selection, data collection, synthesis', required: true, placeholder: 'Eligibility criteria\nInformation sources\nSearch strategy\nSelection process\nData extraction\nRisk of bias assessment\nSynthesis methods' },
      { id: 'results', title: 'Results', description: 'Study selection, characteristics, synthesis, risk of bias', required: true, placeholder: 'Study selection (PRISMA flow)\nStudy characteristics\nRisk of bias\nResults of individual studies\nSynthesis of results\nAdditional analyses' },
      { id: 'discussion', title: 'Discussion', description: 'Summary of evidence, limitations, conclusions', required: true, placeholder: 'Summary of findings\nStrengths and limitations\nConclusions and implications' },
    ],
  },
  {
    id: 'theoretical-paper',
    name: 'Theoretical/Conceptual Paper',
    description: 'Framework development and theoretical analysis',
    category: 'theoretical',
    sections: [
      { id: 'abstract', title: 'Abstract', description: 'Conceptual focus and contribution', required: true, placeholder: 'Purpose, Theoretical approach, Main argument, Implications' },
      { id: 'introduction', title: 'Introduction', description: 'Problem, gap, purpose, overview', required: true, placeholder: 'Theoretical problem\nGap in existing theory\nPurpose and thesis\nPaper structure' },
      { id: 'literature', title: 'Literature Review', description: 'Critical analysis of existing theories', required: true, placeholder: 'Review of relevant theories\nCritique of limitations\nSynthesis of perspectives' },
      { id: 'framework', title: 'Conceptual Framework', description: 'Proposed model/theory with propositions', required: true, placeholder: 'Core concepts and definitions\nProposed relationships\nTheoretical propositions\nVisual model' },
      { id: 'implications', title: 'Implications', description: 'Theoretical and practical implications', required: true, placeholder: 'Theoretical contributions\nPractical applications\nFuture research directions' },
    ],
  },
  {
    id: 'methodological-paper',
    name: 'Methodological Paper',
    description: 'New method, measure, or analytical approach',
    category: 'methodological',
    sections: [
      { id: 'abstract', title: 'Abstract', description: 'Method innovation and validation', required: true, placeholder: 'Problem with existing methods, New approach, Validation, Advantages' },
      { id: 'introduction', title: 'Introduction', description: 'Limitations of current methods, proposed solution', required: true, placeholder: 'Current methodological limitations\nProposed innovation\nObjectives and contributions' },
      { id: 'method', title: 'Method Description', description: 'Detailed procedure and rationale', required: true, placeholder: 'Conceptual foundation\nStep-by-step procedure\nMathematical/statistical formulation\nImplementation details' },
      { id: 'validation', title: 'Validation', description: 'Empirical or simulation evidence', required: true, placeholder: 'Validation studies\nPerformance comparisons\nRobustness checks' },
      { id: 'discussion', title: 'Discussion', description: 'Advantages, limitations, applications', required: true, placeholder: 'Advantages over existing methods\nLimitations and assumptions\nRecommended applications' },
    ],
  },
];

type Props = {
  onSelectTemplate: (template: PaperTemplate) => void;
  onClose: () => void;
};

export function PaperTemplateSelector({ onSelectTemplate, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Templates' },
    { id: 'empirical', label: 'Empirical Research' },
    { id: 'review', label: 'Systematic Reviews' },
    { id: 'theoretical', label: 'Theoretical Papers' },
    { id: 'methodological', label: 'Methodological' },
  ];

  const filteredTemplates = selectedCategory === 'all'
    ? PAPER_TEMPLATES
    : PAPER_TEMPLATES.filter(t => t.category === selectedCategory);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        background: colors.bgSecondary,
        borderRadius: '16px',
        width: 'min(900px, 90vw)',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${colors.borderPrimary}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: `1px solid ${colors.borderPrimary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: colors.textPrimary }}>
              📄 Paper Templates
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: colors.textSecondary }}>
              Choose a pre-structured academic template to start your paper
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textSecondary,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Category Filter */}
        <div style={{
          padding: '16px 28px',
          borderBottom: `1px solid ${colors.borderPrimary}`,
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat.id
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                color: selectedCategory === cat.id ? '#fff' : colors.textPrimary,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div style={{
          padding: '24px 28px',
          overflow: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {filteredTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              style={{
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${hoveredTemplate === template.id ? 'rgba(99,102,241,0.5)' : colors.borderPrimary}`,
                background: hoveredTemplate === template.id
                  ? isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)'
                  : isDark ? 'rgba(255,255,255,0.03)' : '#fff',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '4px',
              }}>
                <span style={{ fontSize: '24px' }}>
                  {template.category === 'empirical' && '🔬'}
                  {template.category === 'review' && '📚'}
                  {template.category === 'theoretical' && '💡'}
                  {template.category === 'methodological' && '⚙️'}
                </span>
                <span style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: colors.textSecondary,
                  fontWeight: 600,
                }}>
                  {template.category}
                </span>
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 600,
                color: colors.textPrimary,
              }}>
                {template.name}
              </h3>
              <p style={{
                margin: 0,
                fontSize: '12px',
                color: colors.textSecondary,
                lineHeight: 1.5,
              }}>
                {template.description}
              </p>
              <div style={{
                marginTop: '8px',
                fontSize: '11px',
                color: colors.textSecondary,
              }}>
                {template.sections.length} sections
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PaperTemplateSelector;
