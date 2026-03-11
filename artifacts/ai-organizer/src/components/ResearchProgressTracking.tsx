import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DocumentDTO } from '../lib/api';

interface ResearchTask {
  id: string;
  title: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  category: 'analysis' | 'writing' | 'review' | 'data-collection' | 'planning';
  assignee?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress: number; // 0-100
  dependencies: string[]; // task IDs
  tags: string[];
  documentId?: number;
  metadata?: {
    analysisType?: string;
    reviewMethod?: string;
    dataSources?: string[];
    deliverables?: string[];
  };
}

interface ResearchProject {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  startDate: Date;
  targetDate?: Date;
  completedAt?: Date;
  tasks: ResearchTask[];
  milestones: ResearchMilestone[];
  documents: number[];
  team: string[];
  progress: number; // 0-100
  budget?: number;
  actualCost?: number;
  metadata?: {
    researchArea?: string;
    methodology?: string;
    objectives?: string[];
  };
}

interface ResearchMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completedAt?: Date;
  status: 'pending' | 'completed' | 'overdue';
  tasks: string[]; // task IDs
  importance: 'low' | 'medium' | 'high';
}

interface ResearchProgressTrackingProps {
  documentId?: number;
  projectId?: string;
  showCompleted?: boolean;
  compact?: boolean;
  documents?: DocumentDTO[];
}

