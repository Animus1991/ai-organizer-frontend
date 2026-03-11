/**
 * PromptTemplates - Research-specific prompt template library
 * Provides pre-built prompts for common academic/research tasks
 */
import React, { useState } from 'react';
import { BookOpen, FlaskConical, BarChart3, FileText, MessageSquare, Search, Lightbulb, CheckCircle, X } from 'lucide-react';

export interface PromptTemplate {
  id: string;
  category: string;
  icon: React.ReactNode;
  title: string;
  titleEl: string; // Greek title
  description: string;
  prompt: string;
  placeholders?: string[]; // e.g., ["topic", "paper title"]
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Literature Review
  {
    id: 'lit-review',
    category: 'Literature',
    icon: <BookOpen size={14} />,
    title: 'Literature Review',
    titleEl: 'Βιβλιογραφική Ανασκόπηση',
    description: 'Systematic review of existing research on a topic',
    prompt: 'Conduct a comprehensive literature review on the topic of "{topic}". Include:\n1. Key findings from seminal papers\n2. Current state of research\n3. Gaps in existing literature\n4. Emerging trends and future directions\n5. Methodological approaches used\nProvide citations where possible.',
    placeholders: ['topic'],
  },
  {
    id: 'paper-critique',
    category: 'Literature',
    icon: <FileText size={14} />,
    title: 'Paper Critique',
    titleEl: 'Κριτική Δημοσίευσης',
    description: 'Critical analysis of a research paper',
    prompt: 'Provide a detailed critical analysis of the following research paper:\n\nTitle: "{paper_title}"\nAbstract/Key Points: {key_points}\n\nAnalyze:\n1. Methodology strengths and weaknesses\n2. Statistical validity\n3. Potential biases\n4. Generalizability of findings\n5. Contribution to the field\n6. Suggestions for improvement',
    placeholders: ['paper_title', 'key_points'],
  },
  // Methodology
  {
    id: 'method-design',
    category: 'Methodology',
    icon: <FlaskConical size={14} />,
    title: 'Methodology Design',
    titleEl: 'Σχεδιασμός Μεθοδολογίας',
    description: 'Help design a research methodology',
    prompt: 'Help me design a research methodology for studying "{research_question}".\n\nConsider:\n1. Appropriate research design (experimental, quasi-experimental, observational)\n2. Sample size and selection criteria\n3. Data collection methods\n4. Variables (dependent, independent, confounding)\n5. Statistical analysis plan\n6. Ethical considerations\n7. Limitations and mitigation strategies',
    placeholders: ['research_question'],
  },
  {
    id: 'hypothesis-gen',
    category: 'Methodology',
    icon: <Lightbulb size={14} />,
    title: 'Hypothesis Generation',
    titleEl: 'Δημιουργία Υποθέσεων',
    description: 'Generate testable hypotheses from observations',
    prompt: 'Based on the following observations and background:\n\n{observations}\n\nGenerate:\n1. 3-5 testable hypotheses (null and alternative)\n2. Predicted outcomes for each\n3. Suggested experimental designs to test each\n4. Potential confounding variables\n5. Statistical tests appropriate for each hypothesis',
    placeholders: ['observations'],
  },
  // Data Analysis
  {
    id: 'data-interpret',
    category: 'Data Analysis',
    icon: <BarChart3 size={14} />,
    title: 'Data Interpretation',
    titleEl: 'Ερμηνεία Δεδομένων',
    description: 'Interpret statistical results and data patterns',
    prompt: 'Help me interpret the following research data:\n\n{data_description}\n\nProvide:\n1. Statistical significance analysis\n2. Effect size interpretation\n3. Pattern identification\n4. Anomaly detection\n5. Comparison with expected results\n6. Limitations of the analysis\n7. Visualization recommendations',
    placeholders: ['data_description'],
  },
  {
    id: 'stat-analysis',
    category: 'Data Analysis',
    icon: <BarChart3 size={14} />,
    title: 'Statistical Analysis Plan',
    titleEl: 'Πλάνο Στατιστικής Ανάλυσης',
    description: 'Design appropriate statistical analysis',
    prompt: 'Design a statistical analysis plan for:\n\nResearch Question: {research_question}\nData Type: {data_type}\nSample Size: {sample_size}\n\nInclude:\n1. Descriptive statistics\n2. Appropriate inferential tests\n3. Assumption checks\n4. Multiple comparison corrections\n5. Power analysis\n6. Reporting format (APA style)',
    placeholders: ['research_question', 'data_type', 'sample_size'],
  },
  // Writing
  {
    id: 'abstract-write',
    category: 'Writing',
    icon: <MessageSquare size={14} />,
    title: 'Abstract Writing',
    titleEl: 'Σύνταξη Περίληψης',
    description: 'Help write a structured abstract',
    prompt: 'Help me write a structured abstract for my research paper:\n\nTopic: {topic}\nKey Findings: {findings}\nMethodology: {methodology}\n\nStructure it as:\n1. Background (1-2 sentences)\n2. Objective\n3. Methods\n4. Results\n5. Conclusions\n\nKeep it under 300 words, clear and impactful.',
    placeholders: ['topic', 'findings', 'methodology'],
  },
  {
    id: 'explain-concept',
    category: 'Writing',
    icon: <Search size={14} />,
    title: 'Explain Concept',
    titleEl: 'Εξήγηση Έννοιας',
    description: 'Explain a complex concept clearly',
    prompt: 'Explain the concept of "{concept}" in a way suitable for {audience}.\n\nInclude:\n1. Clear definition\n2. Historical context\n3. Key principles\n4. Real-world applications\n5. Common misconceptions\n6. Related concepts\n7. Recommended further reading',
    placeholders: ['concept', 'audience'],
  },
  // Code & Technical
  {
    id: 'code-review',
    category: 'Technical',
    icon: <CheckCircle size={14} />,
    title: 'Code Review',
    titleEl: 'Ανασκόπηση Κώδικα',
    description: 'Review research code for correctness and efficiency',
    prompt: 'Review the following research code for:\n\n```{language}\n{code}\n```\n\nAnalyze:\n1. Correctness of implementation\n2. Numerical stability\n3. Performance optimization opportunities\n4. Code quality and readability\n5. Potential bugs or edge cases\n6. Reproducibility concerns\n7. Suggested improvements',
    placeholders: ['language', 'code'],
  },
  {
    id: 'formula-derive',
    category: 'Technical',
    icon: <FlaskConical size={14} />,
    title: 'Formula Derivation',
    titleEl: 'Απόδειξη Τύπου',
    description: 'Step-by-step mathematical derivation',
    prompt: 'Provide a step-by-step derivation of:\n\n{formula_description}\n\nInclude:\n1. Starting axioms/assumptions\n2. Each derivation step with justification\n3. Mathematical notation (LaTeX format)\n4. Physical/conceptual interpretation at each step\n5. Special cases\n6. Numerical example',
    placeholders: ['formula_description'],
  },
];

