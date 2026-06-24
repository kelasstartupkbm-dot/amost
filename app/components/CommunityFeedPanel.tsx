"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import Link from "next/link";
import {
  Bike,
  CalendarDays,
  Gift,
  Heart,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  RefreshCw,
  Send,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";

type CommunityPost = {
  id: number | string;
  user_id: number | string;
  post_type: "post" | "activity" | "event" | "result" | "doorprize" | "official" | string;
  content: string;
  event_id?: number | string | null;
  visibility?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  author_name?: string | null;
  author_email?: string | null;
  role_label?: string | null;
  like_count?: number | string | null;
  comment_count?: number | string | null;
  viewer_liked?: boolean | null;
};

function getInitials(name: string | null | undefined) {
  const clean = String(name || "AMOST User").trim();

  if (!clean) return "A";

  const words = clean
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Baru saja";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Baru saja";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getPostIcon(type: string): ElementType {
  const clean = String(type || "post").toLowerCase();

  if (clean === "activity") return Bike;
  if (clean === "event") return CalendarDays;
  if (clean === "result") return Trophy;
  if (clean === "doorprize") return Gift;
  if (clean === "official") return ShieldCheck;

  return UserRound;
}

function getPostTypeLabel(type: string) {
  const clean = String(type || "post").toLowerCase();

  if (clean === "activity") return "Tracking";
  if (clean === "event") return "Event";
  if (clean === "result") return "Results";
  if (clean === "doorprize") return "Doorprize";
  if (clean === "official") return "Official";

  return "Post";
}

function getAction(post: CommunityPost) {
  const type = String(post.post_type || "post").toLowerCase();

  if (type === "activity") {
    return {
      href: "/account/tracking",
      label: "Buka Tracking",
    };
  }

  if (type === "event" && post.event_id) {
    return {
      href: `/my-events/${post.event_id}`,
      label: "Detail Event",
    };
  }

  if (type === "result" && post.event_id) {
    return {
      href: `/events/${post.event_id}/results`,
      label: "Lihat Results",
    };
  }

  if (type === "doorprize" && post.event_id) {
    return {
      href: `/events/${post.event_id}/doorprize`,
      label: "Lihat Doorprize",
    };
  }

  return null;
}

export default function CommunityFeedPanel() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [content, setContent] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPosts(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const response = await fetch("/api/community/posts?limit=30", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Timeline belum bisa dimuat.");
        setPosts([]);
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setPosts(rows);
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function submitPost() {
    const cleanContent = content.trim();

    if (!cleanContent) {
      setErrorMessage("Isi postingan tidak boleh kosong.");
      return;
    }

    setPosting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postType: "post",
          content: cleanContent,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Postingan belum bisa disimpan.");
        return;
      }

      setContent("");
      await loadPosts(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(post: CommunityPost) {
    const postId = post.id;

    setPosts((currentPosts) =>
      currentPosts.map((item) => {
        if (String(item.id) !== String(postId)) return item;

        const wasLiked = Boolean(item.viewer_liked);
        const currentLikeCount = Number(item.like_count || 0);

        return {
          ...item,
          viewer_liked: !wasLiked,
          like_count: wasLiked
            ? Math.max(0, currentLikeCount - 1)
            : currentLikeCount + 1,
        };
      }),
    );

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        await loadPosts(true);
        setErrorMessage(data?.message || data?.error || "Like belum bisa diproses.");
        return;
      }

      setPosts((currentPosts) =>
        currentPosts.map((item) => {
          if (String(item.id) !== String(postId)) return item;

          return {
            ...item,
            viewer_liked: Boolean(data?.liked),
            like_count: Number(data?.likeCount || 0),
          };
        }),
      );
    } catch (error) {
      console.error(error);
      await loadPosts(true);
      setErrorMessage("Koneksi ke server bermasalah.");
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeFilter === "all") return posts;

    return posts.filter((post) => {
      const clean = String(post.post_type || "post").toLowerCase();

      if (activeFilter === "tracking") return clean === "activity";
      if (activeFilter === "events") return clean === "event";
      if (activeFilter === "results") return clean === "result";
      if (activeFilter === "doorprize") return clean === "doorprize";

      return true;
    });
  }, [posts, activeFilter]);

  return (
    <section className="space-y-5">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
            A
          </div>

          <div className="min-w-0 flex-1">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[86px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 focus:border-purple-300 focus:bg-white"
              placeholder="Bagikan update aktivitasmu, progress latihan, atau pengalaman event..."
              maxLength={2000}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <MiniAction label="Foto" />
                <MiniAction label="Aktivitas" />
                <MiniAction label="Lokasi" />
              </div>

              <button
                type="button"
                onClick={submitPost}
                disabled={posting || !content.trim()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
                Post
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FeedFilter
            active={activeFilter === "all"}
            label="Semua"
            onClick={() => setActiveFilter("all")}
          />
          <FeedFilter
            active={activeFilter === "tracking"}
            label="Tracking"
            onClick={() => setActiveFilter("tracking")}
          />
          <FeedFilter
            active={activeFilter === "events"}
            label="Events"
            onClick={() => setActiveFilter("events")}
          />
          <FeedFilter
            active={activeFilter === "results"}
            label="Results"
            onClick={() => setActiveFilter("results")}
          />
          <FeedFilter
            active={activeFilter === "doorprize"}
            label="Doorprize"
            onClick={() => setActiveFilter("doorprize")}
          />
        </div>

        <button
          type="button"
          onClick={() => loadPosts(true)}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-70"
        >
          <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
          Refresh Feed
        </button>
      </section>

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black text-slate-950">
            Memuat timeline...
          </p>
        </section>
      ) : filteredPosts.length === 0 ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-2xl font-black text-slate-950">
            Belum Ada Postingan
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Jadilah yang pertama membagikan update di AMOST Community Feed.
          </p>
        </section>
      ) : (
        filteredPosts.map((post) => (
          <CommunityPostCard
            key={String(post.id)}
            post={post}
            onLike={() => toggleLike(post)}
          />
        ))
      )}
    </section>
  );
}

