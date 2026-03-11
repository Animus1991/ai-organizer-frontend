import { useReducer } from 'react';

// State interface for the home reducer
export interface HomeState {
  // Document management
  documentId: string | null;
  selectedUpload: any | null;
  file: File | null;
  fileError: string | null;
  
  // Segmentation
  segments: any[];
  openSeg: any | null;
  mode: string;
  modeFilter: string;
  keywords: string[];
  concepts: string[];
  keywordInput: string;
  conceptInput: string;
  status: string;
  
  // Search
  searchOpen: boolean;
  query: string;
  copied: string;
  
  // UI State
  expandedSections: {
    core: boolean;
    analytics: boolean;
    management: boolean;
    admin: boolean;
  };
  
  // Loading states
  loading: {
    document: boolean;
    segmentation: boolean;
    upload: boolean;
    search: boolean;
  };
  
  // User preferences
  preferences: {
    compactMode: boolean;
    showTour: boolean;
    autoRefresh: boolean;
  };
}

// Action types
export type HomeAction =
  | { type: 'SET_DOCUMENT'; payload: string | null }
  | { type: 'SET_SELECTED_UPLOAD'; payload: any | null }
  | { type: 'SET_FILE'; payload: File | null }
  | { type: 'SET_FILE_ERROR'; payload: string | null }
  | { type: 'SET_SEGMENTS'; payload: any[] }
  | { type: 'SET_OPEN_SEG'; payload: any | null }
  | { type: 'SET_MODE'; payload: string }
  | { type: 'SET_MODE_FILTER'; payload: string }
  | { type: 'SET_KEYWORDS'; payload: string[] }
  | { type: 'SET_CONCEPTS'; payload: string[] }
  | { type: 'SET_KEYWORD_INPUT'; payload: string }
  | { type: 'SET_CONCEPT_INPUT'; payload: string }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_SEARCH_OPEN'; payload: boolean }
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_COPIED'; payload: string }
  | { type: 'TOGGLE_SECTION'; payload: keyof HomeState['expandedSections'] }
  | { type: 'SET_LOADING'; payload: { key: keyof HomeState['loading']; value: boolean } }
  | { type: 'SET_PREFERENCES'; payload: Partial<HomeState['preferences']> }
  | { type: 'RESET_STATE' };

// Initial state
export const initialHomeState: HomeState = {
  documentId: null,
  selectedUpload: null,
  file: null,
  fileError: null,
  segments: [],
  openSeg: null,
  mode: 'qa',
  modeFilter: 'all',
  keywords: [],
  concepts: [],
  keywordInput: '',
  conceptInput: '',
  status: '',
  searchOpen: false,
  query: '',
  copied: '',
  expandedSections: {
    core: true,
    analytics: false,
    management: false,
    admin: false,
  },
  loading: {
    document: false,
    segmentation: false,
    upload: false,
    search: false,
  },
  preferences: {
    compactMode: false,
    showTour: false,
    autoRefresh: true,
  },
};

// Reducer function
export const homeReducer = (state: HomeState, action: HomeAction): HomeState => {
  switch (action.type) {
    case 'SET_DOCUMENT':
      return { ...state, documentId: action.payload };
    
    case 'SET_SELECTED_UPLOAD':
      return { ...state, selectedUpload: action.payload };
    
    case 'SET_FILE':
      return { ...state, file: action.payload, fileError: null };
    
    case 'SET_FILE_ERROR':
      return { ...state, fileError: action.payload };
    
    case 'SET_SEGMENTS':
      return { ...state, segments: action.payload };
    
    case 'SET_OPEN_SEG':
      return { ...state, openSeg: action.payload };
    
    case 'SET_MODE':
      return { ...state, mode: action.payload };
    
    case 'SET_MODE_FILTER':
      return { ...state, modeFilter: action.payload };
    
    case 'SET_KEYWORDS':
      return { ...state, keywords: action.payload };
    
    case 'SET_CONCEPTS':
      return { ...state, concepts: action.payload };
    
    case 'SET_KEYWORD_INPUT':
      return { ...state, keywordInput: action.payload };
    
    case 'SET_CONCEPT_INPUT':
      return { ...state, conceptInput: action.payload };
    
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    
    case 'SET_SEARCH_OPEN':
      return { ...state, searchOpen: action.payload };
    
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    
    case 'SET_COPIED':
      return { ...state, copied: action.payload };
    
    case 'TOGGLE_SECTION':
      return {
        ...state,
        expandedSections: {
          ...state.expandedSections,
          [action.payload]: !state.expandedSections[action.payload],
        },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    
    case 'SET_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };
    
    case 'RESET_STATE':
      return initialHomeState;
    
    default:
      return state;
  }
};

// Custom hook for using the home reducer
export const useHomeReducer = () => {
  const [state, dispatch] = useReducer(homeReducer, initialHomeState);
  
  // Action creators for common operations
  const actions = {
    setDocument: (documentId: string | null) => 
      dispatch({ type: 'SET_DOCUMENT', payload: documentId }),
    
    setSelectedUpload: (upload: any | null) => 
      dispatch({ type: 'SET_SELECTED_UPLOAD', payload: upload }),
    
    setFile: (file: File | null) => 
      dispatch({ type: 'SET_FILE', payload: file }),
    
    setFileError: (error: string | null) => 
      dispatch({ type: 'SET_FILE_ERROR', payload: error || '' }),
    
    setSegments: (segments: any[]) => 
      dispatch({ type: 'SET_SEGMENTS', payload: segments }),
    
    setOpenSeg: (segment: any | null) => 
      dispatch({ type: 'SET_OPEN_SEG', payload: segment }),
    
    setMode: (mode: string) => 
      dispatch({ type: 'SET_MODE', payload: mode }),
    
    setModeFilter: (filter: string) => 
      dispatch({ type: 'SET_MODE_FILTER', payload: filter }),
    
    setKeywords: (keywords: string[]) => 
      dispatch({ type: 'SET_KEYWORDS', payload: keywords }),
    
    setConcepts: (concepts: string[]) => 
      dispatch({ type: 'SET_CONCEPTS', payload: concepts }),
    
    setKeywordInput: (input: string) => 
      dispatch({ type: 'SET_KEYWORD_INPUT', payload: input }),
    
    setConceptInput: (input: string) => 
      dispatch({ type: 'SET_CONCEPT_INPUT', payload: input }),
    
    setStatus: (status: string) => 
      dispatch({ type: 'SET_STATUS', payload: status }),
    
    setSearchOpen: (open: boolean) => 
      dispatch({ type: 'SET_SEARCH_OPEN', payload: open }),
    
    setQuery: (query: string) => 
      dispatch({ type: 'SET_QUERY', payload: query }),
    
    setCopied: (copied: string) => 
      dispatch({ type: 'SET_COPIED', payload: copied }),
    
    toggleSection: (section: keyof HomeState['expandedSections']) => 
      dispatch({ type: 'TOGGLE_SECTION', payload: section }),
    
    setLoading: (key: keyof HomeState['loading'], value: boolean) => 
      dispatch({ type: 'SET_LOADING', payload: { key, value } }),
    
    setPreferences: (preferences: Partial<HomeState['preferences']>) => 
      dispatch({ type: 'SET_PREFERENCES', payload: preferences }),
    
    resetState: () => 
      dispatch({ type: 'RESET_STATE' }),
  };
  
  return { state, actions };
};

export default useHomeReducer;
