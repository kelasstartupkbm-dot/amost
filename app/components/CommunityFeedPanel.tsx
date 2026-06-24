"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bike,
  CalendarDays,
  Gift,
  Heart,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  Trophy,
  UserRound,
  X,
} from "lucide-react";

type CurrentUser = {
  id?: number | string | null;
  user_id?: number | string | null;
  userId?: number | string | null;
  role?: string | null;
  role_id?: number | string | null;
  roleId?: number | string | null;
};

type CommunityPost = {
  id: number | string;
  user_id: number | string;
  post_type: string;
  content: string;
  event_id?: number | string | null;
  visibility?: string | null;
  created_at?: string | null;
  author_name?: string | null;
  author_email?: string | null;
  role_label?: string | null;
  like_count?: number | string | null;
  comment_count?: number | string | null;
  viewer_liked?: boolean | null;
  image_data_url?: string | null;
  image_name?: string | null;
  activity_type?: string | null;
  activity_distance_km?: number | string | null;
  activity_duration_minutes?: number | string | null;
  location_text?: string | null;
  location_lat?: number | string | null;
  location_lng?: number | string | null;
};

type CommunityComment = {
  id: number | string;
  post_id: number | string;
  user_id: number | string;
  comment_text: string;
  created_at?: string | null;
  author_name?: string | null;
  author_email?: string | null;
};

type ComposerMode = "post" | "photo" | "activity" | "location";

function getInitials(name: string | null | undefined) {
  const clean = String(name || "AMOST User").trim();
  const words = clean.split(" ").map((item) => item.trim()).filter(Boolean);

  if (words.length === 0) return "A";

  return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
}

function formatRelativeTime(value: string | null | undefined) {
  if (!value) return "Baru saja";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Baru saja";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
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

function normalizeRole(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function getCurrentUserId(user: CurrentUser | null) {
  return Number(user?.id || user?.user_id || user?.userId || 0);
}

function isGlobalAdmin(user: CurrentUser | null) {
  const role = normalizeRole(user?.role);
  const roleId = Number(user?.role_id || user?.roleId || 0);

  return role === "super_admin" || role === "staff_amost" || roleId === 1 || roleId === 2;
}

function canDeletePost(user: CurrentUser | null, post: CommunityPost) {
  const userId = getCurrentUserId(user);
  const ownerId = Number(post.user_id || 0);

  return Boolean(userId && (userId === ownerId || isGlobalAdmin(user)));
}

function getPostIcon(type: string) {
  const clean = String(type || "post").toLowerCase();

  if (clean === "activity") return Bike;
  if (clean === "event") return CalendarDays;
  if (clean === "result") return Trophy;
  if (clean === "doorprize") return Gift;
  if (clean === "official") return ShieldCheck;

  return UserRound;
}

function getTypeLabel(type: string) {
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

  if (type === "activity") return { href: "/account/tracking", label: "Buka Tracking" };
  if (type === "event" && post.event_id) return { href: `/my-events/${post.event_id}`, label: "Detail Event" };
  if (type === "result" && post.event_id) return { href: `/events/${post.event_id}/results`, label: "Lihat Results" };
  if (type === "doorprize" && post.event_id) return { href: `/events/${post.event_id}/doorprize`, label: "Lihat Doorprize" };

  return null;
}

async function resizeImageToDataUrl(file: File) {
  const imageUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Foto belum bisa dibaca."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Foto belum bisa diproses."));
    img.src = imageUrl;
  });

  const maxSize = 1280;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Browser belum bisa memproses foto.");
  }

  ctx.drawImage(image, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", 0.72);

  if (dataUrl.length > 1_800_000) {
    throw new Error("Foto masih terlalu besar. Gunakan foto yang lebih kecil.");
  }

  return dataUrl;
}

