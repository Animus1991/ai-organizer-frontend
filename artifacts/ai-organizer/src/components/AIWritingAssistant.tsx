/**
 * AIWritingAssistant - Paraphrasing, summaries, and writing help
 * Provides AI-powered writing assistance for research documents
 */

import React, { useState, createContext, useContext, useCallback, useRef } from "react";

// Types
export interface WritingTask {
  id: string;
  type: "paraphrase" | "summarize" | "expand" | "simplify" | "formalize" | "translate";
  input: string;
  output?: string;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
  timestamp: Date;
}

export interface WritingSettings {
  tone: "academic" | "casual" | "professional" | "simple";
  length: "shorter" | "same" | "longer";
  language: string;
}

// Context type
interface AIWritingContextType {
  tasks: WritingTask[];
  isProcessing: boolean;
  settings: WritingSettings;
  paraphrase: (text: string) => Promise<string>;
  summarize: (text: string, maxLength?: number) => Promise<string>;
  expand: (text: string) => Promise<string>;
  simplify: (text: string) => Promise<string>;
  formalize: (text: string) => Promise<string>;
  translate: (text: string, targetLang: string) => Promise<string>;
  updateSettings: (settings: Partial<WritingSettings>) => void;
  clearHistory: () => void;
}

const AIWritingContext = createContext<AIWritingContextType | null>(null);

// Generate ID
const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Simulated AI processing (in production, replace with actual API calls)
const simulateAIProcessing = async (
  type: WritingTask["type"],
  input: string,
  settings: WritingSettings
): Promise<string> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1500));

  // Simple transformations for demo (replace with actual AI API)
  const sentences = input.split(/[.!?]+/).filter((s) => s.trim());

  switch (type) {
    case "paraphrase": {
      // Simple word substitution demo
      const synonyms: Record<string, string[]> = {
        important: ["significant", "crucial", "essential", "vital"],
        show: ["demonstrate", "indicate", "reveal", "illustrate"],
        use: ["utilize", "employ", "apply", "leverage"],
        make: ["create", "produce", "generate", "develop"],
        good: ["effective", "beneficial", "advantageous", "favorable"],
        bad: ["detrimental", "adverse", "unfavorable", "negative"],
        big: ["substantial", "considerable", "significant", "extensive"],
        small: ["minimal", "minor", "limited", "modest"],
      };
      let result = input;
      Object.entries(synonyms).forEach(([word, syns]) => {
        const regex = new RegExp(`\\b${word}\\b`, "gi");
        result = result.replace(regex, syns[Math.floor(Math.random() * syns.length)]);
      });
      return result;
    }

    case "summarize": {
      // Take key sentences
      if (sentences.length <= 2) return input;
      const keyCount = Math.max(1, Math.ceil(sentences.length * 0.3));
      return sentences.slice(0, keyCount).join(". ") + ".";
    }

    case "expand": {
      // Add elaboration markers
      return sentences
        .map((s) => {
          const trimmed = s.trim();
          if (!trimmed) return "";
          return `${trimmed}. Furthermore, this point is worth emphasizing`;
        })
        .join(". ") + ".";
    }

    case "simplify": {
      // Remove complex words (demo)
      return input
        .replace(/\b(utilize|leverage)\b/gi, "use")
        .replace(/\b(demonstrate|illustrate)\b/gi, "show")
        .replace(/\b(substantial|considerable)\b/gi, "large")
        .replace(/\b(commence|initiate)\b/gi, "start")
        .replace(/\b(terminate|conclude)\b/gi, "end");
    }

    case "formalize": {
      // Make more formal
      return input
        .replace(/\b(can't)\b/gi, "cannot")
        .replace(/\b(won't)\b/gi, "will not")
        .replace(/\b(don't)\b/gi, "do not")
        .replace(/\b(isn't)\b/gi, "is not")
        .replace(/\b(I think)\b/gi, "It is believed")
        .replace(/\b(you)\b/gi, "one")
        .replace(/\b(a lot of)\b/gi, "numerous")
        .replace(/\b(get)\b/gi, "obtain");
    }

    case "translate": {
      // Demo: add language prefix
      return `[${settings.language}] ${input}`;
    }

    default:
      return input;
  }
};

// Provider
interface AIWritingProviderProps {
  children: React.ReactNode;
}

export const AIWritingProvider: React.FC<AIWritingProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<WritingTask[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<WritingSettings>({
    tone: "academic",
    length: "same",
    language: "en",
  });

  const processTask = useCallback(
    async (type: WritingTask["type"], input: string): Promise<string> => {
      const taskId = generateId();
      const task: WritingTask = {
        id: taskId,
        type,
        input,
        status: "pending",
        timestamp: new Date(),
      };

      setTasks((prev) => [...prev, task]);
      setIsProcessing(true);

      try {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: "processing" } : t))
        );

        const output = await simulateAIProcessing(type, input, settings);

        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: "completed", output } : t))
        );

        return output;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Processing failed";
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: "error", error: errorMessage } : t
          )
        );
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [settings]
  );

  const paraphrase = useCallback(
    (text: string) => processTask("paraphrase", text),
    [processTask]
  );

  const summarize = useCallback(
    (text: string) => processTask("summarize", text),
    [processTask]
  );

  const expand = useCallback(
    (text: string) => processTask("expand", text),
    [processTask]
  );

  const simplify = useCallback(
    (text: string) => processTask("simplify", text),
    [processTask]
  );

  const formalize = useCallback(
    (text: string) => processTask("formalize", text),
    [processTask]
  );

  const translate = useCallback(
    (text: string, targetLang: string) => {
      setSettings((s) => ({ ...s, language: targetLang }));
      return processTask("translate", text);
    },
    [processTask]
  );

  const updateSettings = useCallback((newSettings: Partial<WritingSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const clearHistory = useCallback(() => {
    setTasks([]);
  }, []);

  return (
    <AIWritingContext.Provider
      value={{
        tasks,
        isProcessing,
        settings,
        paraphrase,
        summarize,
        expand,
        simplify,
        formalize,
        translate,
        updateSettings,
        clearHistory,
      }}
    >
      {children}
    </AIWritingContext.Provider>
  );
};

// Hook
export const useAIWriting = () => {
  const context = useContext(AIWritingContext);
  if (!context) {
    throw new Error("useAIWriting must be used within AIWritingProvider");
  }
  return context;
};

// Writing toolbar component
interface WritingToolbarProps {
  selectedText: string;
  onResult?: (result: string) => void;
  style?: React.CSSProperties;
}

export const WritingToolbar: React.FC<WritingToolbarProps> = ({
  selectedText,
  onResult,
  style,
}) => {
  const { paraphrase, summarize, simplify, formalize, isProcessing } = useAIWriting();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleAction = async (action: () => Promise<string>) => {
    setError("");
    setResult("");
    try {
      const output = await action();
      setResult(output);
      onResult?.(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process");
    }
  };

  const tools = [
    { icon: "🔄", label: "Paraphrase", action: () => paraphrase(selectedText) },
    { icon: "📝", label: "Summarize", action: () => summarize(selectedText) },
    { icon: "✨", label: "Simplify", action: () => simplify(selectedText) },
    { icon: "📜", label: "Formalize", action: () => formalize(selectedText) },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "12px",
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {tools.map((tool) => (
          <button
            key={tool.label}
            onClick={() => handleAction(tool.action)}
            disabled={isProcessing || !selectedText}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: isProcessing
                ? "rgba(255, 255, 255, 0.05)"
                : "rgba(99, 102, 241, 0.1)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "6px",
              color: isProcessing ? "#71717a" : "#a5b4fc",
              fontSize: "13px",
              cursor: isProcessing || !selectedText ? "not-allowed" : "pointer",
              opacity: isProcessing || !selectedText ? 0.6 : 1,
            }}
          >
            <span>{tool.icon}</span>
            {tool.label}
          </button>
        ))}
      </div>

      {isProcessing && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "rgba(99, 102, 241, 0.1)",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              border: "2px solid #6366f1",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <span style={{ fontSize: "13px", color: "#a5b4fc" }}>Processing...</span>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: "12px",
            padding: "12px",
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#71717a",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}
          >
            Result
          </div>
          <div style={{ fontSize: "13px", color: "#eaeaea", lineHeight: 1.6 }}>{result}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result);
            }}
            style={{
              marginTop: "8px",
              padding: "6px 12px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              color: "#a5b4fc",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            📋 Copy
          </button>
        </div>
      )}
    </div>
  );
};

