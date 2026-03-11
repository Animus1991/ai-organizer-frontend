// ── Types ──────────────────────────────────────────────────────────────────────
export type CourseLevel    = 'beginner' | 'intermediate' | 'advanced';
export type CourseCategory = 'research' | 'writing' | 'data' | 'ai' | 'collaboration' | 'publishing';
export type ModuleType     = 'video' | 'reading' | 'quiz' | 'exercise';

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  type: ModuleType;
  description?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorAvatar: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  duration: string;
  modules: CourseModule[];
  tags: string[];
  rating: number;
  enrolled: number;
  thumbnail: string;
  featured?: boolean;
  whatYouLearn: string[];
}

// ── Display config maps ────────────────────────────────────────────────────────
export const CAT_CFG: Record<CourseCategory, { label: string; icon: string; color: string }> = {
  research:      { label: 'Research',      icon: '🔬', color: '#6366f1' },
  writing:       { label: 'Writing',       icon: '📝', color: '#8b5cf6' },
  data:          { label: 'Data & Stats',  icon: '📊', color: '#3b82f6' },
  ai:            { label: 'AI & Tools',    icon: '🤖', color: '#14b8a6' },
  collaboration: { label: 'Collaboration', icon: '🤝', color: '#22c55e' },
  publishing:    { label: 'Publishing',    icon: '📖', color: '#f59e0b' },
};

export const LVL_CFG: Record<CourseLevel, { label: string; color: string }> = {
  beginner:     { label: 'Beginner',     color: '#22c55e' },
  intermediate: { label: 'Intermediate', color: '#f59e0b' },
  advanced:     { label: 'Advanced',     color: '#ef4444' },
};

export const MOD_CFG: Record<ModuleType, { icon: string; color: string; label: string }> = {
  video:    { icon: '▶️', color: '#6366f1', label: 'Video'    },
  reading:  { icon: '📖', color: '#3b82f6', label: 'Reading'  },
  quiz:     { icon: '✅', color: '#22c55e', label: 'Quiz'     },
  exercise: { icon: '✏️', color: '#f59e0b', label: 'Exercise' },
};