const CATEGORIES = [...new Set(PROMPT_TEMPLATES.map(t => t.category))];

interface PromptTemplatesPanelProps {
  onSelectTemplate: (prompt: string) => void;
  onClose: () => void;
}

export function PromptTemplatesPanel({ onSelectTemplate, onClose }: PromptTemplatesPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

  const filteredTemplates = PROMPT_TEMPLATES.filter(t => t.category === activeCategory);

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;
    let prompt = selectedTemplate.prompt;
    // Replace placeholders
    Object.entries(placeholderValues).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
    });
    onSelectTemplate(prompt);
    setSelectedTemplate(null);
    setPlaceholderValues({});
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      maxHeight: '360px',
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '12px 12px 0 0',
      boxShadow: '0 -4px 20px hsl(var(--foreground) / 0.08)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      zIndex: 10,
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid hsl(var(--border))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
          📋 Research Prompt Templates
        </span>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'hsl(var(--muted-foreground))', padding: '4px',
        }}>
          <X size={14} />
        </button>
      </div>

      {/* Category tabs */}
      <div style={{
        padding: '6px 12px',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setSelectedTemplate(null); }}
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              border: 'none',
              background: activeCategory === cat ? 'hsl(var(--primary) / 0.15)' : 'transparent',
              color: activeCategory === cat ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template detail or list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {selectedTemplate ? (
          <div>
            <button
              onClick={() => setSelectedTemplate(null)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'hsl(var(--primary))', fontSize: '11px', marginBottom: '6px',
                padding: 0,
              }}
            >
              ← Πίσω
            </button>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--foreground))', marginBottom: '2px' }}>
              {selectedTemplate.titleEl}
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}>
              {selectedTemplate.description}
            </div>
            
            {/* Placeholder inputs */}
            {selectedTemplate.placeholders?.map(ph => (
              <div key={ph} style={{ marginBottom: '6px' }}>
                <label style={{
                  display: 'block', fontSize: '10px', fontWeight: 600,
                  color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase',
                  marginBottom: '2px', letterSpacing: '0.3px',
                }}>
                  {ph.replace(/_/g, ' ')}
                </label>
                <input
                  value={placeholderValues[ph] || ''}
                  onChange={e => setPlaceholderValues(prev => ({ ...prev, [ph]: e.target.value }))}
                  placeholder={`Enter ${ph.replace(/_/g, ' ')}...`}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>
            ))}

            <button
              onClick={handleUseTemplate}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Χρήση Template
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {filteredTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  background: 'hsl(var(--background) / 0.5)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'hsl(var(--foreground))',
                }}
              >
                <span style={{ color: 'hsl(var(--primary))', flexShrink: 0 }}>{template.icon}</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>{template.titleEl}</div>
                  <div style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>{template.description}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
