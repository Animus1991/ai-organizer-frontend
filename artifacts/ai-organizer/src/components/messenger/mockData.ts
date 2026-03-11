/**
 * Mock data for research messenger
 */
import type { MessengerUser, Conversation, Message } from './types';

export const mockUsers: MessengerUser[] = [
  { id: 'u1', name: 'Μαρία Κ.', status: 'online', bio: 'NLP Researcher', institution: 'ΕΚΠΑ' },
  { id: 'u2', name: 'Γιώργος Π.', status: 'online', bio: 'Data Scientist', institution: 'ΑΠΘ' },
  { id: 'u3', name: 'Elena R.', status: 'away', lastSeen: new Date(Date.now() - 15 * 60000), bio: 'Computational Linguist', institution: 'MIT' },
  { id: 'u4', name: 'Νίκος Α.', status: 'offline', lastSeen: new Date(Date.now() - 3600000), bio: 'ML Engineer', institution: 'ETH Zurich' },
  { id: 'u5', name: 'Sofia M.', status: 'online', bio: 'Research Assistant', institution: 'ΕΚΠΑ' },
  { id: 'u6', name: 'Δημήτρης Λ.', status: 'busy', bio: 'Professor', institution: 'ΕΜΠ' },
];

export const currentUser: MessengerUser = {
  id: 'me',
  name: 'Εγώ',
  status: 'online',
};

const now = Date.now();

export const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm1', conversationId: 'conv-1', senderId: 'u1', content: 'Γεια! Είδες το νέο paper για transformer architectures;', timestamp: new Date(now - 3600000), status: 'read', reactions: [], attachments: [], tag: 'reference' },
    { id: 'm2', conversationId: 'conv-1', senderId: 'me', content: 'Ναι! Η βασική εξίσωση είναι $\\text{Attention}(Q,K,V) = \\text{softmax}(QK^T / \\sqrt{d_k})V$ — πολύ elegant!', timestamp: new Date(now - 3500000), status: 'read', reactions: [{ emoji: '👍', userId: 'u1', userName: 'Μαρία Κ.' }], attachments: [], tag: 'idea' },
    { id: 'm3', conversationId: 'conv-1', senderId: 'u1', content: 'Θέλεις να δουλέψουμε μαζί σε ένα replication study; Τα πρώτα results:\n|Model|Accuracy|F1|\n|BERT|92.3%|0.91|\n|GPT-4|96.1%|0.95|\n|Ours|94.7%|0.93|', timestamp: new Date(now - 3400000), status: 'read', reactions: [], attachments: [], tag: 'hypothesis' },
    { id: 'm4', conversationId: 'conv-1', senderId: 'me', content: 'Φυσικά! Ένα quick script:\n```python\nimport torch\nfrom transformers import AutoModel\n\nmodel = AutoModel.from_pretrained("bert-base")\n# Fine-tune on our dataset\nfor epoch in range(10):\n    loss = train_step(model, data)\n    print(f"Epoch {epoch}: loss={loss:.4f}")\n```\nΣτέλνω τις σημειώσεις μου αύριο.', timestamp: new Date(now - 600000), status: 'delivered', reactions: [], attachments: [], tag: 'action-item', pinned: true },
  ],
  'conv-2': [
    { id: 'm5', conversationId: 'conv-2', senderId: 'u2', content: 'Τα results του experiment είναι έτοιμα 🎉\n$$L = -\\sum_{i=1}^{N} y_i \\log(\\hat{y}_i)$$', timestamp: new Date(now - 7200000), status: 'read', reactions: [], attachments: [], tag: 'result' },
    { id: 'm6', conversationId: 'conv-2', senderId: 'me', content: 'Τέλεια! Μπορείς να μου στείλεις το notebook;', timestamp: new Date(now - 7100000), status: 'read', reactions: [], attachments: [], tag: 'action-item' },
  ],
  'conv-3': [
    { id: 'm7', conversationId: 'conv-3', senderId: 'u1', content: 'Meeting αύριο στις 10 για το project review.', timestamp: new Date(now - 86400000), status: 'read', reactions: [], attachments: [], tag: 'action-item' },
    { id: 'm8', conversationId: 'conv-3', senderId: 'u2', content: 'Εντάξει, θα είμαι εκεί!', timestamp: new Date(now - 86300000), status: 'read', reactions: [], attachments: [] },
    { id: 'm9', conversationId: 'conv-3', senderId: 'me', content: 'Κι εγώ! Θα φέρω τα updated slides.', timestamp: new Date(now - 86200000), status: 'read', reactions: [], attachments: [] },
  ],
};

const defaultBlockchain = { enabled: false, mode: 'self-only' as const, acceptedByAll: false, enabledBy: [] };
const defaultNDA = { enabled: false, acceptedBy: [], pendingFor: [], terms: '' };

export const mockConversations: Conversation[] = [
  {
    id: 'conv-1', type: 'direct',
    participants: [currentUser, mockUsers[0]],
    lastMessage: mockMessages['conv-1'][3],
    unreadCount: 0, pinned: true, muted: false, typing: [],
    blockchain: { enabled: true, mode: 'mutual', acceptedByAll: true, enabledBy: ['me', 'u1'] },
    pinnedMessages: ['m4'],
    nda: {
      enabled: true,
      acceptedBy: ['me', 'u1'],
      pendingFor: [],
      terms: 'Όλες οι πληροφορίες που ανταλλάσσονται σε αυτή τη συνομιλία είναι αυστηρά εμπιστευτικές. Απαγορεύεται η κοινοποίηση, αναπαραγωγή ή διανομή χωρίς γραπτή συγκατάθεση. Παραβίαση συνεπάγεται νομικές κυρώσεις.',
      activatedAt: new Date(Date.now() - 86400000),
      activatedBy: 'u1',
    },
  },
  {
    id: 'conv-2', type: 'direct',
    participants: [currentUser, mockUsers[1]],
    lastMessage: mockMessages['conv-2'][1],
    unreadCount: 1, pinned: false, muted: false, typing: [],
    blockchain: defaultBlockchain,
    pinnedMessages: [],
    nda: defaultNDA,
  },
  {
    id: 'conv-3', type: 'group',
    name: 'Research Team',
    participants: [currentUser, mockUsers[0], mockUsers[1], mockUsers[4]],
    lastMessage: mockMessages['conv-3'][2],
    unreadCount: 0, pinned: false, muted: false, typing: [],
    blockchain: defaultBlockchain,
    pinnedMessages: [],
    nda: defaultNDA,
  },
];