export default function ResearchProgressTracking({ 
  documentId,
  showCompleted = true,
  compact = false,
  documents
}: ResearchProgressTrackingProps) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { isDark } = useTheme();
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const surfaceBg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
  const surfaceBgSubtle = isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff';
  const surfaceBorder = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.12)';
  const controlBorder = isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)';
  const textPrimary = isDark ? 'white' : '#000000';
  const textSecondary = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.62)';
  const textMuted = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  const progressRemainderBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  // Sample localization removed: progress data is derived from real documents.

  // Load progress data from documents or localStorage
  useEffect(() => {
    const loadProgressData = () => {
      setLoading(true);

      if (documents && documents.length > 0) {
        const tasksFromDocs: ResearchTask[] = [];
        const projectsFromDocs: ResearchProject[] = documents.map((doc) => {
          const parseStatus = doc.parseStatus || 'pending';
          const taskStatus =
            parseStatus === 'ok' ? 'completed' : parseStatus === 'pending' ? 'in-progress' : 'blocked';
          const progress = parseStatus === 'ok' ? 100 : parseStatus === 'pending' ? 50 : 20;
          const task: ResearchTask = {
            id: `task-parse-${doc.id}`,
            title: t('progress.task.parseTitle') || 'Parse & Index Document',
            description: t('progress.task.parseDescription') || 'Ensure document is parsed and ready for segmentation.',
            status: taskStatus,
            priority: 'high',
            category: 'analysis',
            createdAt: new Date(),
            updatedAt: new Date(),
            progress,
            dependencies: [],
            tags: ['ingestion'],
            documentId: doc.id,
          };
          tasksFromDocs.push(task);

          return {
            id: `project-${doc.id}`,
            title: doc.title || doc.filename || `Document ${doc.id}`,
            description: t('progress.project.documentTracking') || 'Track progress for this document.',
            status: parseStatus === 'ok' ? 'active' : parseStatus === 'pending' ? 'planning' : 'on-hold',
            startDate: new Date(),
            targetDate: undefined,
            tasks: [task],
            milestones: [],
            documents: [doc.id],
            team: [],
            progress,
          };
        });

        setProjects(projectsFromDocs);
        setTasks(tasksFromDocs);
        setLoading(false);
        return;
      }

      const storedProjects = localStorage.getItem('researchProjects');
      const storedTasks = localStorage.getItem('researchTasks');

      let allProjects: ResearchProject[] = [];
      let allTasks: ResearchTask[] = [];

      if (storedProjects && storedTasks) {
        allProjects = JSON.parse(storedProjects).map((p: any) => ({
          ...p,
          startDate: new Date(p.startDate),
          targetDate: p.targetDate ? new Date(p.targetDate) : undefined,
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
          tasks: p.tasks.map((t: any) => ({
            ...t,
            dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt),
            completedAt: t.completedAt ? new Date(t.completedAt) : undefined
          })),
          milestones: p.milestones.map((m: any) => ({
            ...m,
            dueDate: new Date(m.dueDate),
            completedAt: m.completedAt ? new Date(m.completedAt) : undefined
          }))
        }));

        allTasks = JSON.parse(storedTasks).map((t: any) => ({
          ...t,
          dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
          completedAt: t.completedAt ? new Date(t.completedAt) : undefined
        }));
      }

      setProjects(allProjects);
      setTasks(allTasks);
      setLoading(false);
    };
    
    loadProgressData();
  }, [documents, t]);

  // Generate sample progress data
  const generateSampleData = (): { projects: ResearchProject[], tasks: ResearchTask[] } => {
    const sampleTasks: ResearchTask[] = [
      {
        id: 'task-1',
        title: t('sample.task.literatureReview.title'),
        description: t('sample.task.literatureReview.description'),
        status: 'completed',
        priority: 'high',
        category: 'review',
        assignee: 'Dr. Smith',
        dueDate: new Date('2024-01-15'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-14'),
        completedAt: new Date('2024-01-14'),
        estimatedHours: 40,
        actualHours: 35,
        progress: 100,
        dependencies: [],
        tags: ['literature', 'review', 'academic'],
        documentId: 1,
        metadata: {
          reviewMethod: 'systematic',
          dataSources: ['PubMed', 'Google Scholar', 'IEEE Xplore']
        }
      },
      {
        id: 'task-2',
        title: t('sample.task.dataCollection.title'),
        description: t('sample.task.dataCollection.description'),
        status: 'in-progress',
        priority: 'high',
        category: 'data-collection',
        assignee: 'Jane Doe',
        dueDate: new Date('2024-02-01'),
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-20'),
        estimatedHours: 60,
        actualHours: 25,
        progress: 45,
        dependencies: ['task-1'],
        tags: ['data', 'collection', 'preprocessing'],
        documentId: 2
      },
      {
        id: 'task-3',
        title: t('sample.task.statisticalAnalysis.title'),
        description: t('sample.task.statisticalAnalysis.description'),
        status: 'not-started',
        priority: 'high',
        category: 'analysis',
        assignee: 'Dr. Johnson',
        dueDate: new Date('2024-02-15'),
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        estimatedHours: 30,
        progress: 0,
        dependencies: ['task-2'],
        tags: ['statistics', 'analysis', 'research'],
        documentId: 3,
        metadata: {
          analysisType: 'regression',
          deliverables: ['statistical report', 'visualizations']
        }
      },
      {
        id: 'task-4',
        title: t('sample.task.writeIntroduction.title'),
        description: t('sample.task.writeIntroduction.description'),
        status: 'in-progress',
        priority: 'medium',
        category: 'writing',
        assignee: 'Alice Brown',
        dueDate: new Date('2024-01-25'),
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-20'),
        estimatedHours: 20,
        actualHours: 12,
        progress: 60,
        dependencies: [],
        tags: ['writing', 'introduction', 'academic'],
        documentId: 1
      },
      {
        id: 'task-5',
        title: t('sample.task.methodologySection.title'),
        description: t('sample.task.methodologySection.description'),
        status: 'not-started',
        priority: 'high',
        category: 'writing',
        assignee: 'Bob Wilson',
        dueDate: new Date('2024-02-10'),
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        estimatedHours: 25,
        progress: 0,
        dependencies: ['task-2'],
        tags: ['writing', 'methodology', 'research'],
        documentId: 2
      },
      {
        id: 'task-6',
        title: t('sample.task.peerReview.title'),
        description: t('sample.task.peerReview.description'),
        status: 'blocked',
        priority: 'medium',
        category: 'review',
        assignee: 'Dr. Davis',
        dueDate: new Date('2024-02-20'),
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
        estimatedHours: 15,
        progress: 0,
        dependencies: ['task-3', 'task-4', 'task-5'],
        tags: ['review', 'peer-review', 'quality'],
        documentId: 3
      }
    ];

    const sampleProjects: ResearchProject[] = [
      {
        id: 'project-1',
        title: t('sample.project.aiResearchStudy.title'),
        description: t('sample.project.aiResearchStudy.description'),
        status: 'active',
        startDate: new Date('2024-01-01'),
        targetDate: new Date('2024-03-31'),
        tasks: sampleTasks.filter(t => ['task-1', 'task-2', 'task-3', 'task-6'].includes(t.id)),
        milestones: [
          {
            id: 'milestone-1',
            title: t('sample.milestone.literatureReviewComplete.title'),
            description: t('sample.milestone.literatureReviewComplete.description'),
            dueDate: new Date('2024-01-15'),
            completedAt: new Date('2024-01-14'),
            status: 'completed',
            tasks: ['task-1'],
            importance: 'high'
          },
          {
            id: 'milestone-2',
            title: t('sample.milestone.dataCollectionComplete.title'),
            description: t('sample.milestone.dataCollectionComplete.description'),
            dueDate: new Date('2024-02-01'),
            status: 'pending',
            tasks: ['task-2'],
            importance: 'high'
          }
        ],
        documents: [1, 2, 3],
        team: ['Dr. Smith', 'Jane Doe', 'Dr. Johnson'],
        progress: 35,
        budget: 50000,
        actualCost: 15000,
        metadata: {
          researchArea: 'AI in Healthcare',
          methodology: 'Mixed Methods',
          objectives: ['Analyze AI applications', 'Identify opportunities', 'Propose solutions']
        }
      },
      {
        id: 'project-2',
        title: t('sample.project.machineLearningPaper.title'),
        description: t('sample.project.machineLearningPaper.description'),
        status: 'planning',
        startDate: new Date('2024-02-01'),
        targetDate: new Date('2024-05-31'),
        tasks: sampleTasks.filter(t => ['task-4', 'task-5'].includes(t.id)),
        milestones: [
          {
            id: 'milestone-3',
            title: t('sample.milestone.firstDraftComplete.title'),
            description: t('sample.milestone.firstDraftComplete.description'),
            dueDate: new Date('2024-03-15'),
            status: 'pending',
            tasks: ['task-4', 'task-5'],
            importance: 'high'
          }
        ],
        documents: [1, 2],
        team: ['Alice Brown', 'Bob Wilson'],
        progress: 15,
        budget: 25000,
        actualCost: 5000,
        metadata: {
          researchArea: 'Machine Learning',
          methodology: 'Experimental',
          objectives: ['Develop algorithm', 'Validate performance', 'Publish results']
        }
      }
    ];

    return { projects: sampleProjects, tasks: sampleTasks };
  };

  void generateSampleData;

  // Filter tasks based on selections
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by project
    if (selectedProject !== 'all') {
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        filtered = filtered.filter(task => project.tasks.some(pt => pt.id === task.id));
      }
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(task => task.category === selectedCategory);
    }

    // Filter by document if specified
    if (documentId) {
      filtered = filtered.filter(task => task.documentId === documentId);
    }

    // Filter out completed if not showing
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }

    return filtered.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      // Finally by updated date
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [tasks, selectedProject, selectedStatus, selectedCategory, documentId, showCompleted, projects]);

  // Get statistics
  const statistics = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in-progress').length;
    const blockedTasks = filteredTasks.filter(t => t.status === 'blocked').length;
    const overdueTasks = filteredTasks.filter(t => 
      t.dueDate && t.dueDate < new Date() && t.status !== 'completed'
    ).length;

    const totalEstimatedHours = filteredTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = filteredTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    const averageProgress = filteredTasks.length > 0 
      ? Math.round(filteredTasks.reduce((sum, t) => sum + t.progress, 0) / filteredTasks.length)
      : 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasks,
      totalEstimatedHours,
      totalActualHours,
      averageProgress,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [filteredTasks]);

  function getStatusColor(status: string): string {
    const colors = {
      'not-started': '#6b7280',
      'in-progress': '#3b82f6',
      'completed': '#10b981',
      'blocked': '#ef4444',
      'cancelled': '#6b7280',
      'planning': '#8b5cf6',
      'active': '#10b981',
      'on-hold': '#f59e0b'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }

  function getPriorityColor(priority: string): string {
    const colors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#f97316'
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  }

  void getPriorityColor;

  function getCategoryIcon(category: string): string {
    const icons = {
      analysis: '🔬',
      writing: '✍️',
      review: '👀',
      'data-collection': '📊',
      planning: '📋'
    };
    return icons[category as keyof typeof icons] || '📌';
  }

  function getStatusIcon(status: string): string {
    const icons = {
      'not-started': '⭕',
      'in-progress': '🔄',
      'completed': '✅',
      'blocked': '🚫',
      'cancelled': '❌'
    };
    return icons[status as keyof typeof icons] || '⭕';
  }

  function getPriorityIcon(priority: string): string {
    const icons = {
      low: '🔹',
      medium: '🔸',
      high: '🔶'
    };
    return icons[priority as keyof typeof icons] || '🔹';
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'not-started': t('progress.status.notStarted') || 'Not Started',
      'in-progress': t('progress.status.inProgress') || 'In Progress',
      'completed': t('progress.status.completed') || 'Completed',
      'blocked': t('progress.status.blocked') || 'Blocked',
      'cancelled': t('progress.status.cancelled') || 'Cancelled'
    };
    return labels[status] || status.replace('-', ' ');
  }

  function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'analysis': t('progress.category.analysis') || 'Analysis',
      'writing': t('progress.category.writing') || 'Writing',
      'review': t('progress.category.review') || 'Review',
      'data-collection': t('progress.category.dataCollection') || 'Data Collection',
      'planning': t('progress.category.planning') || 'Planning'
    };
    return labels[category] || category;
  }

  if (loading) {
    return (
      <div style={{
        background: surfaceBg,
        borderRadius: '16px',
        border: surfaceBorder,
        padding: '40px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.3)',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <div style={{ color: textPrimary, fontSize: '13px' }}>{t("progress.loading")}</div>
      </div>
    );
  }

  return (
    <div className="research-progress-tracking" style={{
      background: surfaceBg,
      borderRadius: '16px',
      border: surfaceBorder,
      padding: compact ? '16px' : '20px',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <div>
          <h3 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: textPrimary,
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            🎯 {t("progress.title")}
          </h3>
          <p style={{
            fontSize: '13px',
            color: textSecondary,
            margin: 0,
          }}>
            {t("progress.subtitle")}
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <div style={{
            fontSize: '12px',
            color: textMuted,
            background: surfaceBg,
            border: surfaceBorder,
            padding: '4px 8px',
            borderRadius: '6px',
          }}>
            {filteredTasks.length} {t("progress.tasks")}
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '20px',
      }}>
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#34d399', marginBottom: '2px' }}>
            {statistics.completionRate}%
          </div>
          <div style={{ fontSize: '11px', color: textSecondary }}>
            {t("progress.completionRate")}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#60a5fa', marginBottom: '2px' }}>
            {statistics.inProgressTasks}
          </div>
          <div style={{ fontSize: '11px', color: textSecondary }}>
            {t("progress.inProgress")}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#f87171', marginBottom: '2px' }}>
            {statistics.blockedTasks}
          </div>
          <div style={{ fontSize: '11px', color: textSecondary }}>
            {t("progress.blocked")}
          </div>
        </div>
        
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '12px',
          padding: '12px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#fbbf24', marginBottom: '2px' }}>
            {statistics.overdueTasks}
          </div>
          <div style={{ fontSize: '11px', color: textSecondary }}>
            {t("progress.overdue")}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '6px 10px',
            border: controlBorder,
            borderRadius: '6px',
            background: surfaceBg,
            color: textPrimary,
            fontSize: '12px',
          }}
        >
          <option value="all">{t("progress.allProjects")}</option>
          {projects.map(project => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
        
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            padding: '6px 10px',
            border: controlBorder,
            borderRadius: '6px',
            background: surfaceBg,
            color: textPrimary,
            fontSize: '12px',
          }}
        >
          <option value="all">{t("progress.allStatus")}</option>
          <option value="not-started">{t("progress.status.notStarted")}</option>
          <option value="in-progress">{t("progress.status.inProgress")}</option>
          <option value="completed">{t("progress.status.completed")}</option>
          <option value="blocked">{t("progress.status.blocked")}</option>
        </select>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '6px 10px',
            border: controlBorder,
            borderRadius: '6px',
            background: surfaceBg,
            color: textPrimary,
            fontSize: '12px',
          }}
        >
          <option value="all">{t("progress.allCategories")}</option>
          <option value="analysis">{t("progress.category.analysis")}</option>
          <option value="writing">{t("progress.category.writing")}</option>
          <option value="review">{t("progress.category.review")}</option>
          <option value="data-collection">{t("progress.category.dataCollection")}</option>
          <option value="planning">{t("progress.category.planning")}</option>
        </select>
      </div>

      {/* Tasks List */}
      <div style={{
        background: surfaceBgSubtle,
        border: surfaceBorder,
        borderRadius: '12px',
        padding: '16px',
        maxHeight: compact ? '300px' : '400px',
        overflowY: 'auto',
      }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: textPrimary,
          margin: '0 0 12px 0',
        }}>
          {t("progress.tasksCount", { count: filteredTasks.length })}
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => task.documentId && nav(`/documents/${task.documentId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: surfaceBg,
                border: surfaceBorder,
                borderRadius: '8px',
                cursor: task.documentId ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (task.documentId) {
                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = surfaceBg;
                e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.12)';
              }}
            >
              {/* Status & Priority */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '14px' }}>
                  {getStatusIcon(task.status)}
                </div>
                <div style={{ fontSize: '12px' }}>
                  {getPriorityIcon(task.priority)}
                </div>
              </div>
              
              {/* Task Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: textPrimary,
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  {task.title}
                  <span style={{
                    fontSize: '10px',
                    background: getStatusColor(task.status),
                    color: 'white',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    fontWeight: '600',
                  }}>
                    {getStatusLabel(task.status)}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '11px',
                  color: textSecondary,
                  marginBottom: '4px',
                }}>
                  {task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description}
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: textMuted,
                }}>
                  <span>{getCategoryIcon(task.category)} {getCategoryLabel(task.category)}</span>
                  {task.assignee && <span>👤 {task.assignee}</span>}
                  {task.dueDate && <span>📅 {task.dueDate.toLocaleDateString()}</span>}
                </div>
              </div>
              
              {/* Progress */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                minWidth: '60px',
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `conic-gradient(${getStatusColor(task.status)} ${task.progress * 3.6}deg, ${progressRemainderBg} 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: textPrimary,
                }}>
                  {task.progress}%
                </div>
                <div style={{ fontSize: '9px', color: textMuted }}>
                  {t("progress.progress")}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredTasks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: textMuted,
          }}>
            <div style={{ fontSize: '13px', marginBottom: '8px' }}>
              📋 {t("progress.noTasks")}
            </div>
            <div style={{ fontSize: '12px' }}>
              {t("progress.noTasksHint")}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: '8px',
        fontSize: '11px',
        color: isDark ? '#a5b4fc' : '#000000',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          📊 {t("progress.footer.tasks", { total: statistics.totalTasks, completed: statistics.completedTasks })}
        </div>
        <div>
          ⏱️ {t("progress.footer.hours", { actual: statistics.totalActualHours, estimated: statistics.totalEstimatedHours })}
        </div>
      </div>
    </div>
  );
}
