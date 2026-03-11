import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useFavorites } from "../../context/FavoritesContext";
import { Star } from "lucide-react";

export function StarredDocsList() {
  const nav = useNavigate();
  const { t } = useLanguage();
  const { getFavoritesByType } = useFavorites();
  const starredDocs = getFavoritesByType("document");

  return (
    <div className="bg-card border border-border rounded-xl p-5 flex-1 flex flex-col transition-shadow duration-300 hover:shadow-lg">
      <h3 className="m-0 mb-4 text-[15px] font-semibold text-foreground flex items-center gap-2">
        <Star className="w-4 h-4 text-warning" />
        {t("profile.starredDocs") || "Starred Documents"} ({starredDocs.length})
      </h3>
      {starredDocs.length === 0 ? (
        <div className="py-6 text-center text-muted-foreground text-sm flex-1 flex items-center justify-center">
          {t("profile.noStarred") || "No starred documents yet. Star documents from the home page."}
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
          {starredDocs.slice(0, 20).map((doc, i) => (
            <button
              key={doc.id}
              onClick={() => {
                const docId = doc.metadata?.documentId;
                if (docId) nav(`/documents/${docId}`);
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border bg-muted/20 text-foreground cursor-pointer text-left w-full text-sm
                transition-all duration-200 ease-out
                hover:bg-primary/5 hover:border-primary/25 hover:shadow-sm hover:-translate-x-0.5
                group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Star className="w-3.5 h-3.5 text-warning fill-warning flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap transition-colors duration-200 group-hover:text-primary">{doc.title}</span>
              <span className="text-[11px] text-muted-foreground flex-shrink-0">
                {new Date(doc.createdAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
