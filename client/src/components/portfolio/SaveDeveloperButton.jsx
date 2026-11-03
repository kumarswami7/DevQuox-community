import React, { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { discoveryService } from "../../services/discoveryService";
import { useAuthStore } from "../../store";
import { Button } from "../ui/Button";

export const SaveDeveloperButton = ({
  developerId,
  initialSaved = false,
  variant = "outline",
  size = "sm",
  showLabel = true,
  className = "",
  onToggle,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const handleToggle = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!isAuthenticated || !developerId) return;

    setLoading(true);
    try {
      if (isSaved) {
        await discoveryService.unbookmarkDeveloper(developerId);
        setIsSaved(false);
        if (onToggle) onToggle(false);
      } else {
        await discoveryService.bookmarkDeveloper(developerId);
        setIsSaved(true);
        if (onToggle) onToggle(true);
      }
    } catch (err) {
      console.error("Failed to toggle developer bookmark:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Button
      size={size}
      variant={isSaved ? "primary" : variant}
      onClick={handleToggle}
      disabled={loading}
      className={`gap-1.5 transition-all ${
        isSaved
          ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
          : "hover:text-amber-500"
      } ${className}`}
      title={isSaved ? "Remove from Saved" : "Save Developer"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isSaved ? (
        <BookmarkCheck className="w-3.5 h-3.5 fill-current" />
      ) : (
        <Bookmark className="w-3.5 h-3.5" />
      )}
      {showLabel && <span>{isSaved ? "Saved" : "Save"}</span>}
    </Button>
  );
};

export default SaveDeveloperButton;
