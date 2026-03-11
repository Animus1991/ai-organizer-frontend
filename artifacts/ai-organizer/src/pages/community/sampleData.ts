/**
 * Community module — sample/seed data
 */
import type { CommunityProfile, FollowActivity } from "./types";

function generateId(): string {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

export function createSampleData() {
  const now = Date.now();
  const DAY = 86400000;

  const profiles: CommunityProfile[] = [
    {
      id: "user-1", name: "Dr. Elena Vasquez", avatar: "🧬", username: "evasquez",
      institution: "MIT", department: "Physics", field: "Quantum Physics",
      bio: "Pioneering research at the intersection of quantum physics and molecular biology. Investigating quantum coherence in photosynthetic systems.",
      location: "Cambridge, MA", website: "https://vasquez-lab.mit.edu", orcid: "0000-0001-2345-6789",
      publications: 87, citations: 4523, hIndex: 38, followers: 1245, following: 89,
      isFollowing: false, isFollowedBy: false, joinedAt: now - DAY * 365, lastActiveAt: now - 3600000,
      expertise: ["Quantum Biology", "Spectroscopy", "Photosynthesis", "Decoherence"],
      recentProjects: ["Quantum Coherence in FMO", "Non-Markovian Dynamics"], contributionCount: 342,
      openToCollaboration: true, verifiedEmail: true,
    },
    {
      id: "user-2", name: "Prof. James Chen", avatar: "🤖", username: "jchen",
      institution: "Stanford", department: "Computer Science", field: "Computer Science",
      bio: "Developing AI systems that accelerate scientific discovery. Creator of ScienceNAS framework for automated neural architecture search.",
      location: "Palo Alto, CA", website: "https://chen-ai-lab.stanford.edu", orcid: "0000-0002-3456-7890",
      publications: 134, citations: 12890, hIndex: 56, followers: 3456, following: 234,
      isFollowing: true, isFollowedBy: true, joinedAt: now - DAY * 500, lastActiveAt: now - 7200000,
      expertise: ["Neural Architecture Search", "AI for Science", "Deep Learning", "AutoML"],
      recentProjects: ["ScienceNAS v3.0", "Scientific Foundation Models"], contributionCount: 567,
      openToCollaboration: true, verifiedEmail: true,
    },
    {
      id: "user-3", name: "Dr. Sarah Kim", avatar: "🧪", username: "skim",
      institution: "Harvard", department: "Molecular Biology", field: "Molecular Biology",
      bio: "Leading CRISPR-Cas13 research for therapeutic RNA editing. Focused on improving specificity and reducing off-target effects.",
      location: "Boston, MA", website: "https://kim-lab.harvard.edu", orcid: "0000-0003-4567-8901",
      publications: 62, citations: 3890, hIndex: 32, followers: 2134, following: 156,
      isFollowing: false, isFollowedBy: true, joinedAt: now - DAY * 280, lastActiveAt: now - 14400000,
      expertise: ["CRISPR", "RNA Editing", "Gene Therapy", "Molecular Biology"],
      recentProjects: ["Cas13 Specificity Optimization", "RNA Therapeutics"], contributionCount: 234,
      openToCollaboration: false, verifiedEmail: true,
    },
    {
      id: "user-4", name: "Prof. Giulio Tononi", avatar: "🧠", username: "gtononi",
      institution: "UW-Madison", department: "Psychiatry", field: "Neuroscience",
      bio: "Creator of Integrated Information Theory (IIT). Exploring the mathematical foundations of consciousness and subjective experience.",
      location: "Madison, WI", website: "https://tononi-lab.wisc.edu", orcid: "0000-0004-5678-9012",
      publications: 198, citations: 28900, hIndex: 72, followers: 5678, following: 45,
      isFollowing: false, isFollowedBy: false, joinedAt: now - DAY * 600, lastActiveAt: now - DAY,
      expertise: ["Consciousness", "IIT", "Sleep", "Complexity"],
      recentProjects: ["IIT 4.0 Framework", "PCI Measurements"], contributionCount: 456,
      openToCollaboration: true, verifiedEmail: true,
    },
    {
      id: "user-5", name: "Dr. Aisha Patel", avatar: "📊", username: "apatel",
      institution: "Oxford", department: "Economics", field: "Economics",
      bio: "Studying how cognitive biases shape technology adoption in academic research. Combining behavioral economics with science of science.",
      location: "Oxford, UK", website: "https://patel.economics.ox.ac.uk", orcid: "0000-0005-6789-0123",
      publications: 45, citations: 2100, hIndex: 24, followers: 890, following: 178,
      isFollowing: true, isFollowedBy: false, joinedAt: now - DAY * 200, lastActiveAt: now - 43200000,
      expertise: ["Behavioral Economics", "AI Adoption", "Decision Making", "Science of Science"],
      recentProjects: ["AI Tool Adoption Survey", "Cognitive Bias in Peer Review"], contributionCount: 178,
      openToCollaboration: true, verifiedEmail: true,
    },
    {
      id: "user-6", name: "Dr. Wei Zhang", avatar: "🔊", username: "wzhang",
      institution: "Tsinghua University", department: "Engineering", field: "Engineering",
      bio: "Designing next-generation acoustic and electromagnetic metamaterials. Achieved broadband acoustic cloaking at room temperature.",
      location: "Beijing, China", website: "https://zhang-metamaterials.tsinghua.edu.cn", orcid: "0000-0006-7890-1234",
      publications: 76, citations: 5670, hIndex: 41, followers: 1567, following: 112,
      isFollowing: true, isFollowedBy: true, joinedAt: now - DAY * 350, lastActiveAt: now - 28800000,
      expertise: ["Metamaterials", "Acoustics", "Photonics", "Wave Physics"],
      recentProjects: ["Acoustic Cloaking Device", "Topological Phononic Crystals"], contributionCount: 289,
      openToCollaboration: false, verifiedEmail: true,
    },
    {
      id: "user-7", name: "Dr. Maria Santos", avatar: "🌍", username: "msantos",
      institution: "ETH Zurich", department: "Environmental Science", field: "Environmental Science",
      bio: "Climate modeling and carbon capture research. Developing novel atmospheric CO2 removal strategies using enhanced mineral weathering.",
      location: "Zurich, Switzerland", website: "https://santos-climate.ethz.ch", orcid: "0000-0007-8901-2345",
      publications: 53, citations: 3200, hIndex: 28, followers: 1023, following: 145,
      isFollowing: false, isFollowedBy: false, joinedAt: now - DAY * 180, lastActiveAt: now - 172800000,
      expertise: ["Climate Modeling", "Carbon Capture", "Mineral Weathering", "Geochemistry"],
      recentProjects: ["Enhanced Weathering Pilot", "Climate Tipping Points"], contributionCount: 198,
      openToCollaboration: true, verifiedEmail: true,
    },
    {
      id: "user-8", name: "Prof. Kenji Tanaka", avatar: "🔬", username: "ktanaka",
      institution: "University of Tokyo", department: "Chemistry", field: "Chemistry",
      bio: "Supramolecular chemistry and self-assembling nanostructures. Creating programmable molecular machines for targeted drug delivery.",
      location: "Tokyo, Japan", website: "https://tanaka-lab.chem.u-tokyo.ac.jp", orcid: "0000-0008-9012-3456",
      publications: 112, citations: 8900, hIndex: 48, followers: 2345, following: 67,
      isFollowing: false, isFollowedBy: false, joinedAt: now - DAY * 450, lastActiveAt: now - 57600000,
      expertise: ["Supramolecular Chemistry", "Nanostructures", "Drug Delivery", "Self-Assembly"],
      recentProjects: ["Molecular Machines v2", "DNA Origami Drug Carriers"], contributionCount: 412,
      openToCollaboration: true, verifiedEmail: true,
    },
  ];

  const activities: FollowActivity[] = [
    { id: generateId(), userId: "user-2", userName: "Prof. James Chen", userAvatar: "🤖", action: "published", targetTitle: "ScienceNAS v3.0 Framework Paper", targetType: "document", timestamp: now - 7200000 },
    { id: generateId(), userId: "user-5", userName: "Dr. Aisha Patel", userAvatar: "📊", action: "released", targetTitle: "AI Adoption Survey Results v2.0", targetType: "release", timestamp: now - 14400000 },
    { id: generateId(), userId: "user-6", userName: "Dr. Wei Zhang", userAvatar: "🔊", action: "starred", targetTitle: "Quantum Coherence in FMO", targetType: "project", timestamp: now - 28800000 },
    { id: generateId(), userId: "user-2", userName: "Prof. James Chen", userAvatar: "🤖", action: "commented", targetTitle: "Best practices for foundation models", targetType: "discussion", timestamp: now - 43200000 },
    { id: generateId(), userId: "user-6", userName: "Dr. Wei Zhang", userAvatar: "🔊", action: "published", targetTitle: "Broadband Acoustic Cloaking at Room Temperature", targetType: "document", timestamp: now - DAY },
    { id: generateId(), userId: "user-5", userName: "Dr. Aisha Patel", userAvatar: "📊", action: "followed", targetTitle: "Dr. Elena Vasquez", targetType: "user", timestamp: now - DAY * 2 },
  ];

  return { profiles, activities };
}