// Full writing assistant panel
interface WritingAssistantPanelProps {
  style?: React.CSSProperties;
  onClose?: () => void;
}

export const WritingAssistantPanel: React.FC<WritingAssistantPanelProps> = ({
  style,
  onClose,
}) => {
  const {
    tasks,
    isProcessing,
    settings,
    paraphrase,
    summarize,
    expand,
    simplify,
    formalize,
    updateSettings,
    clearHistory,
  } = useAIWriting();

  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [activeAction, setActiveAction] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAction = async (
    action: string,
    processor: (text: string) => Promise<string>
  ) => {
    if (!inputText.trim()) return;
    setActiveAction(action);
    setOutputText("");
    try {
      const result = await processor(inputText);
      setOutputText(result);
    } catch {
      setOutputText("Error processing text. Please try again.");
    }
    setActiveAction("");
  };

  const actions = [
    {
      id: "paraphrase",
      icon: "🔄",
      label: "Paraphrase",
      desc: "Rewrite with different words",
      fn: paraphrase,
    },
    {
      id: "summarize",
      icon: "📝",
      label: "Summarize",
      desc: "Create a concise summary",
      fn: summarize,
    },
    {
      id: "expand",
      icon: "📖",
      label: "Expand",
      desc: "Add more detail",
      fn: expand,
    },
    {
      id: "simplify",
      icon: "✨",
      label: "Simplify",
      desc: "Use simpler language",
      fn: simplify,
    },
    {
      id: "formalize",
      icon: "📜",
      label: "Formalize",
      desc: "Make more academic",
      fn: formalize,
    },
  ];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "16px",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🤖</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#eaeaea" }}>
              AI Writing Assistant
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#71717a" }}>
              Improve your research writing
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {tasks.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: "6px 12px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
                color: "#71717a",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Clear History
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                color: "#71717a",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Settings */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#71717a" }}>Tone:</span>
          <select
            value={settings.tone}
            onChange={(e) => updateSettings({ tone: e.target.value as WritingSettings["tone"] })}
            style={{
              padding: "4px 8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              color: "#eaeaea",
              fontSize: "12px",
            }}
          >
            <option value="academic">Academic</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="simple">Simple</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: "#71717a" }}>Length:</span>
          <select
            value={settings.length}
            onChange={(e) =>
              updateSettings({ length: e.target.value as WritingSettings["length"] })
            }
            style={{
              padding: "4px 8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "4px",
              color: "#eaeaea",
              fontSize: "12px",
            }}
          >
            <option value="shorter">Shorter</option>
            <option value="same">Same</option>
            <option value="longer">Longer</option>
          </select>
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: "20px" }}>
        {/* Input */}
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "8px",
            }}
          >
            Input Text
          </label>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste or type your text here..."
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#eaeaea",
              fontSize: "14px",
              lineHeight: 1.6,
              resize: "vertical",
            }}
          />
          <div
            style={{
              marginTop: "6px",
              fontSize: "11px",
              color: "#52525b",
              textAlign: "right",
            }}
          >
            {inputText.length} characters
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "8px",
            marginBottom: "16px",
          }}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id, action.fn)}
              disabled={isProcessing || !inputText.trim()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "12px",
                background:
                  activeAction === action.id
                    ? "rgba(99, 102, 241, 0.2)"
                    : "rgba(255, 255, 255, 0.03)",
                border:
                  activeAction === action.id
                    ? "1px solid rgba(99, 102, 241, 0.4)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "8px",
                color: activeAction === action.id ? "#a5b4fc" : "#eaeaea",
                cursor: isProcessing || !inputText.trim() ? "not-allowed" : "pointer",
                opacity: isProcessing && activeAction !== action.id ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "20px" }}>{action.icon}</span>
              <span style={{ fontSize: "12px", fontWeight: 500 }}>{action.label}</span>
              <span style={{ fontSize: "10px", color: "#71717a" }}>{action.desc}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {isProcessing && (
          <div
            style={{
              padding: "16px",
              background: "rgba(99, 102, 241, 0.1)",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #6366f1",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <span style={{ color: "#a5b4fc", fontSize: "14px" }}>
              AI is processing your text...
            </span>
          </div>
        )}

        {/* Output */}
        {outputText && (
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: 500,
                color: "#a1a1aa",
                marginBottom: "8px",
              }}
            >
              Output
            </label>
            <div
              style={{
                padding: "12px",
                background: "rgba(34, 197, 94, 0.05)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#eaeaea",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {outputText}
            </div>
            <div
              style={{
                marginTop: "12px",
                display: "flex",
                gap: "8px",
              }}
            >
              <button
                onClick={() => navigator.clipboard.writeText(outputText)}
                style={{
                  padding: "8px 16px",
                  background: "rgba(99, 102, 241, 0.15)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "6px",
                  color: "#a5b4fc",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                📋 Copy Result
              </button>
              <button
                onClick={() => setInputText(outputText)}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "6px",
                  color: "#a1a1aa",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                🔄 Use as Input
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent tasks */}
      {tasks.length > 0 && (
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#71717a",
              marginBottom: "12px",
            }}
          >
            Recent ({tasks.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
            {tasks
              .slice(-5)
              .reverse()
              .map((task) => (
                <div
                  key={task.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    background: "rgba(255, 255, 255, 0.02)",
                    borderRadius: "6px",
                  }}
                >
                  <span style={{ fontSize: "14px" }}>
                    {task.type === "paraphrase" && "🔄"}
                    {task.type === "summarize" && "📝"}
                    {task.type === "expand" && "📖"}
                    {task.type === "simplify" && "✨"}
                    {task.type === "formalize" && "📜"}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#eaeaea",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.input.substring(0, 50)}...
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background:
                        task.status === "completed"
                          ? "rgba(34, 197, 94, 0.15)"
                          : task.status === "error"
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(99, 102, 241, 0.15)",
                      color:
                        task.status === "completed"
                          ? "#22c55e"
                          : task.status === "error"
                          ? "#ef4444"
                          : "#6366f1",
                    }}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Global styles */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

// Quick action button (floating)
export const WritingAssistantButton: React.FC<{
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ onClick, style }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "48px",
      height: "48px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
      border: "none",
      boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
      cursor: "pointer",
      fontSize: "24px",
      ...style,
    }}
    title="AI Writing Assistant"
  >
    🤖
  </button>
);

export default AIWritingProvider;
