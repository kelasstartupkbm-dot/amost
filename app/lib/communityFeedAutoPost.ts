import { dbQuery } from "./amostDb";

function pickText(source: any, candidates: string[], fallback = "") {
  for (const key of candidates) {
    const value = source?.[key];

    if (value === null || value === undefined) continue;

    const clean = String(value).trim();

    if (clean) return clean;
  }

  return fallback;
}

function toNumber(value: unknown) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) return null;

  return number;
}

async function getEventRow(eventId: number | string) {
  const result = await dbQuery(
    `
    SELECT *
    FROM events
    WHERE id = $1
    LIMIT 1
    `,
    [eventId],
  );

  return result.rows[0] || null;
}

async function getUserRow(userId: number | string) {
  const result = await dbQuery(
    `
    SELECT *
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

async function communityPostExists(eventId: number | string, userId: number | string, marker: string) {
  const result = await dbQuery(
    `
    SELECT id
    FROM community_posts
    WHERE event_id = $1
      AND user_id = $2
      AND post_type = 'event'
      AND content ILIKE $3
    LIMIT 1
    `,
    [eventId, userId, `%${marker}%`],
  );

  return result.rows.length > 0;
}

export async function createCommunityPost(input: {
  userId: number | string;
  postType?: string;
  content: string;
  eventId?: number | string | null;
}) {
  const userId = toNumber(input.userId);
  const eventId = input.eventId ? toNumber(input.eventId) : null;
  const postType = String(input.postType || "post").trim().toLowerCase();
  const content = String(input.content || "").trim();

  if (!userId || !content) {
    return {
      ok: false,
      skipped: true,
      message: "Community post skipped: invalid user/content.",
    };
  }

  const result = await dbQuery(
    `
    INSERT INTO community_posts (
      user_id,
      post_type,
      content,
      event_id,
      visibility,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, 'public', NOW(), NOW())
    RETURNING id
    `,
    [userId, postType || "post", content, eventId],
  );

  return {
    ok: true,
    skipped: false,
    id: result.rows[0]?.id,
  };
}

export async function createEventJoinFeedPost(input: {
  eventId: number | string;
  userId: number | string;
  participantNumber?: string | null;
}) {
  const eventId = toNumber(input.eventId);
  const userId = toNumber(input.userId);

  if (!eventId || !userId) {
    return {
      ok: false,
      skipped: true,
      message: "Join feed skipped: invalid event/user.",
    };
  }

  const marker = "bergabung di event";
  const exists = await communityPostExists(eventId, userId, marker);

  if (exists) {
    return {
      ok: true,
      skipped: true,
      message: "Join feed already exists.",
    };
  }

  const [eventRow, userRow] = await Promise.all([
    getEventRow(eventId),
    getUserRow(userId),
  ]);

  const eventTitle = pickText(
    eventRow,
    ["title", "name", "event_title", "event_name"],
    `Event #${eventId}`,
  );

  const userName = pickText(
    userRow,
    ["full_name", "fullName", "name", "username", "display_name", "email"],
    `User #${userId}`,
  );

  const participantNumber = String(input.participantNumber || "").trim();

  const content = participantNumber
    ? `${userName} bergabung di event ${eventTitle} dengan nomor peserta ${participantNumber}.`
    : `${userName} bergabung di event ${eventTitle}.`;

  return createCommunityPost({
    userId,
    postType: "event",
    content,
    eventId,
  });
}