function MiniAction({ label }: { label: string }) {
  return (
    <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
      {label}
    </span>
  );
}

function FeedFilter({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide ${
        active
          ? "bg-purple-700 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function CommunityPostCard({
  post,
  onLike,
}: {
  post: CommunityPost;
  onLike: () => void;
}) {
  const Icon = getPostIcon(post.post_type);
  const initials = getInitials(post.author_name || post.author_email);
  const action = getAction(post);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-700 text-sm font-black text-white">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">
                {post.author_name || post.author_email || "AMOST User"}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {post.role_label || "Umum"} • {formatRelativeTime(post.created_at)}
              </p>
            </div>

            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50"
              title="Menu"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="mt-4 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
              <Icon size={24} />
            </div>

            <p className="mt-4 text-xs font-black uppercase tracking-wide text-purple-700">
              {getPostTypeLabel(post.post_type)}
            </p>

            <p className="mt-2 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-700">
              {post.content}
            </p>

            {action ? (
              <Link
                href={action.href}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
              >
                {action.label}
              </Link>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-sm font-black text-slate-500">
            <button
              type="button"
              onClick={onLike}
              className={`inline-flex items-center gap-2 hover:text-purple-700 ${
                post.viewer_liked ? "text-purple-700" : ""
              }`}
            >
              <Heart size={18} className={post.viewer_liked ? "fill-current" : ""} />
              {Number(post.like_count || 0)}
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 hover:text-purple-700"
              title="Komentar akan dibuka pada tahap berikutnya"
            >
              <MessageCircle size={18} />
              {Number(post.comment_count || 0)}
            </button>

            <span className="text-slate-400">
              {String(post.visibility || "public").toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