export default function CommunityFeedPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [commentsByPostId, setCommentsByPostId] = useState<Record<string, CommunityComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [composerMode, setComposerMode] = useState<ComposerMode>("post");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastActionMessage, setLastActionMessage] = useState("");

  const [imageDataUrl, setImageDataUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [activityType, setActivityType] = useState("cycling");
  const [activityDistanceKm, setActivityDistanceKm] = useState("");
  const [activityDurationMinutes, setActivityDurationMinutes] = useState("");
  const [locationText, setLocationText] = useState("");
  const [locationLat, setLocationLat] = useState("");
  const [locationLng, setLocationLng] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  async function loadCurrentUser() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.ok && data?.user) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function loadPosts(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

    try {
      const response = await fetch(`/api/community/posts?limit=30&_ts=${Date.now()}`, {
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

  async function loadComments(postId: number | string) {
    const key = String(postId);

    setLoadingCommentsPostId(key);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments?_ts=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Komentar belum bisa dimuat.");
        return;
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.items)
          ? data.items
          : [];

      setCommentsByPostId((current) => ({
        ...current,
        [key]: rows,
      }));
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi komentar bermasalah.");
    } finally {
      setLoadingCommentsPostId(null);
    }
  }

  async function toggleComments(postId: number | string) {
    const key = String(postId);

    if (openCommentsPostId === key) {
      setOpenCommentsPostId(null);
      return;
    }

    setOpenCommentsPostId(key);

    if (!commentsByPostId[key]) {
      await loadComments(postId);
    }
  }

  async function submitComment(postId: number | string) {
    const key = String(postId);
    const commentText = String(commentInputs[key] || "").trim();

    if (!commentText) {
      setErrorMessage("Komentar tidak boleh kosong.");
      return;
    }

    setErrorMessage("");
    setLastActionMessage("");

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentText,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Komentar belum bisa dikirim.");
        return;
      }

      setCommentInputs((current) => ({
        ...current,
        [key]: "",
      }));

      await loadComments(postId);
      await loadPosts(true);
      setLastActionMessage("Komentar berhasil dikirim.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi komentar bermasalah.");
    }
  }

  function resetComposerExtras() {
    setImageDataUrl("");
    setImageName("");
    setActivityType("cycling");
    setActivityDistanceKm("");
    setActivityDurationMinutes("");
    setLocationText("");
    setLocationLat("");
    setLocationLng("");
  }

  async function submitPost() {
    const cleanContent = content.trim();

    if (
      !cleanContent &&
      !imageDataUrl &&
      !activityType &&
      !locationText.trim()
    ) {
      setErrorMessage("Isi postingan tidak boleh kosong.");
      return;
    }

    setPosting(true);
    setErrorMessage("");
    setLastActionMessage("");

    const postType =
      composerMode === "activity"
        ? "activity"
        : composerMode === "photo"
          ? "post"
          : composerMode === "location"
            ? "post"
            : "post";

    try {
      const response = await fetch("/api/community/posts", {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postType,
          content: cleanContent,
          imageDataUrl: imageDataUrl || null,
          imageName: imageName || null,
          activityType: composerMode === "activity" ? activityType : null,
          activityDistanceKm:
            composerMode === "activity" && activityDistanceKm
              ? Number(activityDistanceKm)
              : null,
          activityDurationMinutes:
            composerMode === "activity" && activityDurationMinutes
              ? Number(activityDurationMinutes)
              : null,
          locationText: composerMode === "location" ? locationText.trim() : null,
          locationLat:
            composerMode === "location" && locationLat ? Number(locationLat) : null,
          locationLng:
            composerMode === "location" && locationLng ? Number(locationLng) : null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Postingan belum bisa disimpan.");
        return;
      }

      setContent("");
      resetComposerExtras();
      setComposerMode("post");
      setLastActionMessage("Postingan berhasil disimpan ke database.");
      await loadPosts(true);
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi ke server bermasalah.");
    } finally {
      setPosting(false);
    }
  }

  async function deletePost(post: CommunityPost) {
    const confirmed = window.confirm("Hapus postingan ini?");

    if (!confirmed) return;

    setErrorMessage("");
    setLastActionMessage("");

    try {
      const response = await fetch(`/api/community/posts/${post.id}`, {
        method: "DELETE",
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.ok === false) {
        setErrorMessage(data?.message || data?.error || "Postingan belum bisa dihapus.");
        return;
      }

      setPosts((current) => current.filter((item) => String(item.id) !== String(post.id)));
      setLastActionMessage("Postingan berhasil dihapus.");
    } catch (error) {
      console.error(error);
      setErrorMessage("Koneksi hapus postingan bermasalah.");
    }
  }

  async function handlePhotoFile(file: File | null | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("File harus berupa gambar.");
      return;
    }

    setErrorMessage("");
    setLastActionMessage("");

    try {
      const dataUrl = await resizeImageToDataUrl(file);

      setImageDataUrl(dataUrl);
      setImageName(file.name);
      setComposerMode("photo");
      setLastActionMessage("Foto siap diposting.");
    } catch (error: any) {
      setErrorMessage(String(error?.message || error));
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) {
      setErrorMessage("Browser belum mendukung geolocation.");
      return;
    }

    setGeoLoading(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);

        setLocationLat(lat);
        setLocationLng(lng);

        if (!locationText.trim()) {
          setLocationText(`Lokasi saat ini (${lat}, ${lng})`);
        }

        setGeoLoading(false);
      },
      (error) => {
        console.error(error);
        setErrorMessage("Lokasi belum bisa dibaca. Pastikan izin lokasi di browser aktif.");
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  }

  async function toggleLike(post: CommunityPost) {
    const postId = post.id;

    setErrorMessage("");
    setLastActionMessage("");

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

      setLastActionMessage(
        data?.liked
          ? `Like tersimpan. Total like: ${Number(data?.likeCount || 0)}`
          : `Like dibatalkan. Total like: ${Number(data?.likeCount || 0)}`,
      );
    } catch (error) {
      console.error(error);
      await loadPosts(true);
      setErrorMessage("Koneksi ke server bermasalah.");
    }
  }

  useEffect(() => {
    loadCurrentUser();
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
      <section className="rounded-[1.5rem] border border-purple-200 bg-white p-5 shadow-sm">
        <div className="mb-4 rounded-2xl bg-purple-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-purple-700">
          Database Feed Aktif · Foto · Aktivitas · Lokasi · Komentar
        </div>

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

            {imageDataUrl ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <p className="truncate text-xs font-black text-slate-600">
                    {imageName || "Foto"}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setImageDataUrl("");
                      setImageName("");
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-red-600"
                    title="Hapus foto"
                  >
                    <X size={16} />
                  </button>
                </div>
                <img
                  src={imageDataUrl}
                  alt="Preview foto"
                  className="max-h-[280px] w-full object-cover md:max-h-[360px]"
                />
              </div>
            ) : null}

            {composerMode === "activity" ? (
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-purple-100 bg-purple-50 p-4 md:grid-cols-3">
                <label className="text-xs font-black uppercase text-slate-600">
                  Jenis Aktivitas
                  <select
                    value={activityType}
                    onChange={(event) => setActivityType(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="cycling">Cycling</option>
                    <option value="running">Running</option>
                    <option value="walking">Walking</option>
                    <option value="event">Event</option>
                  </select>
                </label>

                <label className="text-xs font-black uppercase text-slate-600">
                  Jarak KM
                  <input
                    value={activityDistanceKm}
                    onChange={(event) => setActivityDistanceKm(event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder="12.50"
                  />
                </label>

                <label className="text-xs font-black uppercase text-slate-600">
                  Durasi Menit
                  <input
                    value={activityDurationMinutes}
                    onChange={(event) => setActivityDurationMinutes(event.target.value)}
                    type="number"
                    min="0"
                    step="1"
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder="45"
                  />
                </label>
              </div>
            ) : null}

            {composerMode === "location" ? (
              <div className="mt-3 rounded-2xl border border-purple-100 bg-purple-50 p-4">
                <label className="text-xs font-black uppercase text-slate-600">
                  Lokasi
                  <input
                    value={locationText}
                    onChange={(event) => setLocationText(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none"
                    placeholder="Contoh: Sokaraja, Purwokerto"
                  />
                </label>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={geoLoading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-purple-700 ring-1 ring-purple-100"
                  >
                    {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin size={16} />}
                    Ambil Lokasi Saat Ini
                  </button>

                  {locationLat && locationLng ? (
                    <span className="text-xs font-bold text-slate-500">
                      {locationLat}, {locationLng}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePhotoFile(event.target.files?.[0])}
                />

                <ComposerButton
                  active={composerMode === "photo" || Boolean(imageDataUrl)}
                  icon={ImageIcon}
                  label="Foto"
                  onClick={() => fileInputRef.current?.click()}
                />

                <ComposerButton
                  active={composerMode === "activity"}
                  icon={Bike}
                  label="Aktivitas"
                  onClick={() => setComposerMode(composerMode === "activity" ? "post" : "activity")}
                />

                <ComposerButton
                  active={composerMode === "location"}
                  icon={MapPin}
                  label="Lokasi"
                  onClick={() => setComposerMode(composerMode === "location" ? "post" : "location")}
                />
              </div>

              <button
                type="button"
                onClick={submitPost}
                disabled={posting || (!content.trim() && !imageDataUrl && !activityType && !locationText.trim())}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-700 px-5 text-sm font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={17} />}
                Post ke Database
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FeedFilter active={activeFilter === "all"} label="Semua" onClick={() => setActiveFilter("all")} />
          <FeedFilter active={activeFilter === "tracking"} label="Tracking" onClick={() => setActiveFilter("tracking")} />
          <FeedFilter active={activeFilter === "events"} label="Events" onClick={() => setActiveFilter("events")} />
          <FeedFilter active={activeFilter === "results"} label="Results" onClick={() => setActiveFilter("results")} />
          <FeedFilter active={activeFilter === "doorprize"} label="Doorprize" onClick={() => setActiveFilter("doorprize")} />
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

      {lastActionMessage ? (
        <section className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          {lastActionMessage}
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </section>
      ) : null}

      {loading ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-purple-700" />
          <p className="mt-4 text-lg font-black text-slate-950">Memuat timeline...</p>
        </section>
      ) : filteredPosts.length === 0 ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-2xl font-black text-slate-950">Belum Ada Postingan</h2>
          <p className="mt-2 text-sm text-slate-500">
            Jadilah yang pertama membagikan update di AMOST Community Feed.
          </p>
        </section>
      ) : (
        filteredPosts.map((post) => {
          const postId = String(post.id);
          const comments = commentsByPostId[postId] || [];

          return (
            <CommunityPostCard
              key={postId}
              post={post}
              canDelete={canDeletePost(currentUser, post)}
              commentsOpen={openCommentsPostId === postId}
              comments={comments}
              commentsLoading={loadingCommentsPostId === postId}
              commentInput={commentInputs[postId] || ""}
              onCommentInputChange={(value) =>
                setCommentInputs((current) => ({
                  ...current,
                  [postId]: value,
                }))
              }
              onLike={() => toggleLike(post)}
              onToggleComments={() => toggleComments(post.id)}
              onSubmitComment={() => submitComment(post.id)}
              onDelete={() => deletePost(post)}
            />
          );
        })
      )}
    </section>
  );
}

function ComposerButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-black ${
        active
          ? "bg-purple-700 text-white"
          : "bg-slate-50 text-slate-600 hover:bg-purple-50 hover:text-purple-700"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
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
  canDelete,
  commentsOpen,
  comments,
  commentsLoading,
  commentInput,
  onCommentInputChange,
  onLike,
  onToggleComments,
  onSubmitComment,
  onDelete,
}: {
  post: CommunityPost;
  canDelete: boolean;
  commentsOpen: boolean;
  comments: CommunityComment[];
  commentsLoading: boolean;
  commentInput: string;
  onCommentInputChange: (value: string) => void;
  onLike: () => void;
  onToggleComments: () => void;
  onSubmitComment: () => void;
  onDelete: () => void;
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

            {canDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-red-50 px-3 text-xs font-black text-red-600 hover:bg-red-100"
                title="Hapus postingan"
              >
                <Trash2 size={15} />
                Hapus
              </button>
            ) : null}
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.25rem] border border-slate-100 bg-slate-50">
            <div className="p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
                <Icon size={24} />
              </div>

              <p className="mt-4 text-xs font-black uppercase tracking-wide text-purple-700">
                {getTypeLabel(post.post_type)}
              </p>

              {post.content ? (
                <p className="mt-2 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-700">
                  {post.content}
                </p>
              ) : null}

              {post.activity_type ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <InfoPill label="Aktivitas" value={String(post.activity_type).toUpperCase()} />
                  <InfoPill label="Jarak" value={`${Number(post.activity_distance_km || 0).toFixed(2)} KM`} />
                  <InfoPill label="Durasi" value={`${Number(post.activity_duration_minutes || 0)} menit`} />
                </div>
              ) : null}

              {post.location_text ? (
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-purple-700" size={18} />
                    <span>{post.location_text}</span>
                  </div>
                  {post.location_lat && post.location_lng ? (
                    <p className="mt-2 text-xs text-slate-400">
                      {post.location_lat}, {post.location_lng}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {action ? (
                <Link
                  href={action.href}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800"
                >
                  {action.label}
                </Link>
              ) : null}
            </div>

            {post.image_data_url ? (
              <img
                src={post.image_data_url}
                alt={post.image_name || "Foto postingan"}
                className="max-h-[320px] w-full object-cover md:max-h-[380px]"
              />
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-sm font-black text-slate-500">
            <button
              type="button"
              onClick={onLike}
              className={`inline-flex items-center gap-2 hover:text-purple-700 ${
                post.viewer_liked ? "text-purple-700" : ""
              }`}
              title="Like dari database"
            >
              <Heart size={18} className={post.viewer_liked ? "fill-current" : ""} />
              {Number(post.like_count || 0)}
            </button>

            <button
              type="button"
              onClick={onToggleComments}
              className={`inline-flex items-center gap-2 hover:text-purple-700 ${
                commentsOpen ? "text-purple-700" : ""
              }`}
            >
              <MessageCircle size={18} />
              {Number(post.comment_count || 0)}
            </button>

            <span className="text-slate-400">
              ID #{String(post.id)} · {String(post.visibility || "public").toUpperCase()}
            </span>
          </div>

          {commentsOpen ? (
            <section className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="space-y-3">
                {commentsLoading ? (
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-700" />
                    Memuat komentar...
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm font-bold text-slate-500">
                    Belum ada komentar. Jadilah yang pertama.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={String(comment.id)} className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                      <p className="text-sm font-black text-slate-950">
                        {comment.author_name || comment.author_email || "AMOST User"}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                        {comment.comment_text}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        {formatRelativeTime(comment.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  value={commentInput}
                  onChange={(event) => onCommentInputChange(event.target.value)}
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-purple-300"
                  placeholder="Tulis komentar..."
                  maxLength={800}
                />
                <button
                  type="button"
                  onClick={onSubmitComment}
                  disabled={!commentInput.trim()}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-purple-700 px-4 text-sm font-black text-white hover:bg-purple-800 disabled:bg-slate-300"
                >
                  Kirim
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-100">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}
