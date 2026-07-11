import { Firestore } from "@google-cloud/firestore";
import fs from "fs";
import path from "path";
import os from "os";
import { buildSeedIssues, SEED_USERS } from "./seed";
import { BADGES, levelForPoints, POINTS } from "./gamification";
import { slaInfo } from "./sla";
import type { Issue, IssueStatus, TimelineEvent, User } from "./types";

let firestore: Firestore;
let useMemoryDb = false;

function hasCredentials(): boolean {
  if (process.env.K_SERVICE || process.env.COMPUTE_ENGINE_METADATA_HOST) {
    return true;
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return true;
  }
  const home = os.homedir();
  const paths = [
    path.join(home, ".config", "gcloud", "application_default_credentials.json"),
    path.join(process.env.APPDATA || "", "gcloud", "application_default_credentials.json"),
  ];
  return paths.some((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

if (!hasCredentials()) {
  useMemoryDb = true;
} else {
  try {
    firestore = new Firestore({
      projectId: process.env.GOOGLE_CLOUD_PROJECT || "civic-pulse-13",
      ignoreUndefinedProperties: true,
    });
  } catch (e) {
    console.warn("Could not initialize Firestore client, using in-memory database:", e);
    useMemoryDb = true;
  }
}

interface MemoryDB {
  issues: Issue[];
  users: User[];
}

let memoryDb: MemoryDB | null = null;

function getMemoryDb(): MemoryDB {
  if (!memoryDb) {
    memoryDb = {
      issues: buildSeedIssues(),
      users: SEED_USERS.map((u) => ({ ...u, badges: [...u.badges] })),
    };
  }
  return memoryDb;
}

declare global {
  // eslint-disable-next-line no-var
  var __CIVICPULSE_VERSION__: number | undefined;
  // eslint-disable-next-line no-var
  var __CIVICPULSE_SEEDED__: boolean | undefined;
}

/** Monotonic data version - bumped whenever issue data changes, used to invalidate caches. */
export function getDataVersion(): number {
  return global.__CIVICPULSE_VERSION__ ?? 0;
}

function bumpVersion() {
  global.__CIVICPULSE_VERSION__ = (global.__CIVICPULSE_VERSION__ ?? 0) + 1;
}

async function ensureDb() {
  if (useMemoryDb) return;
  if (global.__CIVICPULSE_SEEDED__) return;
  
  try {
    const issuesSnapshot = await firestore.collection("issues").limit(1).get();
    if (issuesSnapshot.empty) {
      console.log("Seeding Firestore with initial data...");
      const seedIssues = buildSeedIssues();
      const batch = firestore.batch();
      
      for (const issue of seedIssues) {
        const docRef = firestore.collection("issues").doc(issue.id);
        batch.set(docRef, issue);
      }
      
      for (const user of SEED_USERS) {
        const docRef = firestore.collection("users").doc(user.id);
        batch.set(docRef, { ...user, badges: [...user.badges] });
      }
      
      await batch.commit();
      console.log("Firestore seeding completed.");
    }
    global.__CIVICPULSE_SEEDED__ = true;
  } catch (err) {
    console.log("No local Google Cloud credentials detected. Falling back to in-memory database.");
    useMemoryDb = true;
  }
}

export const CURRENT_USER_ID = "u_you";

export async function listIssues(): Promise<Issue[]> {
  await ensureDb();
  if (useMemoryDb) {
    return [...getMemoryDb().issues].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  const snapshot = await firestore.collection("issues").get();
  const issues: Issue[] = [];
  snapshot.forEach((doc) => {
    issues.push(doc.data() as Issue);
  });
  return issues.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function getIssue(id: string): Promise<Issue | undefined> {
  await ensureDb();
  if (useMemoryDb) {
    return getMemoryDb().issues.find((i) => i.id === id);
  }
  const doc = await firestore.collection("issues").doc(id).get();
  if (!doc.exists) return undefined;
  return doc.data() as Issue;
}

export async function addIssue(issue: Issue): Promise<Issue> {
  await ensureDb();
  if (useMemoryDb) {
    getMemoryDb().issues.unshift(issue);
  } else {
    await firestore.collection("issues").doc(issue.id).set(issue);
  }
  bumpVersion();
  return issue;
}

export async function updateIssue(id: string, patch: Partial<Issue>): Promise<Issue | undefined> {
  await ensureDb();
  if (useMemoryDb) {
    const issue = getMemoryDb().issues.find((i) => i.id === id);
    if (!issue) return undefined;
    Object.assign(issue, patch, { updatedAt: new Date().toISOString() });
    bumpVersion();
    return issue;
  }
  const docRef = firestore.collection("issues").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return undefined;
  
  const issue = doc.data() as Issue;
  Object.assign(issue, patch, { updatedAt: new Date().toISOString() });
  await docRef.set(issue);
  bumpVersion();
  return issue;
}

export async function addTimelineEvent(id: string, event: TimelineEvent): Promise<Issue | undefined> {
  await ensureDb();
  if (useMemoryDb) {
    const issue = getMemoryDb().issues.find((i) => i.id === id);
    if (!issue) return undefined;
    issue.timeline.push(event);
    issue.updatedAt = new Date().toISOString();
    bumpVersion();
    return issue;
  }
  const docRef = firestore.collection("issues").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return undefined;
  
  const issue = doc.data() as Issue;
  issue.timeline.push(event);
  issue.updatedAt = new Date().toISOString();
  await docRef.set(issue);
  bumpVersion();
  return issue;
}

export async function setStatus(id: string, status: IssueStatus, note: string, by = "Municipal Dept."): Promise<Issue | undefined> {
  await ensureDb();
  if (useMemoryDb) {
    const issue = getMemoryDb().issues.find((i) => i.id === id);
    if (!issue) return undefined;
    issue.status = status;
    issue.updatedAt = new Date().toISOString();
    issue.timeline.push({
      id: `t_${Date.now()}`,
      status,
      note,
      at: new Date().toISOString(),
      by,
    });
    if (status === "resolved") {
      const reporter = await getUser(issue.reporterId);
      if (reporter) await awardPoints(reporter.id, POINTS.resolved, { resolved: true });
    }
    bumpVersion();
    return issue;
  }
  const docRef = firestore.collection("issues").doc(id);
  const doc = await docRef.get();
  if (!doc.exists) return undefined;

  const issue = doc.data() as Issue;
  issue.status = status;
  issue.updatedAt = new Date().toISOString();
  issue.timeline.push({
    id: `t_${Date.now()}`,
    status,
    note,
    at: new Date().toISOString(),
    by,
  });
  if (status === "resolved") {
    const reporter = await getUser(issue.reporterId);
    if (reporter) await awardPoints(reporter.id, POINTS.resolved, { resolved: true });
  }
  await docRef.set(issue);
  bumpVersion();
  return issue;
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ---- Users / gamification ----

export async function listUsers(): Promise<User[]> {
  await ensureDb();
  if (useMemoryDb) {
    return [...getMemoryDb().users].sort((a, b) => b.points - a.points);
  }
  const snapshot = await firestore.collection("users").get();
  const users: User[] = [];
  snapshot.forEach((doc) => {
    users.push(doc.data() as User);
  });
  return users.sort((a, b) => b.points - a.points);
}

export async function getUser(id: string): Promise<User | undefined> {
  await ensureDb();
  if (useMemoryDb) {
    return getMemoryDb().users.find((u) => u.id === id);
  }
  const doc = await firestore.collection("users").doc(id).get();
  if (!doc.exists) return undefined;
  return doc.data() as User;
}

export async function awardPoints(
  userId: string,
  points: number,
  opts: { report?: boolean; verify?: boolean; resolved?: boolean } = {},
): Promise<User | undefined> {
  await ensureDb();
  if (useMemoryDb) {
    const user = getMemoryDb().users.find((u) => u.id === userId);
    if (!user) return undefined;
    user.points += points;
    if (opts.report) user.reportsCount += 1;
    if (opts.verify) user.verificationsCount += 1;
    if (opts.resolved) user.resolvedCount += 1;
    user.level = levelForPoints(user.points);
    applyBadges(user);
    return user;
  }
  const docRef = firestore.collection("users").doc(userId);
  const doc = await docRef.get();
  if (!doc.exists) return undefined;
  
  const user = doc.data() as User;
  user.points += points;
  if (opts.report) user.reportsCount += 1;
  if (opts.verify) user.verificationsCount += 1;
  if (opts.resolved) user.resolvedCount += 1;
  user.level = levelForPoints(user.points);
  applyBadges(user);
  await docRef.set(user);
  return user;
}

function applyBadges(user: User) {
  const have = new Set(user.badges.map((b) => b.id));
  const add = (id: keyof typeof BADGES) => {
    if (!have.has(id)) {
      user.badges.push(BADGES[id]);
      have.add(id);
    }
  };
  if (user.reportsCount >= 1) add("first_report");
  if (user.verificationsCount >= 5) add("watchdog");
  if (user.resolvedCount >= 3) add("fixer");
  if (user.level >= 5) add("guardian");
  if (user.points >= 1000) add("hero");
}

export async function communityStats() {
  const issues = await listIssues();
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "resolved").length;
  const inProgress = issues.filter((i) => i.status === "in_progress").length;
  const critical = issues.filter((i) => i.urgency === "critical" && i.status !== "resolved").length;
  const slaBreaches = issues.filter((i) => slaInfo(i).state === "breached").length;
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;
  return { total, resolved, inProgress, critical, slaBreaches, resolutionRate };
}
