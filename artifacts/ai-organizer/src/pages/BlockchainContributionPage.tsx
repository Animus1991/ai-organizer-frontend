/**
 * BlockchainContributionPage — Unified page for all blockchain/DeSci features
 * Phase 1: All mock data, semantic theming
 */
import React, { useState } from 'react';
import { 
  GitBranch, MessageSquare, TrendingUp, Bell, 
  ArrowLeft, Blocks
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ContributionTrackingDashboard } from '../components/blockchain/ContributionTrackingDashboard';
import { ProvenanceGraph } from '../components/blockchain/ProvenanceGraph';
import { BlindRevealPeerReview } from '../components/blockchain/BlindRevealPeerReview';
import { BlockchainNotifications } from '../components/blockchain/BlockchainNotifications';

type TabId = 'contributions' | 'provenance' | 'peer-review' | 'notifications';

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'contributions', label: 'Contributions', icon: TrendingUp, description: 'Track multi-type academic contributions' },
  { id: 'provenance', label: 'Provenance Graph', icon: GitBranch, description: 'Interactive idea evolution visualization' },
  { id: 'peer-review', label: 'Peer Review', icon: MessageSquare, description: 'Blind-then-Reveal review system' },
  { id: 'notifications', label: 'Events', icon: Bell, description: 'Blockchain event notifications' },
];

const BlockchainContributionPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('contributions');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Blocks className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Proof of Contribution</h1>
                <p className="text-xs text-muted-foreground">Blockchain-anchored academic contribution tracking</p>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 mt-4 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-foreground bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/30'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'contributions' && <ContributionTrackingDashboard />}
        {activeTab === 'provenance' && <ProvenanceGraph />}
        {activeTab === 'peer-review' && <BlindRevealPeerReview />}
        {activeTab === 'notifications' && <BlockchainNotifications />}
      </div>
    </div>
  );
};

export default BlockchainContributionPage;
