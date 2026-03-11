/**
 * FavoritesContext - Global favorites/bookmarks system
 * Allows saving documents, segments, research papers, and other items
 */

import React, { useState, useCallback, useEffect, createContext, useContext } from "react";

// Favorite item types
export type FavoriteType = "document" | "segment" | "paper" | "author" | "collection" | "search";

export interface FavoriteItem {
  id: string;
  type: FavoriteType;
  title: string;
  description?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  tags?: string[];
}

// Context type
interface FavoritesContextType {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, "id" | "createdAt">) => string;
  removeFavorite: (id: string) => void;
  isFavorite: (itemId: string, type: FavoriteType) => boolean;
  toggleFavorite: (item: Omit<FavoriteItem, "id" | "createdAt">) => boolean;
  getFavoritesByType: (type: FavoriteType) => FavoriteItem[];
  updateFavorite: (id: string, updates: Partial<FavoriteItem>) => void;
  clearFavorites: (type?: FavoriteType) => void;
  searchFavorites: (query: string) => FavoriteItem[];
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

// Local storage key
const STORAGE_KEY = "app_favorites";

// Generate unique ID
const generateId = () => `fav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Provider props
interface FavoritesProviderProps {
  children: React.ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const items = parsed.map((item: FavoriteItem) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        setFavorites(items);
      }
    } catch (error) {
      console.error("Failed to load favorites:", error);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error("Failed to save favorites:", error);
    }
  }, [favorites]);

  // Add a new favorite
  const addFavorite = useCallback((item: Omit<FavoriteItem, "id" | "createdAt">): string => {
    const id = generateId();
    const newItem: FavoriteItem = {
      ...item,
      id,
      createdAt: new Date(),
    };
    setFavorites((prev) => [newItem, ...prev]);
    return id;
  }, []);

  // Remove a favorite
  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Check if item is favorited (by matching metadata.originalId or title)
  const isFavorite = useCallback(
    (itemId: string, type: FavoriteType): boolean => {
      return favorites.some(
        (f) => f.type === type && (f.metadata?.originalId === itemId || f.id === itemId)
      );
    },
    [favorites]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (item: Omit<FavoriteItem, "id" | "createdAt">): boolean => {
      const existing = favorites.find(
        (f) =>
          f.type === item.type &&
          (f.metadata?.originalId === item.metadata?.originalId || f.title === item.title)
      );

      if (existing) {
        removeFavorite(existing.id);
        return false;
      } else {
        addFavorite(item);
        return true;
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  // Get favorites by type
  const getFavoritesByType = useCallback(
    (type: FavoriteType): FavoriteItem[] => {
      return favorites.filter((f) => f.type === type);
    },
    [favorites]
  );

  // Update a favorite
  const updateFavorite = useCallback((id: string, updates: Partial<FavoriteItem>) => {
    setFavorites((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  // Clear favorites
  const clearFavorites = useCallback((type?: FavoriteType) => {
    if (type) {
      setFavorites((prev) => prev.filter((f) => f.type !== type));
    } else {
      setFavorites([]);
    }
  }, []);

  // Search favorites
  const searchFavorites = useCallback(
    (query: string): FavoriteItem[] => {
      const lowerQuery = query.toLowerCase();
      return favorites.filter(
        (f) =>
          f.title.toLowerCase().includes(lowerQuery) ||
          f.description?.toLowerCase().includes(lowerQuery) ||
          f.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
      );
    },
    [favorites]
  );

  // Add tag to favorite
  const addTag = useCallback((id: string, tag: string) => {
    setFavorites((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const tags = f.tags || [];
          if (!tags.includes(tag)) {
            return { ...f, tags: [...tags, tag] };
          }
        }
        return f;
      })
    );
  }, []);

  // Remove tag from favorite
  const removeTag = useCallback((id: string, tag: string) => {
    setFavorites((prev) =>
      prev.map((f) => {
        if (f.id === id && f.tags) {
          return { ...f, tags: f.tags.filter((t) => t !== tag) };
        }
        return f;
      })
    );
  }, []);

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        getFavoritesByType,
        updateFavorite,
        clearFavorites,
        searchFavorites,
        addTag,
        removeTag,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

// Hook to use favorites
export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};

// Favorite button component
interface FavoriteButtonProps {
  item: Omit<FavoriteItem, "id" | "createdAt">;
  size?: "small" | "medium" | "large";
  showLabel?: boolean;
  style?: React.CSSProperties;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  item,
  size = "medium",
  showLabel = false,
  style,
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const originalId = item.metadata?.originalId as string | undefined;
  const isActive = isFavorite(originalId || item.title, item.type);

  const sizes = {
    small: { fontSize: "14px", padding: "4px" },
    medium: { fontSize: "18px", padding: "6px" },
    large: { fontSize: "24px", padding: "8px" },
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item);
  };

  return (
    <button
      onClick={handleClick}
      title={isActive ? "Remove from favorites" : "Add to favorites"}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: isActive ? "#f59e0b" : "#71717a",
        transition: "all 0.2s ease",
        ...sizes[size],
        ...style,
      }}
    >
      <span style={{ transform: isActive ? "scale(1.1)" : "scale(1)", transition: "transform 0.2s ease" }}>
        {isActive ? "★" : "☆"}
      </span>
      {showLabel && (
        <span style={{ fontSize: "12px" }}>
          {isActive ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
};

// Favorites panel component
interface FavoritesPanelProps {
  type?: FavoriteType;
  onItemClick?: (item: FavoriteItem) => void;
  style?: React.CSSProperties;
}

export const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  type,
  onItemClick,
  style,
}) => {
  const { favorites, getFavoritesByType, removeFavorite, searchFavorites } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState<FavoriteType | "all">(type || "all");

  const displayedFavorites = searchQuery
    ? searchFavorites(searchQuery)
    : activeType === "all"
    ? favorites
    : getFavoritesByType(activeType);

  const typeIcons: Record<FavoriteType, string> = {
    document: "📄",
    segment: "📝",
    paper: "📑",
    author: "👤",
    collection: "📁",
    search: "🔍",
  };

  const types: FavoriteType[] = ["document", "segment", "paper", "author", "collection", "search"];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #1e1e2e 0%, #181825 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <span style={{ fontSize: "18px" }}>⭐</span>
          <span style={{ fontWeight: 600, color: "#eaeaea" }}>Favorites</span>
          <span
            style={{
              marginLeft: "auto",
              background: "rgba(255, 255, 255, 0.08)",
              padding: "2px 8px",
              borderRadius: "10px",
              fontSize: "12px",
              color: "#a1a1aa",
            }}
          >
            {displayedFavorites.length}
          </span>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search favorites..."
          style={{
            width: "100%",
            padding: "8px 12px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "6px",
            color: "#eaeaea",
            fontSize: "13px",
            outline: "none",
          }}
        />

        {/* Type filter */}
        {!type && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setActiveType("all")}
              style={{
                padding: "4px 10px",
                background: activeType === "all" ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                border: activeType === "all" ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                borderRadius: "4px",
                fontSize: "11px",
                color: activeType === "all" ? "#a5b4fc" : "#71717a",
                cursor: "pointer",
              }}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                style={{
                  padding: "4px 10px",
                  background: activeType === t ? "rgba(99, 102, 241, 0.2)" : "rgba(255, 255, 255, 0.05)",
                  border: activeType === t ? "1px solid rgba(99, 102, 241, 0.4)" : "1px solid transparent",
                  borderRadius: "4px",
                  fontSize: "11px",
                  color: activeType === t ? "#a5b4fc" : "#71717a",
                  cursor: "pointer",
                }}
              >
                {typeIcons[t]} {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items list */}
      <div style={{ maxHeight: "400px", overflowY: "auto", padding: "8px" }}>
        {displayedFavorites.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "#52525b",
              fontSize: "14px",
            }}
          >
            {searchQuery ? "No matching favorites" : "No favorites yet"}
          </div>
        ) : (
          displayedFavorites.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                marginBottom: "4px",
                cursor: onItemClick ? "pointer" : "default",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                background: "rgba(255, 255, 255, 0.02)",
                transition: "background 0.15s ease",
              }}
            >
              <span style={{ fontSize: "18px" }}>{typeIcons[item.type]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#eaeaea",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </div>
                {item.description && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#71717a",
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.description}
                  </div>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "6px", flexWrap: "wrap" }}>
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          padding: "2px 6px",
                          background: "rgba(99, 102, 241, 0.15)",
                          borderRadius: "4px",
                          fontSize: "10px",
                          color: "#a5b4fc",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFavorite(item.id);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#f59e0b",
                  cursor: "pointer",
                  padding: "4px",
                  fontSize: "14px",
                }}
                title="Remove from favorites"
              >
                ★
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FavoritesProvider;
