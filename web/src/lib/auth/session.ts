import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";

export const SESSION_COOKIE_NAME = "tercio_session";

export interface Session {
  userId: string;
  userName: string;
}

interface FilesystemSessionRecord {
  userId: string;
  userName: string;
  tokenHash: string;
  tokenIssuedAt: string;
  lastLoginAt: string;
  lastLoginIp?: string | null;
}

const filesystemSessionPath = path.join(process.cwd(), ".demo", "session.json");

export class UnauthorizedError extends Error {
  constructor(message = "No hay sesion activa.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export interface SessionCookie {
  name: string;
  value: string;
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
}

export function generateRecoveryToken() {
  return `tercio_${randomBytes(24).toString("base64url")}`;
}

export function isRecoveryTokenFormat(token: string) {
  return /^tercio_[A-Za-z0-9_-]{32,}$/.test(token);
}

export function hashRecoveryToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function buildSessionCookie(token: string): SessionCookie {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}

export function sessionCookieHeader(cookie: SessionCookie) {
  const parts = [
    `${cookie.name}=${cookie.value}`,
    `Max-Age=${cookie.maxAge}`,
    `Path=${cookie.path}`,
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (cookie.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearSessionCookieHeader() {
  return `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax`;
}

function normalizeIpCandidate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withoutBrackets = trimmed.replace(/^\[|\]$/g, "");
  if (withoutBrackets.includes(":")) return withoutBrackets.toLowerCase();
  return withoutBrackets.replace(/:\d+$/, "");
}

function isPrivateIp(ip: string) {
  const ipv4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const octets = ipv4.slice(1).map(Number);
    if (octets.some((octet) => octet < 0 || octet > 255)) return true;
    const [a, b] = octets;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:");
}

export function getPublicIpFromRequest(request: Request) {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("forwarded"),
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(","))
    .map((value) => value.replace(/^for=/i, ""))
    .map(normalizeIpCandidate)
    .filter((value): value is string => Boolean(value));

  return candidates.find((candidate) => !isPrivateIp(candidate)) ?? null;
}

function hashEquals(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function canUseFilesystemSessionFallback() {
  return process.env.NODE_ENV !== "production" && process.env.TERCIO_DEMO_STORE !== "database";
}

async function readFilesystemSession(): Promise<FilesystemSessionRecord | null> {
  try {
    const raw = await readFile(filesystemSessionPath, "utf8");
    return JSON.parse(raw) as FilesystemSessionRecord;
  } catch {
    return null;
  }
}

async function writeFilesystemSession(record: FilesystemSessionRecord) {
  await mkdir(path.dirname(filesystemSessionPath), { recursive: true });
  await writeFile(filesystemSessionPath, JSON.stringify(record, null, 2));
}

function namesMatch(left: string, right: string) {
  return left.trim().toLocaleLowerCase("es") === right.trim().toLocaleLowerCase("es");
}

export async function createFilesystemSession(name: string, token: string, publicIp?: string | null): Promise<Session> {
  const now = new Date().toISOString();
  const session = {
    userId: "local_demo_user",
    userName: name,
    tokenHash: hashRecoveryToken(token),
    tokenIssuedAt: now,
    lastLoginAt: now,
    lastLoginIp: publicIp ?? null,
  };
  await writeFilesystemSession(session);
  return { userId: session.userId, userName: session.userName };
}

export async function getFilesystemSessionFromToken(token: string | undefined): Promise<Session | null> {
  if (!token || !isRecoveryTokenFormat(token)) return null;

  const record = await readFilesystemSession();
  const tokenHash = hashRecoveryToken(token);
  if (!record || !hashEquals(record.tokenHash, tokenHash)) return null;

  await writeFilesystemSession({ ...record, lastLoginAt: new Date().toISOString() });
  return { userId: record.userId, userName: record.userName };
}

export async function recoverFilesystemSessionByIp(
  name: string | undefined,
  publicIp: string,
  token: string,
): Promise<Session | null> {
  const record = await readFilesystemSession();
  if (!record || record.lastLoginIp !== publicIp) return null;
  if (name?.trim() && !namesMatch(record.userName, name)) return null;

  const now = new Date().toISOString();
  await writeFilesystemSession({
    ...record,
    tokenHash: hashRecoveryToken(token),
    tokenIssuedAt: now,
    lastLoginAt: now,
    lastLoginIp: publicIp,
  });
  return { userId: record.userId, userName: record.userName };
}

export async function getSessionFromToken(token: string | undefined): Promise<Session | null> {
  if (!token || !isRecoveryTokenFormat(token)) return null;
  const tokenHash = hashRecoveryToken(token);
  try {
    const db = getDb();
    const user = await db.user.findUnique({
      where: { tokenHash },
      select: { id: true, name: true, tokenHash: true },
    });

    if (!user || !hashEquals(user.tokenHash, tokenHash)) return null;
    return { userId: user.id, userName: user.name };
  } catch (error) {
    if (!canUseFilesystemSessionFallback()) throw error;
    return getFilesystemSessionFromToken(token);
  }
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  return getSessionFromToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireApiSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