// ── Sample courses ─────────────────────────────────────────────────────────────
export const COURSES: Course[] = [
  {
    id: 'c1', title: 'Academic Writing Mastery', instructor: 'Prof. Elena Vasquez', instructorAvatar: '👩‍🏫',
    description: 'Master the craft of academic writing — from structuring arguments to navigating peer review. Covers IMRaD format, citation styles, and publication strategy.',
    category: 'writing', level: 'intermediate', duration: '8h 30m', rating: 4.8, enrolled: 2341, thumbnail: '📝', featured: true,
    tags: ['Academic Writing', 'Peer Review', 'Publication', 'APA', 'MLA'],
    whatYouLearn: ['Structure IMRaD papers', 'Navigate peer review', 'Choose citation styles', 'Write compelling abstracts', 'Respond to reviewers'],
    modules: [
      { id: 'm1', title: 'Introduction to Academic Discourse',  duration: '45m',    type: 'video',    description: 'Norms and expectations in academic writing.' },
      { id: 'm2', title: 'Structuring Your Argument',           duration: '1h',     type: 'reading',  description: 'Logic, evidence chains, and paragraph-level cohesion.' },
      { id: 'm3', title: 'The IMRaD Format Deep Dive',          duration: '55m',    type: 'video',    description: 'Introduction, Methods, Results, Discussion — annotated examples.' },
      { id: 'm4', title: 'Citation Styles: APA, MLA, Chicago', duration: '40m',    type: 'video',    description: 'When and how to apply each style correctly.' },
      { id: 'm5', title: 'Exercise: Write an Abstract',        duration: '30m',    type: 'exercise', description: 'Write a 250-word abstract for a provided paper excerpt.' },
      { id: 'm6', title: 'Navigating Peer Review',             duration: '1h 10m', type: 'video',    description: 'How reviewers think and how to write for them.' },
      { id: 'm7', title: 'Responding to Reviewers',            duration: '45m',    type: 'reading',  description: 'Point-by-point response letters and revision strategy.' },
      { id: 'm8', title: 'Final Assessment',                   duration: '45m',    type: 'quiz',     description: '20-question quiz covering all module content.' },
    ],
  },
  {
    id: 'c2', title: 'Research Methods & Design', instructor: 'Dr. James Okafor', instructorAvatar: '👨‍🔬',
    description: 'Comprehensive guide to qualitative, quantitative, and mixed-methods research design. Hypothesis formulation, sampling, data collection, and validity.',
    category: 'research', level: 'beginner', duration: '12h', rating: 4.7, enrolled: 3890, thumbnail: '🔬', featured: true,
    tags: ['Research Design', 'Methodology', 'Statistics', 'Qualitative', 'Quantitative'],
    whatYouLearn: ['Design qualitative and quantitative studies', 'Formulate hypotheses', 'Select sampling strategies', 'Ensure validity and reliability', 'Collect and manage data'],
    modules: [
      { id: 'm1', title: 'Foundations of Scientific Inquiry', duration: '1h',     type: 'video'    },
      { id: 'm2', title: 'Qualitative Methods',              duration: '1h 30m', type: 'video'    },
      { id: 'm3', title: 'Quantitative Methods',             duration: '1h 30m', type: 'video'    },
      { id: 'm4', title: 'Mixed-Methods Approaches',         duration: '1h',     type: 'reading'  },
      { id: 'm5', title: 'Sampling Strategies',              duration: '45m',    type: 'video'    },
      { id: 'm6', title: 'Quiz: Research Design Basics',     duration: '30m',    type: 'quiz'     },
      { id: 'm7', title: 'Data Collection Instruments',      duration: '1h',     type: 'exercise' },
      { id: 'm8', title: 'Validity & Reliability',           duration: '50m',    type: 'video'    },
    ],
  },
  {
    id: 'c3', title: 'Data Analysis with Python', instructor: 'Dr. Aisha Patel', instructorAvatar: '👩‍💻',
    description: 'From raw data to publication-ready figures. Covers pandas, matplotlib, seaborn, and statistical testing for academic researchers.',
    category: 'data', level: 'intermediate', duration: '10h 15m', rating: 4.9, enrolled: 5102, thumbnail: '📊',
    tags: ['Python', 'Pandas', 'Statistics', 'Visualization', 'Data Science'],
    whatYouLearn: ['Wrangle data with pandas', 'Run statistical tests', 'Build publication-quality plots', 'Reproduce figures programmatically', 'Report analysis reproducibly'],
    modules: [
      { id: 'm1', title: 'Python for Researchers Setup',          duration: '30m',    type: 'exercise' },
      { id: 'm2', title: 'Data Wrangling with Pandas',            duration: '1h 30m', type: 'video'    },
      { id: 'm3', title: 'Statistical Testing',                   duration: '1h 20m', type: 'video'    },
      { id: 'm4', title: 'Visualization with Matplotlib/Seaborn', duration: '1h 15m', type: 'video'    },
      { id: 'm5', title: 'Exercise: Reproduce a Figure',          duration: '1h',     type: 'exercise' },
      { id: 'm6', title: 'Publication-Ready Plots',               duration: '45m',    type: 'video'    },
      { id: 'm7', title: 'Reporting Analysis Results',            duration: '40m',    type: 'reading'  },
    ],
  },
  {
    id: 'c4', title: 'AI Tools for Research', instructor: 'Prof. Wei Zhang', instructorAvatar: '🤖',
    description: 'Leverage large language models, semantic search, and AI writing assistants in your research workflow ethically and effectively.',
    category: 'ai', level: 'beginner', duration: '6h', rating: 4.6, enrolled: 7843, thumbnail: '🤖', featured: true,
    tags: ['AI', 'LLM', 'Research Productivity', 'Ethics', 'Prompt Engineering'],
    whatYouLearn: ['Craft effective research prompts', 'Use AI for literature review', 'Automate data exploration', 'Apply AI tools ethically', 'Build an AI-powered research workflow'],
    modules: [
      { id: 'm1', title: 'AI in Modern Research',              duration: '40m', type: 'video'    },
      { id: 'm2', title: 'Prompt Engineering for Researchers', duration: '1h',  type: 'video'    },
      { id: 'm3', title: 'AI-Assisted Literature Review',      duration: '50m', type: 'exercise' },
      { id: 'm4', title: 'Ethics & Attribution',               duration: '45m', type: 'reading'  },
      { id: 'm5', title: 'AI for Data Exploration',            duration: '55m', type: 'video'    },
      { id: 'm6', title: 'Building Your AI Workflow',          duration: '1h',  type: 'exercise' },
    ],
  },
  {
    id: 'c5', title: 'Open Science & Reproducibility', instructor: 'Dr. Sarah Kim', instructorAvatar: '🧪',
    description: 'Best practices for open data, pre-registration, version control, reproducible workflows, and transparent reporting standards.',
    category: 'research', level: 'intermediate', duration: '7h 45m', rating: 4.7, enrolled: 1987, thumbnail: '🔓',
    tags: ['Open Science', 'Reproducibility', 'Git', 'Pre-registration', 'Open Data'],
    whatYouLearn: ['Pre-register studies on OSF', 'Use Git for research', 'Share open data responsibly', 'Write reproducible reports', 'Understand the replication crisis'],
    modules: [
      { id: 'm1', title: 'The Reproducibility Crisis',       duration: '45m',    type: 'video'    },
      { id: 'm2', title: 'Pre-registration & OSF',           duration: '1h',     type: 'video'    },
      { id: 'm3', title: 'Version Control with Git',         duration: '1h 15m', type: 'exercise' },
      { id: 'm4', title: 'Open Data Practices',              duration: '50m',    type: 'reading'  },
      { id: 'm5', title: 'Reproducible Reports with Quarto', duration: '1h 30m', type: 'video'    },
      { id: 'm6', title: 'Transparency Checklist',           duration: '25m',    type: 'quiz'     },
    ],
  },
  {
    id: 'c6', title: 'Grant Writing & Funding', instructor: 'Prof. Marcus Bell', instructorAvatar: '💰',
    description: 'Craft compelling grant proposals — funding landscape, specific aims, budget justification, reviewer psychology, and NIH/NSF/ERC formats.',
    category: 'writing', level: 'advanced', duration: '9h', rating: 4.8, enrolled: 1456, thumbnail: '💰',
    tags: ['Grant Writing', 'NIH', 'NSF', 'ERC', 'Funding'],
    whatYouLearn: ['Write winning specific aims', 'Justify budgets clearly', 'Understand reviewer psychology', 'Navigate NIH/NSF/ERC formats', 'Resubmit rejected proposals'],
    modules: [
      { id: 'm1', title: 'Understanding the Funding Landscape', duration: '1h',     type: 'video'    },
      { id: 'm2', title: 'Crafting Specific Aims',              duration: '1h 20m', type: 'video'    },
      { id: 'm3', title: 'Exercise: Write Your Specific Aims',  duration: '1h',     type: 'exercise' },
      { id: 'm4', title: 'Budget Justification',                duration: '50m',    type: 'reading'  },
      { id: 'm5', title: 'Reviewer Psychology',                 duration: '45m',    type: 'video'    },
      { id: 'm6', title: 'NIH & NSF Format Deep Dive',          duration: '1h 30m', type: 'video'    },
      { id: 'm7', title: 'Final Assessment',                    duration: '35m',    type: 'quiz'     },
    ],
  },
  {
    id: 'c7', title: 'Effective Collaboration in Science', instructor: 'Dr. Maria Santos', instructorAvatar: '🤝',
    description: 'Build and maintain productive research collaborations across institutions — project management, conflict resolution, and co-authorship norms.',
    category: 'collaboration', level: 'beginner', duration: '5h 30m', rating: 4.5, enrolled: 2234, thumbnail: '🤝',
    tags: ['Collaboration', 'Teamwork', 'Project Management', 'Co-authorship', 'Communication'],
    whatYouLearn: ['Build cross-institutional networks', 'Manage collaborative projects', 'Navigate co-authorship disputes', 'Resolve scientific conflicts', 'Use remote collaboration tools'],
    modules: [
      { id: 'm1', title: 'Building Research Networks',         duration: '50m', type: 'video'    },
      { id: 'm2', title: 'Project Management for Researchers', duration: '1h',  type: 'video'    },
      { id: 'm3', title: 'Co-authorship Norms & Ethics',       duration: '40m', type: 'reading'  },
      { id: 'm4', title: 'Conflict Resolution',                duration: '45m', type: 'video'    },
      { id: 'm5', title: 'Remote Collaboration Tools',         duration: '55m', type: 'exercise' },
      { id: 'm6', title: 'Team Dynamics Quiz',                 duration: '30m', type: 'quiz'     },
    ],
  },
  {
    id: 'c8', title: 'Publishing & Open Access', instructor: 'Dr. Kenji Tanaka', instructorAvatar: '📖',
    description: 'Navigate the modern publishing landscape — journal selection, open access models, preprints, and avoiding predatory publishers.',
    category: 'publishing', level: 'beginner', duration: '4h 30m', rating: 4.6, enrolled: 3120, thumbnail: '📖',
    tags: ['Publishing', 'Open Access', 'Preprints', 'Journal Selection', 'Impact Factor'],
    whatYouLearn: ['Select the right journal', 'Understand OA models', 'Use preprint servers', 'Spot predatory publishers', 'Track post-publication impact'],
    modules: [
      { id: 'm1', title: 'The Publishing Ecosystem',      duration: '45m', type: 'video'   },
      { id: 'm2', title: 'Choosing the Right Journal',    duration: '40m', type: 'reading' },
      { id: 'm3', title: 'Open Access Models',            duration: '50m', type: 'video'   },
      { id: 'm4', title: 'Preprints & arXiv',             duration: '35m', type: 'video'   },
      { id: 'm5', title: 'Avoiding Predatory Publishers', duration: '40m', type: 'reading' },
      { id: 'm6', title: 'Post-Publication Impact',       duration: '30m', type: 'quiz'    },
    ],
  },
];

// ── Progress localStorage helpers ──────────────────────────────────────────────
export const PROGRESS_SK = 'courses_progress_v1';

export interface CourseProgress {
  completedModules: string[];
  enrolledAt: number;
  lastAccessedAt?: number;
}

export type ProgressMap = Record<string, CourseProgress>;

export function loadProgress(): ProgressMap {
  try {
    const r = localStorage.getItem(PROGRESS_SK);
    return r ? (JSON.parse(r) as ProgressMap) : {};
  } catch { return {}; }
}

export function saveProgress(p: ProgressMap): void {
  try { localStorage.setItem(PROGRESS_SK, JSON.stringify(p)); } catch {}
}

// ── Utility helpers ────────────────────────────────────────────────────────────
export function getCoursePct(course: Course, cp: CourseProgress | undefined): number {
  if (!cp || course.modules.length === 0) return 0;
  return Math.round((cp.completedModules.length / course.modules.length) * 100);
}

export function isCourseComplete(course: Course, cp: CourseProgress | undefined): boolean {
  return !!cp && cp.completedModules.length === course.modules.length;
}

export function renderStars(rating: number): string {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}
