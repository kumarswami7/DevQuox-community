import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Plus,
  Globe2,
  X,
  Loader2,
  MessageSquare,
  HelpCircle,
  BookOpen,
  Sparkles,
  Users,
  Briefcase,
  ShieldAlert,
  Tag,
  RefreshCw,
  Flame,
  Clock,
  Compass,
  Lightbulb,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { CommunityCard } from "../components/cards/CommunityCard";
import { PostCard } from "../components/community/PostCard";
import { PostComposer } from "../components/community/PostComposer";
import { ModerationQueueModal } from "../components/community/ModerationQueueModal";
import { communityService } from "../services/communityService";
import { useAuthStore } from "../store";
import { useSearchParams } from "react-router-dom";
const guildCategories = ["All Hubs", "MERN Stack", "Artificial Intelligence", "UI/UX", "DevOps"];
const FEED_TYPES = [
  { type: "all", label: "All Posts", icon: Compass },
  { type: "idea", label: "Project Ideas & Pitches", icon: Lightbulb },
  { type: "question", label: "Questions", icon: HelpCircle },
  { type: "knowledge", label: "Tutorials", icon: BookOpen },
  { type: "showcase", label: "Showcase", icon: Sparkles },
  { type: "collaboration", label: "Team-ups", icon: Users },
  { type: "career", label: "Opportunities", icon: Briefcase },
  { type: "general", label: "Discussions", icon: MessageSquare }
];
export const CommunitiesPage = () => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?._id || currentUser?.id;
  const isModerator = currentUser?.role === "admin" || currentUser?.role === "moderator";
  const [activeTab, setActiveTab] = useState("feed");
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [sortOrder, setSortOrder] = useState("latest");
  const [selectedPostType, setSelectedPostType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [popularTags, setPopularTags] = useState([]);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isModQueueOpen, setIsModQueueOpen] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [guildsLoading, setGuildsLoading] = useState(false);
  const [selectedGuildCategory, setSelectedGuildCategory] = useState("All Hubs");
  const [guildSearchQuery, setGuildSearchQuery] = useState("");
  const [isCreateGuildOpen, setIsCreateGuildOpen] = useState(false);
  const [newGuildTitle, setNewGuildTitle] = useState("");
  const [newGuildDesc, setNewGuildDesc] = useState("");
  const [newGuildCat, setNewGuildCat] = useState("Web Dev");
  const [searchParams] = useSearchParams();

  // Sync with RightSidebar query parameter clicks
  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (typeParam && typeParam !== selectedPostType) {
      setSelectedPostType(typeParam);
      setActiveTab("feed");
    }
    const guildParam = searchParams.get("guild");
    if (guildParam && guildParam !== selectedGuildCategory) {
      setSelectedGuildCategory(guildParam);
      setActiveTab("feed");
    }
    const tagParam = searchParams.get("tag");
    if (tagParam !== null && tagParam !== activeTag) {
      setActiveTag(tagParam);
      setActiveTab("feed");
    }
    const qParam = searchParams.get("q");
    if (qParam !== null && qParam !== searchQuery) {
      setSearchQuery(qParam);
    }
  }, [searchParams]);
  const loadFeed = useCallback(
    async (resetPage = false) => {
      const targetPage = resetPage ? 1 : page;
      if (resetPage) {
        setFeedLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }
      setFeedError(null);
      try {
        const res = await communityService.getFeed({
          page: targetPage,
          limit: 10,
          sort: sortOrder,
          postType: selectedPostType !== "all" ? selectedPostType : void 0,
          tag: activeTag || void 0,
          q: searchQuery.trim() || void 0
        });
        if (res.data?.data) {
          if (resetPage) {
            setPosts(res.data.data);
          } else {
            setPosts((prev) => [...prev, ...res.data.data]);
          }
          setHasMore(res.data.pagination?.hasMore || false);
        }
      } catch (err) {
        setFeedError("Failed to load community discussions.");
      } finally {
        setFeedLoading(false);
        setLoadingMore(false);
      }
    },
    [page, sortOrder, selectedPostType, activeTag, searchQuery]
  );
  const loadPopularTags = async () => {
    try {
      const res = await communityService.getPopularTags();
      if (res.data?.data) {
        setPopularTags(res.data.data);
      }
    } catch {
    }
  };
  useEffect(() => {
    loadFeed(true);
    loadPopularTags();
  }, [sortOrder, selectedPostType, activeTag]);
  useEffect(() => {
    if (activeTab === "guilds" && communities.length === 0) {
      const fetchGuilds = async () => {
        setGuildsLoading(true);
        try {
          const res = await communityService.getCommunities();
          if (res.data && Array.isArray(res.data)) {
            setCommunities(res.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setGuildsLoading(false);
        }
      };
      fetchGuilds();
    }
  }, [activeTab]);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadFeed(true);
  };
  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
    setIsComposerOpen(false);
  };
  const handlePostUpdated = (updated) => {
    setPosts(posts.map((p) => p._id === updated._id ? updated : p));
  };
  const handlePostDeleted = (postId) => {
    setPosts(posts.filter((p) => p._id !== postId));
  };
  const handleCreateGuild = async (e) => {
    e.preventDefault();
    if (!newGuildTitle.trim()) return;
    try {
      const created = await communityService.createCommunity({
        name: newGuildTitle.trim(),
        description: newGuildDesc.trim() || "Community hub for developers and creators.",
        categories: [newGuildCat.trim() || "Web Dev"],
        icon: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=200",
        banner: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800"
      });
      if (created.data) {
        const commData = created.data.data || created.data;
        setCommunities([commData, ...communities]);
      }
      setIsCreateGuildOpen(false);
      setNewGuildTitle("");
      setNewGuildDesc("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create engineering circle.");
    }
  };
  const filteredCommunities = communities.filter((comm) => {
    const matchesSearch = comm.name.toLowerCase().includes(guildSearchQuery.toLowerCase()) || comm.description.toLowerCase().includes(guildSearchQuery.toLowerCase());
    const matchesCat = selectedGuildCategory === "All Hubs" || comm.name.toLowerCase().includes(selectedGuildCategory.toLowerCase()) || (comm.categories || []).some(
      (c) => c.toLowerCase().includes(selectedGuildCategory.toLowerCase())
    );
    return matchesSearch && matchesCat;
  });
  return <div className="space-y-6">{
    /* Page Header */
  }<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Community Hub & Knowledge Feed
            </h1><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-500/10 text-primary-500 border border-primary-500/20">
              Phase 8 Active
            </span></div><p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discuss technical challenges, ask questions, share tutorials, showcase projects, and connect with peers.
          </p></div><div className="flex items-center gap-2">{isModerator && <Button
    onClick={() => setIsModQueueOpen(true)}
    variant="outline"
    size="sm"
    className="gap-1.5 text-rose-500 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
  ><ShieldAlert className="w-4 h-4" /><span>Moderation</span></Button>}{activeTab === "feed" ? <Button
    onClick={() => setIsComposerOpen(true)}
    variant="primary"
    size="sm"
    className="gap-2 shadow-glow-primary"
  ><Plus className="w-4 h-4" /><span>Create Post</span></Button> : <Button
    onClick={() => setIsCreateGuildOpen(true)}
    variant="primary"
    size="sm"
    className="gap-2 shadow-glow-primary"
  ><Plus className="w-4 h-4" /><span>Create Circle</span></Button>}</div></div>{
    /* Main Tabs Navigation */
  }<div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800"><button
    onClick={() => setActiveTab("feed")}
    className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "feed" ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
  ><MessageSquare className="w-4 h-4" /><span>Discussions & Feed</span></button><button
    onClick={() => setActiveTab("guilds")}
    className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${activeTab === "guilds" ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
  ><Globe2 className="w-4 h-4" /><span>Tech Guilds & Hubs</span></button></div>{
    /* ────────────────── FEED TAB CONTENT ────────────────── */
  }{activeTab === "feed" && <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">{
    /* Main Feed Column (3 cols) */
  }<div className="lg:col-span-3 space-y-5">{
    /* Search & Sort Toolbar */
  }<div className="bg-white dark:bg-cardDark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5 shadow-sm"><form onSubmit={handleSearchSubmit} className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input
    type="text"
    placeholder="Search discussions, questions, or tags (e.g. react, websockets)..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
  />{searchQuery && <button
    type="button"
    onClick={() => {
      setSearchQuery("");
      loadFeed(true);
    }}
    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
  ><X className="w-4 h-4" /></button>}<button
    type="submit"
    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600"
  >
                  Search
                </button></form>{
    /* Sort pills */
  }<div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-850"><div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"><span className="text-xs font-semibold text-slate-400 mr-1 hidden sm:inline">
                    Sort:
                  </span>{[
    { id: "latest", label: "Latest", icon: Clock },
    { id: "trending", label: "Trending", icon: Flame },
    { id: "popular", label: "Most Discussed", icon: MessageSquare },
    { id: "unanswered", label: "Unanswered Q&A", icon: HelpCircle }
  ].map((s) => {
    const Icon = s.icon;
    const isSelected = sortOrder === s.id;
    return <button
      key={s.id}
      type="button"
      onClick={() => setSortOrder(s.id)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${isSelected ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm" : "bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
    ><Icon className="w-3.5 h-3.5" />{s.label}</button>;
  })}</div>{activeTag && <div className="flex items-center gap-1.5 text-xs text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-lg border border-primary-200 dark:border-primary-800"><span>Filtering by: #{activeTag}</span><button onClick={() => setActiveTag(null)} className="hover:text-primary-800"><X className="w-3.5 h-3.5" /></button></div>}</div>{
    /* Topic Filter Chips */
  }<div className="flex items-center gap-1.5 overflow-x-auto pb-1">{FEED_TYPES.map((t) => {
    const Icon = t.icon;
    const isSelected = selectedPostType === t.type;
    return <button
      key={t.type}
      type="button"
      onClick={() => setSelectedPostType(t.type)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${isSelected ? "bg-primary-500 text-white border-primary-500 shadow-sm" : "bg-white dark:bg-cardDark border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"}`}
    ><Icon className="w-3.5 h-3.5" />{t.label}</button>;
  })}</div></div>{
    /* Post Composer Modal / Inline */
  }{isComposerOpen && <PostComposer
    onPostCreated={handlePostCreated}
    onCancel={() => setIsComposerOpen(false)}
  />}{
    /* Feed List */
  }{feedLoading ? <div className="flex flex-col items-center justify-center py-20 space-y-3"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /><p className="text-sm text-slate-500 font-medium">
                  Loading community discussions...
                </p></div> : feedError ? <div className="text-center py-12 p-6 bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"><p className="text-sm text-rose-500 font-semibold">{feedError}</p><Button size="sm" variant="outline" onClick={() => loadFeed(true)}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Try Again
                </Button></div> : posts.length === 0 ? <div className="text-center py-16 p-8 bg-white dark:bg-cardDark rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"><MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" /><h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No discussions found
                </h3><p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Be the first to share an insight, ask a question, or showcase your project to the Devquox community!
                </p><Button size="sm" variant="primary" onClick={() => setIsComposerOpen(true)}>
                  Create the First Post
                </Button></div> : <div className="space-y-4">{posts.map((post) => <PostCard
    key={post._id}
    post={post}
    currentUserId={currentUserId}
    currentUserRole={currentUser?.role}
    onPostUpdated={handlePostUpdated}
    onPostDeleted={handlePostDeleted}
  />)}{
    /* Load More Button */
  }{hasMore && <div className="flex justify-center pt-4"><Button
    variant="outline"
    size="sm"
    onClick={() => setPage((p) => p + 1)}
    isLoading={loadingMore}
  >
                      Load More Posts
                    </Button></div>}</div>}</div>{
    /* Right Sidebar: Popular Tags, Guidelines, Community Stats */
  }<div className="space-y-5">{
    /* Popular Tags Box */
  }<div className="bg-white dark:bg-cardDark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"><div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"><Tag className="w-4 h-4 text-primary-500" /><span>Trending Tags</span></div>{popularTags.length === 0 ? <p className="text-xs text-slate-400">No tags active yet.</p> : <div className="flex flex-wrap gap-1.5">{popularTags.map((t, idx) => {
    const tagName = t.name || t.tag || t._id;
    return <button
      key={tagName || `tag-${idx}`}
      onClick={() => setActiveTag(activeTag === tagName ? null : tagName)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${activeTag === tagName ? "bg-primary-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
    ><span>#{tagName}</span><span className="text-[10px] opacity-70">({t.count})</span></button>;
  })}</div>}</div>{
    /* Community Guidelines Card */
  }<div className="bg-gradient-to-br from-primary-500/10 via-primary-500/5 to-transparent p-4 rounded-2xl border border-primary-500/20 space-y-2"><h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                Devquox Community Code
              </h4><ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside"><li>Be respectful, helpful, and kind.</li><li>Share authentic projects and code.</li><li>No spam, scamming, or aggressive self-promo.</li><li>Report violations to keep discussions safe.</li></ul></div></div></div>}{
    /* ────────────────── GUILDS TAB CONTENT ────────────────── */
  }{activeTab === "guilds" && <div className="space-y-6">{
    /* Category Pills Bar */
  }<div className="flex items-center gap-2 overflow-x-auto pb-1">{guildCategories.map((cat, idx) => <button
    key={cat || `cat-${idx}`}
    onClick={() => setSelectedGuildCategory(cat)}
    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${selectedGuildCategory === cat ? "bg-primary-500 text-white shadow-sm shadow-primary-500/25" : "bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}
  >{cat}</button>)}</div>{
    /* Search Toolbar */
  }<div className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/70 dark:bg-cardDark/70 glass-card"><div className="relative w-full"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input
    type="text"
    value={guildSearchQuery}
    onChange={(e) => setGuildSearchQuery(e.target.value)}
    placeholder="Search circles by topic, technology, or keywords..."
    className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-primary-500"
  /></div></div>{
    /* Communities Grid */
  }{guildsLoading ? <div className="flex flex-col items-center justify-center py-20 space-y-3"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /><p className="text-sm text-slate-500 font-medium">Fetching community circles...</p></div> : filteredCommunities.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">{filteredCommunities.map((community) => <CommunityCard
    key={community.id || community._id}
    community={community}
  />)}</div> : <div className="text-center py-16 space-y-3 glass-card rounded-2xl p-8"><p className="text-sm font-semibold text-slate-500">
                No circles found matching your search.
              </p><Button
    onClick={() => {
      setGuildSearchQuery("");
      setSelectedGuildCategory("All Hubs");
    }}
    variant="outline"
    size="sm"
  >
                Clear Filters
              </Button></div>}{
    /* Create Guild Modal */
  }{isCreateGuildOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"><div className="bg-white dark:bg-cardDark border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4"><button
    onClick={() => setIsCreateGuildOpen(false)}
    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
  ><X className="w-5 h-5" /></button><h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Create Engineering Circle
                </h3><form onSubmit={handleCreateGuild} className="space-y-3"><div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Circle Name
                    </label><input
    type="text"
    required
    placeholder="e.g. Next.js Architects"
    value={newGuildTitle}
    onChange={(e) => setNewGuildTitle(e.target.value)}
    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 mt-1"
  /></div><div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Description
                    </label><textarea
    rows={3}
    placeholder="What is this circle about?"
    value={newGuildDesc}
    onChange={(e) => setNewGuildDesc(e.target.value)}
    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 mt-1"
  /></div><div><label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Primary Technology
                    </label><input
    type="text"
    placeholder="e.g. Next.js, GraphQL"
    value={newGuildCat}
    onChange={(e) => setNewGuildCat(e.target.value)}
    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 mt-1"
  /></div><div className="flex justify-end gap-2 pt-2"><Button
    type="button"
    variant="ghost"
    size="sm"
    onClick={() => setIsCreateGuildOpen(false)}
  >
                      Cancel
                    </Button><Button type="submit" variant="primary" size="sm">
                      Create Circle
                    </Button></div></form></div></div>}</div>}{
    /* Moderation Queue Modal for Admins/Moderators */
  }{isModQueueOpen && <ModerationQueueModal isOpen={isModQueueOpen} onClose={() => setIsModQueueOpen(false)} />}</div>;
};
export default CommunitiesPage;
