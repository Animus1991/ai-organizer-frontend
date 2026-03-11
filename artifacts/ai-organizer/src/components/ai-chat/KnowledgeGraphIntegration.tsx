/**
 * KnowledgeGraphIntegration - Link AI response entities to project knowledge graph
 * Auto-detects entities (concepts, methods, tools, people) and creates linkable nodes
 */
import React, { useMemo, useState, useCallback } from 'react';
import { Network, Plus, X, Link, Unlink, Eye, Sparkles } from 'lucide-react';

// Types
export type EntityType = 'concept' | 'method' | 'tool' | 'person' | 'dataset' | 'metric' | 'model';

export interface KnowledgeEntity {
  id: string;
  text: string;
  type: EntityType;
  confidence: number;
  messageId: string;
  linked: boolean;      // Whether linked to project KG
  linkedNodeId?: string; // ID in the project knowledge graph
  occurrences: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: EntityType;
  description?: string;
  connections: string[];
  createdFrom: 'ai-chat' | 'manual' | 'import';
  createdAt: Date;
}

// Entity extraction patterns
const ENTITY_PATTERNS: { type: EntityType; patterns: RegExp[] }[] = [
  {
    type: 'method',
    patterns: [
      /\b(gradient descent|backpropagation|cross[-\s]validation|k[-\s]fold|bootstrap|monte carlo|bayesian|regression|classification|clustering|PCA|t-SNE|UMAP|attention mechanism|self[-\s]attention|fine[-\s]tuning|transfer learning|data augmentation|dropout|batch normalization|regularization)\b/gi,
    ],
  },
  {
    type: 'model',
    patterns: [
      /\b(BERT|GPT[-\s]?\d*|T5|RoBERTa|XLNet|ALBERT|DistilBERT|ELECTRA|DeBERTa|Llama[-\s]?\d*|Claude|Gemini|ResNet|VGG|Inception|YOLO|Transformer|LSTM|GRU|CNN|RNN|GAN|VAE|Diffusion|Stable Diffusion|DALL[-\s]?E|Midjourney)\b/gi,
    ],
  },
  {
    type: 'tool',
    patterns: [
      /\b(Python|PyTorch|TensorFlow|Keras|scikit[-\s]learn|pandas|NumPy|SciPy|Matplotlib|Jupyter|Hugging\s?Face|Docker|Kubernetes|MLflow|Weights\s?&\s?Biases|Ray|Spark|CUDA|JAX|Flax)\b/gi,
    ],
  },
  {
    type: 'metric',
    patterns: [
      /\b(accuracy|precision|recall|F1[-\s]?score|AUC[-\s]?ROC|BLEU|ROUGE|perplexity|loss|MSE|MAE|RMSE|R[-\s]?squared|p[-\s]?value|confidence interval|effect size|Cohen['']?s\s?d|chi[-\s]?square)\b/gi,
    ],
  },
  {
    type: 'dataset',
    patterns: [
      /\b(MNIST|CIFAR[-\s]?\d+|ImageNet|COCO|SQuAD|GLUE|SuperGLUE|WikiText|Common\s?Crawl|OpenWebText|The\s?Pile|LAION|MS[-\s]?MARCO)\b/gi,
    ],
  },
  {
    type: 'concept',
    patterns: [
      /\b(machine learning|deep learning|natural language processing|NLP|computer vision|reinforcement learning|supervised learning|unsupervised learning|semi[-\s]supervised|few[-\s]shot|zero[-\s]shot|meta[-\s]learning|continual learning|federated learning|neural network|embedding|tokenization|attention|transformer|generative AI|large language model|LLM|AGI|multimodal)\b/gi,
    ],
  },
];

/**
 * Extract entities from text
 */
export function extractEntities(content: string, messageId: string): KnowledgeEntity[] {
  const entities: KnowledgeEntity[] = [];
  const seen = new Map<string, KnowledgeEntity>();

  ENTITY_PATTERNS.forEach(({ type, patterns }) => {
    patterns.forEach(pattern => {
      let match;
      // Reset regex state
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1] || match[0];
        const normalized = text.toLowerCase().replace(/[-\s]+/g, ' ').trim();
        
        if (seen.has(normalized)) {
          seen.get(normalized)!.occurrences++;
        } else {
          const entity: KnowledgeEntity = {
            id: `entity-${type}-${normalized.replace(/\s+/g, '-')}`,
            text: text.trim(),
            type,
            confidence: 0.85,
            messageId,
            linked: false,
            occurrences: 1,
          };
          seen.set(normalized, entity);
          entities.push(entity);
        }
      }
    });
  });

  return entities.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Extract entities from multiple messages
 */
export function extractAllEntities(messages: Array<{ id: string; content: string }>): KnowledgeEntity[] {
  const allEntities = new Map<string, KnowledgeEntity>();

  messages.forEach(msg => {
    const entities = extractEntities(msg.content, msg.id);
    entities.forEach(e => {
      const key = e.id;
      if (allEntities.has(key)) {
        allEntities.get(key)!.occurrences += e.occurrences;
      } else {
        allEntities.set(key, { ...e });
      }
    });
  });

  return Array.from(allEntities.values()).sort((a, b) => b.occurrences - a.occurrences);
}

