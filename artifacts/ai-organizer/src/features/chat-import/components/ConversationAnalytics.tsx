/**
 * Conversation Analytics Component
 * Visualizes insights and statistics from imported conversations
 */

import React, { useMemo } from 'react';
import { StoredConversation, ConversationStorageStats } from '../services/ConversationStorageService';

interface ConversationAnalyticsProps {
  conversations: StoredConversation[];
  stats: ConversationStorageStats;
  onClose?: () => void;
}

const platformColors: Record<string, string> = {
  chatgpt: '#10a37f',
  claude: '#cc785c',
  gemini: '#4285f4',
  copilot: '#0078d4',
  perplexity: '#20b2aa',
  metaai: '#0081fb',
  pi: '#6b5ce7',
  characterai: '#ff6b6b',
  deepseek: '#4f46e5',
  mistral: '#ff6b35',
  you: '#8b5cf6',
  huggingface: '#ffbd4a'
};

const platformNames: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  copilot: 'Copilot',
  perplexity: 'Perplexity',
  metaai: 'Meta AI',
  pi: 'Pi AI',
  characterai: 'Character.AI',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  you: 'You.com',
  huggingface: 'HuggingChat'
};

export const ConversationAnalytics: React.FC<ConversationAnalyticsProps> = ({
  conversations,
  stats,
  onClose
}) => {
  // Calculate derived metrics
  const metrics = useMemo(() => {
    const totalWords = conversations.reduce((sum, c) => 
      sum + c.messages.reduce((mSum, m) => mSum + m.content.split(/\s+/).length, 0), 0
    );
    
    const avgMessagesPerConv = conversations.length > 0 
      ? stats.totalMessages / conversations.length 
      : 0;
    
    const avgWordsPerMessage = stats.totalMessages > 0 
      ? totalWords / stats.totalMessages 
      : 0;

    // Time distribution
    const hourlyDistribution = new Array(24).fill(0);
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.timestamp) {
          const hour = new Date(msg.timestamp).getHours();
          hourlyDistribution[hour]++;
        }
      });
    });

    // Role distribution
    const userMessages = conversations.reduce((sum, c) => 
      sum + c.messages.filter(m => m.role === 'user').length, 0
    );
    const assistantMessages = conversations.reduce((sum, c) => 
      sum + c.messages.filter(m => m.role === 'assistant').length, 0
    );

    // Timeline data
    const dateMap = new Map<string, number>();
    conversations.forEach(conv => {
      const date = new Date(conv.startTime).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    const timeline = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30); // Last 30 days

    return {
      totalWords,
      avgMessagesPerConv,
      avgWordsPerMessage,
      hourlyDistribution,
      userMessages,
      assistantMessages,
      timeline
    };
  }, [conversations, stats]);

  const maxHourly = Math.max(...metrics.hourlyDistribution);
  const maxTimeline = Math.max(...metrics.timeline.map(t => t[1]));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Conversation Analytics</h2>
        <button style={styles.closeButton} onClick={onClose}>✕</button>
      </div>

      {/* Key Metrics */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{stats.totalConversations}</div>
          <div style={styles.metricLabel}>Conversations</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{stats.totalMessages.toLocaleString()}</div>
          <div style={styles.metricLabel}>Total Messages</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.totalWords.toLocaleString()}</div>
          <div style={styles.metricLabel}>Total Words</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.avgMessagesPerConv.toFixed(1)}</div>
          <div style={styles.metricLabel}>Avg Messages/Conv</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{metrics.avgWordsPerMessage.toFixed(0)}</div>
          <div style={styles.metricLabel}>Avg Words/Message</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricValue}>{Object.keys(stats.platforms).length}</div>
          <div style={styles.metricLabel}>Platforms</div>
        </div>
      </div>

      <div style={styles.chartsGrid}>
        {/* Platform Distribution */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Platform Distribution</h3>
          <div style={styles.platformList}>
            {Object.entries(stats.platforms)
              .sort((a, b) => b[1] - a[1])
              .map(([platform, count]) => (
                <div key={platform} style={styles.platformItem}>
                  <div style={styles.platformBarContainer}>
                    <div 
                      style={{
                        ...styles.platformBar,
                        width: `${(count / stats.totalConversations) * 100}%`,
                        background: platformColors[platform] || '#6b7280'
                      }}
                    />
                  </div>
                  <div style={styles.platformInfo}>
                    <span style={styles.platformName}>{platformNames[platform] || platform}</span>
                    <span style={styles.platformCount}>{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Role Distribution */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Message Distribution</h3>
          <div style={styles.roleContainer}>
            <div style={styles.roleItem}>
              <div style={styles.roleBarContainer}>
                <div 
                  style={{
                    ...styles.roleBar,
                    height: `${(metrics.userMessages / stats.totalMessages) * 100}%`,
                    background: '#3b82f6'
                  }}
                />
              </div>
              <div style={styles.roleInfo}>
                <span style={styles.roleIcon}>👤</span>
                <span style={styles.roleLabel}>User</span>
                <span style={styles.roleCount}>{metrics.userMessages}</span>
              </div>
            </div>
            <div style={styles.roleItem}>
              <div style={styles.roleBarContainer}>
                <div 
                  style={{
                    ...styles.roleBar,
                    height: `${(metrics.assistantMessages / stats.totalMessages) * 100}%`,
                    background: '#10b981'
                  }}
                />
              </div>
              <div style={styles.roleInfo}>
                <span style={styles.roleIcon}>🤖</span>
                <span style={styles.roleLabel}>AI</span>
                <span style={styles.roleCount}>{metrics.assistantMessages}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hourly Activity */}
        <div style={{...styles.chartCard, gridColumn: 'span 2'}}>
          <h3 style={styles.chartTitle}>Activity by Hour</h3>
          <div style={styles.hourlyChart}>
            {metrics.hourlyDistribution.map((count, hour) => (
              <div key={hour} style={styles.hourBarContainer}>
                <div 
                  style={{
                    ...styles.hourBar,
                    height: maxHourly > 0 ? `${(count / maxHourly) * 100}%` : '0%'
                  }}
                  title={`${hour}:00 - ${count} messages`}
                />
                <span style={styles.hourLabel}>{hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{...styles.chartCard, gridColumn: 'span 2'}}>
          <h3 style={styles.chartTitle}>Conversations Over Time (Last 30 Days)</h3>
          <div style={styles.timelineChart}>
            {metrics.timeline.map(([date, count]) => (
              <div key={date} style={styles.timelineBarContainer}>
                <div 
                  style={{
                    ...styles.timelineBar,
                    height: maxTimeline > 0 ? `${(count / maxTimeline) * 100}%` : '0%'
                  }}
                  title={`${date}: ${count} conversations`}
                />
              </div>
            ))}
          </div>
          <div style={styles.timelineLabels}>
            <span>{metrics.timeline[0]?.[0] || ''}</span>
            <span>{metrics.timeline[metrics.timeline.length - 1]?.[0] || ''}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 600,
    color: 'var(--text-primary, #1f2937)'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  metricCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    border: '1px solid var(--border-color, #e5e7eb)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--primary-600, #4f46e5)'
  },
  metricLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary, #6b7280)',
    marginTop: '4px'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px'
  },
  chartCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid var(--border-color, #e5e7eb)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary, #1f2937)'
  },
  platformList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  platformItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  platformBarContainer: {
    width: '100px',
    height: '8px',
    background: 'var(--bg-muted, #f3f4f6)',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  platformBar: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  platformInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    flex: 1,
    fontSize: '14px'
  },
  platformName: {
    color: 'var(--text-primary, #1f2937)'
  },
  platformCount: {
    color: 'var(--text-secondary, #6b7280)',
    fontWeight: 500
  },
  roleContainer: {
    display: 'flex',
    gap: '32px',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '200px'
  },
  roleItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  },
  roleBarContainer: {
    width: '60px',
    height: '150px',
    background: 'var(--bg-muted, #f3f4f6)',
    borderRadius: '8px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end'
  },
  roleBar: {
    width: '100%',
    borderRadius: '8px 8px 0 0',
    transition: 'height 0.3s ease'
  },
  roleInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  roleIcon: {
    fontSize: '20px'
  },
  roleLabel: {
    fontSize: '13px',
    color: 'var(--text-secondary, #6b7280)'
  },
  roleCount: {
    fontSize: '16px',
    fontWeight: 600,
    color: 'var(--text-primary, #1f2937)'
  },
  hourlyChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    height: '150px',
    padding: '0 8px'
  },
  hourBarContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  hourBar: {
    width: '100%',
    background: 'var(--primary-500, #6366f1)',
    borderRadius: '2px 2px 0 0',
    minHeight: '2px',
    transition: 'height 0.3s ease'
  },
  hourLabel: {
    fontSize: '10px',
    color: 'var(--text-muted, #9ca3af)'
  },
  timelineChart: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    height: '100px',
    padding: '0 8px'
  },
  timelineBarContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  },
  timelineBar: {
    width: '100%',
    background: 'var(--primary-500, #6366f1)',
    borderRadius: '2px 2px 0 0',
    minHeight: '2px',
    transition: 'height 0.3s ease'
  },
  timelineLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '8px',
    fontSize: '12px',
    color: 'var(--text-muted, #9ca3af)'
  }
};
