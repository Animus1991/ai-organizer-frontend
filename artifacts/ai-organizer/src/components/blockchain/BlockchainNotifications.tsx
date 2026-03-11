/**
 * BlockchainNotifications — Event notification triggers
 * Displays real-time notifications for blockchain events:
 * new bounty, identity revealed, contribution verified, SBT earned.
 */
import React, { useState } from 'react';
import {
  Bell, Coins, Eye, Shield, Award, CheckCircle2, Clock,
  ChevronRight, X, Filter
} from 'lucide-react';

type EventType = 'bounty-posted' | 'identity-revealed' | 'contribution-verified' | 'sbt-earned';

interface BlockchainEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  txHash?: string;
  actor: string;
  metadata?: Record<string, string>;
}

const EVENT_CONFIG: Record<EventType, { icon: React.ElementType; color: string; label: string }> = {
  'bounty-posted':          { icon: Coins,        color: 'var(--warning)',     label: 'New Bounty' },
  'identity-revealed':      { icon: Eye,          color: 'var(--info)',        label: 'Identity Revealed' },
  'contribution-verified':  { icon: CheckCircle2, color: 'var(--success)',     label: 'Verified On-Chain' },
  'sbt-earned':             { icon: Award,        color: '262 83% 58%',       label: 'SBT Earned' },
};

const MOCK_EVENTS: BlockchainEvent[] = [
  {
    id: 'e1', type: 'bounty-posted', title: 'New Reproducibility Bounty',
    description: 'CRISPR LNP Brain Delivery Protocol — 150 tokens reward',
    timestamp: '2026-03-08T08:30:00Z', read: false, actor: 'Dr. Papadimitriou',
    txHash: '0xab3f...e7d2',
  },
  {
    id: 'e2', type: 'contribution-verified', title: 'Contribution Anchored on Ethereum',
    description: 'Your "Novel CRISPR delivery hypothesis" has been verified on-chain',
    timestamp: '2026-03-07T16:45:00Z', read: false, actor: 'System',
    txHash: '0xcd5a...f8b1',
  },
  {
    id: 'e3', type: 'identity-revealed', title: 'Reviewer Identity Revealed',
    description: 'Reviewer-Ψ7 revealed identity as Prof. N. Georgiou',
    timestamp: '2026-03-07T14:20:00Z', read: true, actor: 'Prof. Georgiou',
  },
  {
    id: 'e4', type: 'sbt-earned', title: 'Soulbound Token Earned',
    description: 'You earned "Expert Reviewer" SBT for completing 10 high-quality reviews',
    timestamp: '2026-03-06T11:00:00Z', read: true, actor: 'Protocol',
    metadata: { sbtName: 'Expert Reviewer', level: 'Gold' },
  },
  {
    id: 'e5', type: 'contribution-verified', title: 'Replication Verified',
    description: 'LNP experiment replication by Dr. Dimitriou confirmed with 94% concordance',
    timestamp: '2026-03-05T09:15:00Z', read: true, actor: 'Dr. Dimitriou',
    txHash: '0xef7c...a3d4',
  },
  {
    id: 'e6', type: 'bounty-posted', title: 'New Bounty: Bayesian Validation',
    description: 'Validate classification accuracy on ClinVar dataset — 200 tokens',
    timestamp: '2026-03-04T13:30:00Z', read: true, actor: 'Prof. Georgiou',
  },
];

export const BlockchainNotifications: React.FC = () => {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [showPanel, setShowPanel] = useState(true);

  const unreadCount = events.filter(e => !e.read).length;
  const filtered = filterType === 'all' ? events : events.filter(e => e.type === filterType);

  const markRead = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
  };

  const markAllRead = () => {
    setEvents(prev => prev.map(e => ({ ...e, read: true })));
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="border border-border rounded-xl bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[hsl(var(--destructive))] text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Blockchain Events</h3>
            <p className="text-[11px] text-muted-foreground">{unreadCount} unread notifications</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border overflow-x-auto">
        <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {(['all', ...Object.keys(EVENT_CONFIG)] as (EventType | 'all')[]).map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2.5 py-1 text-[11px] rounded-full border whitespace-nowrap transition-colors ${
              filterType === type
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {type === 'all' ? 'All' : EVENT_CONFIG[type].label}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
        {filtered.map(event => {
          const cfg = EVENT_CONFIG[event.type];
          const Icon = cfg.icon;
          return (
            <div
              key={event.id}
              className={`p-4 hover:bg-accent/20 transition-colors cursor-pointer ${!event.read ? 'bg-primary/[0.03]' : ''}`}
              onClick={() => markRead(event.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `hsl(${cfg.color} / 0.12)` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: `hsl(${cfg.color})` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-sm ${!event.read ? 'font-semibold' : 'font-medium'} text-foreground truncate`}>
                      {event.title}
                    </h4>
                    {!event.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
                    <span>{event.actor}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {timeAgo(event.timestamp)}</span>
                    {event.txHash && (
                      <>
                        <span>·</span>
                        <span className="font-mono flex items-center gap-0.5">
                          <Shield className="w-3 h-3" /> {event.txHash}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BlockchainNotifications;