// UI Components

const TYPE_CONFIG: Record<EntityType, { icon: string; color: string; label: string }> = {
  concept: { icon: '💡', color: '262 83% 58%', label: 'Concept' },
  method: { icon: '⚗️', color: '142 71% 45%', label: 'Method' },
  tool: { icon: '🔧', color: '200 80% 50%', label: 'Tool' },
  person: { icon: '👤', color: '38 92% 50%', label: 'Person' },
  dataset: { icon: '📊', color: '0 84% 60%', label: 'Dataset' },
  metric: { icon: '📏', color: '280 70% 55%', label: 'Metric' },
  model: { icon: '🤖', color: '180 60% 45%', label: 'Model' },
};

interface KnowledgeGraphPanelProps {
  entities: KnowledgeEntity[];
  onLinkEntity: (entityId: string) => void;
  onUnlinkEntity: (entityId: string) => void;
  onClose: () => void;
}

export function KnowledgeGraphPanel({ entities, onLinkEntity, onUnlinkEntity, onClose }: KnowledgeGraphPanelProps) {
  const [filter, setFilter] = useState<EntityType | 'all'>('all');
  const [showLinkedOnly, setShowLinkedOnly] = useState(false);

  const filteredEntities = useMemo(() => {
    return entities.filter(e => {
      if (filter !== 'all' && e.type !== filter) return false;
      if (showLinkedOnly && !e.linked) return false;
      return true;
    });
  }, [entities, filter, showLinkedOnly]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entities.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [entities]);

  if (entities.length === 0) {
    return (
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid hsl(var(--border))',
        background: 'hsl(var(--muted) / 0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
            🔗 No knowledge entities detected
          </span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'hsl(var(--muted-foreground))', padding: '2px',
          }}>
            <X size={12} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      borderTop: '1px solid hsl(var(--border))',
      background: 'hsl(var(--card))',
      maxHeight: '240px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '6px 12px',
        borderBottom: '1px solid hsl(var(--border) / 0.5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Network size={12} style={{ color: 'hsl(var(--primary))' }} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--foreground))' }}>
            Knowledge Graph ({entities.length} entities)
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'hsl(var(--muted-foreground))', padding: '2px',
        }}>
          <X size={12} />
        </button>
      </div>

      {/* Filters */}
      <div style={{
        padding: '4px 8px',
        display: 'flex',
        gap: '3px',
        overflowX: 'auto',
        borderBottom: '1px solid hsl(var(--border) / 0.3)',
      }}>
        <FilterChip
          active={filter === 'all'}
          onClick={() => setFilter('all')}
          label={`All (${entities.length})`}
        />
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const count = typeCounts[type] || 0;
          if (count === 0) return null;
          return (
            <FilterChip
              key={type}
              active={filter === type}
              onClick={() => setFilter(type as EntityType)}
              label={`${config.icon} ${count}`}
              color={config.color}
            />
          );
        })}
      </div>

      {/* Entity list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        {filteredEntities.map(entity => {
          const config = TYPE_CONFIG[entity.type];
          return (
            <div key={entity.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 6px',
              borderRadius: '4px',
              marginBottom: '2px',
            }}>
              <span style={{
                fontSize: '9px',
                padding: '1px 4px',
                borderRadius: '3px',
                background: `hsl(${config.color} / 0.1)`,
                color: `hsl(${config.color})`,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {config.icon}
              </span>
              <span style={{
                flex: 1,
                fontSize: '11px',
                color: 'hsl(var(--foreground))',
                fontWeight: entity.occurrences > 1 ? 600 : 400,
              }}>
                {entity.text}
              </span>
              {entity.occurrences > 1 && (
                <span style={{
                  fontSize: '9px',
                  color: 'hsl(var(--muted-foreground))',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  ×{entity.occurrences}
                </span>
              )}
              <button
                onClick={() => entity.linked ? onUnlinkEntity(entity.id) : onLinkEntity(entity.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: entity.linked ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}
                title={entity.linked ? 'Unlink from KG' : 'Link to KG'}
              >
                {entity.linked ? <Link size={11} /> : <Plus size={11} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, color }: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 6px',
        borderRadius: '8px',
        border: 'none',
        background: active ? `hsl(${color || 'var(--primary)'} / 0.15)` : 'transparent',
        color: active ? `hsl(${color || 'var(--primary)'})` : 'hsl(var(--muted-foreground))',
        fontSize: '9px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

/**
 * Inline entity highlight for message content
 */
export function EntityHighlight({ entity }: { entity: KnowledgeEntity }) {
  const config = TYPE_CONFIG[entity.type];
  return (
    <span
      style={{
        borderBottom: `1px dashed hsl(${config.color} / 0.5)`,
        cursor: 'pointer',
      }}
      title={`${config.label}: ${entity.text}`}
    >
      {entity.text}
    </span>
  );
}
