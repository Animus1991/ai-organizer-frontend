/**
 * ContributionGraph - GitHub-style contribution heatmap
 * Shows daily activity intensity over the past year
 * Fully themed with HSL semantic tokens from index.css
 */

import React, { useMemo, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheoryBranching } from '../context/TheoryBranchingContext';
import { useResearchIssues } from '../context/ResearchIssuesContext';
import { useIsMobile } from '../hooks/useMediaQuery';

export interface ContributionDay {
  date: string; // YYYY-MM-DD
  count: number;
  details?: string;
}

interface ContributionGraphProps {
  data?: ContributionDay[];
  storageKey?: string;
  title?: string;
  subtitle?: string;
  colorScheme?: 'green' | 'purple' | 'blue' | 'orange' | 'rose' | 'teal' | 'rainbow';
  weeks?: number;
  style?: React.CSSProperties;
  showColorToggle?: boolean;
  showYearSelector?: boolean;
  projects?: string[];
}

const COLOR_SCHEMES = {
  green:   ['hsl(var(--muted) / 0.3)', '#0e4429', '#006d32', '#26a641', '#39d353'],
  purple:  ['hsl(var(--muted) / 0.3)', '#2d1b4e', '#4c2889', '#7c3aed', '#a78bfa'],
  blue:    ['hsl(var(--muted) / 0.3)', '#0c2d6b', '#0550ae', '#2f81f7', '#58a6ff'],
  orange:  ['hsl(var(--muted) / 0.3)', '#7c2d12', '#c2410c', '#ea580c', '#fb923c'],
  rose:    ['hsl(var(--muted) / 0.3)', '#881337', '#be123c', '#e11d48', '#fb7185'],
  teal:    ['hsl(var(--muted) / 0.3)', '#134e4a', '#0f766e', '#14b8a6', '#5eead4'],
  rainbow: ['hsl(var(--muted) / 0.3)', '#6366f1', '#a855f7', '#ec4899', '#f97316'],
};

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getActivityFromStorage(storageKey: string): ContributionDay[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const items: Array<{ timestamp?: string | number; date?: string; type?: string }> = JSON.parse(raw);
    const countMap = new Map<string, number>();
    items.forEach(item => {
      let dateStr: string;
      if (item.date) {
        dateStr = typeof item.date === 'string' ? item.date.split('T')[0] : new Date(item.date).toISOString().split('T')[0];
      } else if (item.timestamp) {
        dateStr = new Date(item.timestamp).toISOString().split('T')[0];
      } else { return; }
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    });
    return Array.from(countMap.entries()).map(([date, count]) => ({ date, count }));
  } catch { return []; }
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateSampleData(weeks: number, year?: number): ContributionDay[] {
  const days: ContributionDay[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  let startDate: Date, endDate: Date;
  if (year !== undefined && year !== currentYear) {
    startDate = new Date(year, 0, 1); endDate = new Date(year, 11, 31);
  } else {
    const totalDays = weeks * 7;
    startDate = new Date(now); startDate.setDate(startDate.getDate() - totalDays + 1); endDate = now;
  }
  const rand = seededRandom(year ?? currentYear);
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dateStr = cursor.toISOString().split('T')[0];
    const r = rand();
    let count = 0;
    if (r > 0.35) count = 0;
    else if (r > 0.15) count = Math.ceil(rand() * 3);
    else if (r > 0.05) count = Math.ceil(rand() * 6) + 3;
    else count = Math.ceil(rand() * 8) + 6;
    const dow = cursor.getDay();
    if ((dow === 0 || dow === 6) && rand() > 0.3) count = 0;
    days.push({ date: dateStr, count });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data, storageKey = 'collab_activities', title = 'Research Activity', subtitle,
  colorScheme: initialColorScheme = 'green', weeks = 52, style,
  showColorToggle = false, showYearSelector = false, projects,
}) => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { commits } = useTheoryBranching();
  const { issues } = useResearchIssues();
  const isMobile = useIsMobile();
  const currentYear = new Date().getFullYear();

  const contextActivityData = useMemo((): ContributionDay[] => {
    const countMap = new Map<string, number>();
    commits.forEach(commit => {
      const dateStr = new Date(commit.timestamp).toISOString().split('T')[0];
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    });
    issues.forEach(issue => {
      const dateStr = issue.createdAt.toISOString().split('T')[0];
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
      if (issue.updatedAt) {
        const updateStr = issue.updatedAt.toISOString().split('T')[0];
        if (updateStr !== dateStr) countMap.set(updateStr, (countMap.get(updateStr) || 0) + 1);
      }
    });
    return Array.from(countMap.entries()).map(([date, count]) => ({ date, count }));
  }, [commits, issues]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number; x: number; y: number } | null>(null);
  const [colorScheme, setColorScheme] = useState<typeof initialColorScheme>(initialColorScheme);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  const availableProjects = useMemo(() => {
    if (projects && projects.length > 0) return projects;
    const source = data || contextActivityData;
    const ps = new Set<string>();
    source.forEach(d => { if (d.details) ps.add(d.details); });
    return ps.size > 0 ? Array.from(ps).sort() : [];
  }, [projects, data, contextActivityData]);

  const availableYears = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 3; y--) years.push(y);
    return years;
  }, [currentYear]);

  const activityData = useMemo(() => {
    let source: ContributionDay[] = [];
    if (data && data.length > 0) source = data;
    else if (contextActivityData.length > 0) source = contextActivityData;
    else {
      const stored = getActivityFromStorage(storageKey);
      source = stored.length > 0 ? stored : generateSampleData(weeks, showYearSelector ? selectedYear : undefined);
    }
    if (selectedProject !== 'all') source = source.filter(d => d.details === selectedProject);
    if (showYearSelector && selectedYear !== currentYear) {
      const filtered = source.filter(d => d.date.startsWith(String(selectedYear)));
      if (filtered.length > 0) return filtered;
    }
    return source;
  }, [data, contextActivityData, storageKey, weeks, selectedYear, showYearSelector, currentYear, selectedProject]);

  const { grid, monthLabels, totalContributions, maxCount, streakCurrent, streakLongest, mostActiveDay, activeDays, avgDaily } = useMemo(() => {
    const now = new Date();
    const isCurrentYear = selectedYear === currentYear;
    let startDate: Date, endDate: Date, totalDays: number;
    if (showYearSelector && !isCurrentYear) {
      startDate = new Date(selectedYear, 0, 1); endDate = new Date(selectedYear, 11, 31);
      totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      totalDays = weeks * 7; startDate = new Date(now);
      startDate.setDate(startDate.getDate() - totalDays + 1); endDate = now;
    }
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);
    const dateMap = new Map<string, number>();
    activityData.forEach(d => dateMap.set(d.date, d.count));
    const cols: Array<Array<{ date: string; count: number; inRange: boolean }>> = [];
    let maxC = 0, total = 0;
    const mLabels: Array<{ label: string; col: number }> = [];
    let lastMonth = -1;
    const cursor = new Date(startDate);
    let colIdx = 0;
    const maxWeeks = showYearSelector && selectedYear !== currentYear ? 54 : weeks + 1;
    while (cursor <= endDate || cols.length < maxWeeks) {
      const col: Array<{ date: string; count: number; inRange: boolean }> = [];
      for (let row = 0; row < 7; row++) {
        const ds = cursor.toISOString().split('T')[0];
        const count = dateMap.get(ds) || 0;
        const inRange = cursor <= endDate && cursor >= new Date(startDate.getTime() + dayOfWeek * 86400000);
        col.push({ date: ds, count: inRange ? count : 0, inRange });
        if (inRange) { total += count; if (count > maxC) maxC = count; }
        const m = cursor.getMonth();
        if (m !== lastMonth && row === 0) { mLabels.push({ label: MONTH_LABELS[m], col: colIdx }); lastMonth = m; }
        cursor.setDate(cursor.getDate() + 1);
      }
      cols.push(col); colIdx++;
      if (cols.length > maxWeeks + 1) break;
    }
    let currentStreak = 0, longestStreak = 0, tempStreak = 0;
    const todayStr = now.toISOString().split('T')[0];
    const allDates: string[] = [];
    for (let i = totalDays - 1; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); allDates.push(d.toISOString().split('T')[0]); }
    for (const ds of allDates) { if ((dateMap.get(ds) || 0) > 0) { tempStreak++; if (tempStreak > longestStreak) longestStreak = tempStreak; } else { tempStreak = 0; } }
    for (let i = allDates.length - 1; i >= 0; i--) { if ((dateMap.get(allDates[i]) || 0) > 0) currentStreak++; else { if (allDates[i] === todayStr) continue; break; } }
    let bestDay = '', bestCount = 0;
    dateMap.forEach((c, d) => { if (c > bestCount) { bestCount = c; bestDay = d; } });
    let activeDaysCount = 0;
    dateMap.forEach(c => { if (c > 0) activeDaysCount++; });
    return { grid: cols, monthLabels: mLabels, totalContributions: total, maxCount: maxC, streakCurrent: currentStreak, streakLongest: longestStreak, mostActiveDay: bestDay, activeDays: activeDaysCount, avgDaily: activeDaysCount > 0 ? +(total / totalDays).toFixed(1) : 0 };
  }, [activityData, weeks, selectedYear, currentYear, showYearSelector]);

  const schemeColors = COLOR_SCHEMES[colorScheme];
  const emptyColor = schemeColors[0];
  const getColor = (count: number): string => {
    if (count === 0 || maxCount === 0) return emptyColor;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return schemeColors[1];
    if (ratio <= 0.5) return schemeColors[2];
    if (ratio <= 0.75) return schemeColors[3];
    return schemeColors[4];
  };

  const cellSize = isMobile ? 10 : 12;
  const cellGap = isMobile ? 2 : 3;
  const leftPad = isMobile ? 24 : 32;
  const topPad = 20;

  return (
    <div
      className="animate-fade-in rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm transition-all duration-300"
      style={{
        padding: isMobile ? '14px 12px 20px 12px' : '20px 24px 28px 24px',
        ...style,
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 mb-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground m-0">{title}</h3>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 m-0">{subtitle}</p>}
          </div>
          {/* Project filter */}
          {availableProjects.length > 0 && (
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              className="py-1 px-2 rounded-lg text-[11px] border border-border/60 bg-muted/20 text-muted-foreground outline-none cursor-pointer shrink-0"
            >
              <option value="all">{t('contrib.allProjects') || 'All projects'}</option>
              {availableProjects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>

        {/* Year selector + stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          {showYearSelector && (
            <div className="flex gap-1 shrink-0">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-0.5 text-[11px] rounded-full border transition-all ${
                    selectedYear === year
                      ? 'font-semibold bg-primary/12 border-primary/30 text-primary'
                      : 'font-normal bg-transparent border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 flex-wrap text-[11px] text-muted-foreground items-center ml-auto">
            <span><strong className="text-foreground">{totalContributions}</strong> {t('contrib.contributions') || 'contributions'}</span>
            {streakCurrent > 0 && <span className="text-warning">🔥 <strong className="text-foreground">{streakCurrent}</strong>-{t('contrib.dayStreak') || 'day streak'}</span>}
            {!isMobile && (
              <>
                <span><strong className="text-foreground">{streakLongest}</strong> {t('contrib.longest') || 'longest'}</span>
                <span><strong className="text-foreground">{activeDays}</strong> {t('contrib.activeDays') || 'active days'}</span>
                <span><strong className="text-foreground">{avgDaily}</strong>{t('contrib.dayAvg') || '/day avg'}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="relative overflow-x-auto overflow-y-hidden -mx-1">
        <svg
          width={leftPad + grid.length * (cellSize + cellGap) + 10}
          height={topPad + 7 * (cellSize + cellGap) + 10}
          style={{ display: 'block' }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.5); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
          {/* Month labels */}
          {monthLabels.map((m, i) => (
            <text
              key={`m-${i}`}
              x={leftPad + m.col * (cellSize + cellGap)}
              y={12}
              className="fill-muted-foreground"
              fontSize={isMobile ? '9' : '10'}
              fontFamily="system-ui, sans-serif"
            >
              {m.label}
            </text>
          ))}
          {/* Day labels */}
          {DAY_LABELS.map((label, i) => (
            label ? (
              <text
                key={`d-${i}`}
                x={0}
                y={topPad + i * (cellSize + cellGap) + cellSize - 1}
                className="fill-muted-foreground"
                fontSize={isMobile ? '8' : '10'}
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            ) : null
          ))}
          {/* Cells */}
          {grid.map((col, colIdx) =>
            col.map((cell, rowIdx) => (
              <rect
                key={`${colIdx}-${rowIdx}`}
                x={leftPad + colIdx * (cellSize + cellGap)}
                y={topPad + rowIdx * (cellSize + cellGap)}
                width={cellSize}
                height={cellSize}
                rx={2} ry={2}
                fill={cell.inRange ? getColor(cell.count) : 'transparent'}
                stroke={cell.inRange ? 'hsl(var(--border) / 0.3)' : 'none'}
                strokeWidth={0.5}
                style={{
                  cursor: cell.inRange ? 'pointer' : 'default',
                  transition: 'fill 0.2s ease, opacity 0.3s ease',
                  opacity: cell.inRange ? 1 : 0,
                  animation: cell.inRange ? `fadeIn 0.4s ease ${(colIdx * 7 + rowIdx) * 2}ms both` : 'none',
                }}
                onMouseEnter={(e) => {
                  if (cell.inRange) {
                    const el = e.target as SVGRectElement;
                    el.style.strokeWidth = '1.5';
                    el.style.stroke = 'hsl(var(--primary) / 0.6)';
                    el.style.filter = 'brightness(1.3)';
                    const rect = el.getBoundingClientRect();
                    setHoveredDay({ date: cell.date, count: cell.count, x: rect.left + rect.width / 2, y: rect.top });
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.target as SVGRectElement;
                  el.style.strokeWidth = '0.5';
                  el.style.stroke = cell.inRange ? 'hsl(var(--border) / 0.3)' : 'none';
                  el.style.filter = 'none';
                  setHoveredDay(null);
                }}
              />
            ))
          )}
        </svg>

        {/* Tooltip */}
        {hoveredDay && (
          <div className="fixed z-[10000] pointer-events-none rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] text-popover-foreground whitespace-nowrap shadow-lg"
            style={{ left: hoveredDay.x, top: hoveredDay.y - 36, transform: 'translateX(-50%)' }}
          >
            <strong>{hoveredDay.count} {t('contrib.contributions') || 'contributions'}</strong> {t('common.on') || 'on'} {hoveredDay.date}
          </div>
        )}
      </div>

      {/* Legend + Color Toggle */}
      <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground flex-wrap gap-y-2">
        {mostActiveDay && !isMobile && (
          <span>{t('contrib.mostActive') || 'Most active'}: <strong className="text-foreground">{mostActiveDay}</strong></span>
        )}
        <div className="flex items-center gap-1 ml-auto flex-wrap">
          {showColorToggle && (
            <>
              {(['green', 'purple', 'blue', 'orange', 'rose', 'teal', 'rainbow'] as const).map(scheme => (
                <button
                  key={scheme}
                  onClick={() => setColorScheme(scheme)}
                  title={scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                   className={`border rounded transition-transform duration-150 p-0 cursor-pointer ${
                    colorScheme === scheme ? 'scale-110 border-foreground/40' : 'scale-100 border-border/40'
                  }`}
                  style={{
                    width: isMobile ? 10 : 14,
                    height: isMobile ? 10 : 14,
                    borderRadius: 3,
                    background: scheme === 'rainbow'
                      ? 'linear-gradient(135deg, #6366f1, #ec4899, #f97316)'
                      : COLOR_SCHEMES[scheme][3],
                  }}
                />
              ))}
              <span className="mx-1 text-border">|</span>
            </>
          )}
          <span>{t('contrib.less') || 'Less'}</span>
          {schemeColors.map((c, i) => (
            <div key={i} className="rounded-sm border border-border/30" style={{ width: isMobile ? 8 : 10, height: isMobile ? 8 : 10, background: c }} />
          ))}
          <span>{t('contrib.more') || 'More'}</span>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
