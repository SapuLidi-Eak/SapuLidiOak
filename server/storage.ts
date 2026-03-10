import {
  admins,
  keys,
  logs,
  showcase,
  packages,
  type Admin,
  type InsertAdmin,
  type Key,
  type InsertKey,
  type Log,
  type InsertLog,
  type Showcase,
  type InsertShowcase,
  type Package,
  type InsertPackage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, gte, and, sql, like, or } from "drizzle-orm";

export interface IStorage {
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdminPassword(id: number, passwordHash: string): Promise<Admin | undefined>;

  getAllKeys(): Promise<Key[]>;
  getKeysPaginated(limit: number, offset: number, filters?: { status?: string; search?: string }): Promise<Key[]>;
  getKeysTotal(filters?: { status?: string; search?: string }): Promise<number>;
  getKey(id: number): Promise<Key | undefined>;
  getKeyByCode(keyCode: string): Promise<Key | undefined>;
  createKey(key: InsertKey & { keyCode: string }): Promise<Key>;
  createKeys(keysData: (InsertKey & { keyCode: string })[]): Promise<Key[]>;
  updateKey(id: number, data: Partial<Key>): Promise<Key | undefined>;
  deleteKey(id: number): Promise<boolean>;
  incrementKeyExecution(id: number): Promise<Key | undefined>;

  createLog(log: InsertLog): Promise<Log>;
  getRecentLogs(limit: number): Promise<(Log & { key?: Key })[]>;

  getDashboardStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    unusedKeys: number;
    totalRevenue: string;
    recentActivations: (Log & { key?: Key })[];
    chartData: { date: string; activations: number }[];
  }>;

  getRevenueStats(): Promise<{
    totalRevenue: string;
    monthlyRevenue: string;
    weeklyRevenue: string;
    todayRevenue: string;
    revenueByDuration: { duration: string; revenue: number; count: number }[];
    transactions: {
      id: number;
      keyCode: string;
      price: string;
      durationMonths: number;
      createdAt: string;
    }[];
  }>;

  updateExpiredKeys(): Promise<void>;

  resetKeyHwid(keyCode: string): Promise<Key | undefined>;

  getAllShowcase(): Promise<Showcase[]>;
  getShowcase(id: number): Promise<Showcase | undefined>;
  createShowcase(data: InsertShowcase): Promise<Showcase>;
  updateShowcase(id: number, data: Partial<Showcase>): Promise<Showcase | undefined>;
  deleteShowcase(id: number): Promise<boolean>;
  incrementShowcaseView(id: number): Promise<Showcase | undefined>;
  incrementShowcaseLike(id: number): Promise<Showcase | undefined>;
  incrementShowcaseTip(id: number): Promise<Showcase | undefined>;

  getAllPackages(): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  createPackage(data: InsertPackage): Promise<Package>;
  updatePackage(id: number, data: Partial<Package>): Promise<Package | undefined>;
  deletePackage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const [created] = await db.insert(admins).values(admin).returning();
    return created;
  }

  async updateAdminPassword(
    id: number,
    passwordHash: string
  ): Promise<Admin | undefined> {
    const [updated] = await db
      .update(admins)
      .set({ passwordHash })
      .where(eq(admins.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllKeys(): Promise<Key[]> {
    return db.select().from(keys).orderBy(desc(keys.createdAt));
  }

  private buildKeysFilter(filters?: { status?: string; search?: string }) {
    const conditions = [];
    if (filters?.status && filters.status !== "all") {
      conditions.push(eq(keys.status, filters.status as Key["status"]));
    }
    if (filters?.search?.trim()) {
      const term = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          like(keys.keyCode, term),
          like(keys.notes, term),
          like(keys.robloxUsername, term)
        )!
      );
    }
    return conditions.length ? and(...conditions) : undefined;
  }

  async getKeysPaginated(
    limit: number,
    offset: number,
    filters?: { status?: string; search?: string }
  ): Promise<Key[]> {
    const where = this.buildKeysFilter(filters);
    const query = db
      .select()
      .from(keys)
      .orderBy(desc(keys.createdAt))
      .limit(limit)
      .offset(offset);
    if (where) {
      return query.where(where);
    }
    return query;
  }

  async getKeysTotal(filters?: { status?: string; search?: string }): Promise<number> {
    const where = this.buildKeysFilter(filters);
    const query = db.select({ count: sql<number>`count(*)::int` }).from(keys);
    const result = where ? await query.where(where) : await query;
    return result[0]?.count ?? 0;
  }

  async getKey(id: number): Promise<Key | undefined> {
    const [key] = await db.select().from(keys).where(eq(keys.id, id));
    return key || undefined;
  }

  async getKeyByCode(keyCode: string): Promise<Key | undefined> {
    const [key] = await db
      .select()
      .from(keys)
      .where(eq(keys.keyCode, keyCode));
    return key || undefined;
  }

  async createKey(keyData: InsertKey & { keyCode: string }): Promise<Key> {
    const [created] = await db.insert(keys).values(keyData).returning();
    return created;
  }

  async createKeys(
    keysData: (InsertKey & { keyCode: string })[]
  ): Promise<Key[]> {
    if (keysData.length === 0) return [];
    return db.insert(keys).values(keysData).returning();
  }

  async updateKey(id: number, data: Partial<Key>): Promise<Key | undefined> {
    const [updated] = await db
      .update(keys)
      .set(data)
      .where(eq(keys.id, id))
      .returning();
    return updated || undefined;
  }

  async incrementKeyExecution(id: number): Promise<Key | undefined> {
    const [updated] = await db
      .update(keys)
      .set({ executionCount: sql`${keys.executionCount} + 1` })
      .where(eq(keys.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteKey(id: number): Promise<boolean> {
    await db.delete(logs).where(eq(logs.keyId, id));

    const result = await db
      .delete(keys)
      .where(eq(keys.id, id))
      .returning();

    return result.length > 0;
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [created] = await db.insert(logs).values(log).returning();
    return created;
  }

  async getRecentLogs(
    limit: number
  ): Promise<(Log & { key?: Key })[]> {
    const result = await db
      .select()
      .from(logs)
      .leftJoin(keys, eq(logs.keyId, keys.id))
      .orderBy(desc(logs.timestamp))
      .limit(limit);

    return result.map((row) => ({
      ...row.logs,
      key: row.keys || undefined,
    }));
  }

  async getDashboardStats() {
    await this.updateExpiredKeys();

    const allKeys = await db.select().from(keys);

    const totalKeys = allKeys.length;
    const activeKeys = allKeys.filter((k) => k.status === "active").length;
    const expiredKeys = allKeys.filter((k) => k.status === "expired").length;
    const unusedKeys = allKeys.filter((k) => k.status === "unused").length;

    const totalRevenue = allKeys
      .reduce((sum, k) => sum + parseFloat(k.price), 0)
      .toFixed(2);

    const recentActivations = await this.getRecentLogs(10);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activationsLogs = await db
      .select()
      .from(logs)
      .where(
        and(
          eq(logs.action, "activated"),
          gte(logs.timestamp, thirtyDaysAgo)
        )
      );

    const chartDataMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      chartDataMap.set(dateStr, 0);
    }

    activationsLogs.forEach((log) => {
      const dateStr = new Date(log.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (chartDataMap.has(dateStr)) {
        chartDataMap.set(
          dateStr,
          (chartDataMap.get(dateStr) || 0) + 1
        );
      }
    });

    const chartData = Array.from(chartDataMap.entries())
      .map(([date, activations]) => ({ date, activations }))
      .reverse();

    return {
      totalKeys,
      activeKeys,
      expiredKeys,
      unusedKeys,
      totalRevenue,
      recentActivations,
      chartData,
    };
  }

  async getRevenueStats() {
    const allKeys = await db.select().from(keys);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const totalRevenue = allKeys
      .reduce((sum, k) => sum + parseFloat(k.price), 0)
      .toFixed(2);

    const monthlyRevenue = allKeys
      .filter((k) => new Date(k.createdAt) >= startOfMonth)
      .reduce((sum, k) => sum + parseFloat(k.price), 0)
      .toFixed(2);

    const weeklyRevenue = allKeys
      .filter((k) => new Date(k.createdAt) >= startOfWeek)
      .reduce((sum, k) => sum + parseFloat(k.price), 0)
      .toFixed(2);

    const todayRevenue = allKeys
      .filter((k) => new Date(k.createdAt) >= startOfDay)
      .reduce((sum, k) => sum + parseFloat(k.price), 0)
      .toFixed(2);

    const durationGroups = new Map<
      number,
      { revenue: number; count: number }
    >();

    allKeys.forEach((key) => {
      const existing =
        durationGroups.get(key.durationMonths) || {
          revenue: 0,
          count: 0,
        };
      durationGroups.set(key.durationMonths, {
        revenue: existing.revenue + parseFloat(key.price),
        count: existing.count + 1,
      });
    });

    const revenueByDuration = Array.from(durationGroups.entries())
      .map(([months, data]) => ({
        duration: `${months}M`,
        revenue: data.revenue,
        count: data.count,
      }))
      .sort((a, b) => parseInt(a.duration) - parseInt(b.duration));

    const transactions = allKeys
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )
      .slice(0, 20)
      .map((k) => ({
        id: k.id,
        keyCode: k.keyCode,
        price: k.price,
        durationMonths: k.durationMonths,
        createdAt: k.createdAt.toISOString(),
      }));

    return {
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      todayRevenue,
      revenueByDuration,
      transactions,
    };
  }

  async updateExpiredKeys(): Promise<void> {
    const now = new Date();
    await db
      .update(keys)
      .set({ status: "expired" })
      .where(
        and(
          eq(keys.status, "active"),
          sql`${keys.expiresAt} < ${now}`
        )
      );
  }

  // ✅ METHOD YANG DIMINTA
  async resetKeyHwid(keyCode: string): Promise<Key | undefined> {
    const [updated] = await db
      .update(keys)
      .set({
        hwid: null,
      })
      .where(eq(keys.keyCode, keyCode))
      .returning();

    return updated || undefined;
  }

  async getAllShowcase(): Promise<Showcase[]> {
    return db
      .select()
      .from(showcase)
      .orderBy(asc(showcase.sortOrder), asc(showcase.id));
  }

  async getShowcase(id: number): Promise<Showcase | undefined> {
    const [row] = await db.select().from(showcase).where(eq(showcase.id, id));
    return row || undefined;
  }

  async createShowcase(data: InsertShowcase): Promise<Showcase> {
    const [created] = await db.insert(showcase).values(data).returning();
    return created;
  }

  async updateShowcase(id: number, data: Partial<Showcase>): Promise<Showcase | undefined> {
    const [updated] = await db
      .update(showcase)
      .set(data)
      .where(eq(showcase.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteShowcase(id: number): Promise<boolean> {
    const result = await db.delete(showcase).where(eq(showcase.id, id)).returning();
    return result.length > 0;
  }

  async incrementShowcaseView(id: number): Promise<Showcase | undefined> {
    const [updated] = await db
      .update(showcase)
      .set({ viewCount: sql`${showcase.viewCount} + 1` })
      .where(eq(showcase.id, id))
      .returning();
    return updated || undefined;
  }

  async incrementShowcaseLike(id: number): Promise<Showcase | undefined> {
    const [updated] = await db
      .update(showcase)
      .set({ likeCount: sql`${showcase.likeCount} + 1` })
      .where(eq(showcase.id, id))
      .returning();
    return updated || undefined;
  }

  async incrementShowcaseTip(id: number): Promise<Showcase | undefined> {
    const [updated] = await db
      .update(showcase)
      .set({ tipCount: sql`${showcase.tipCount} + 1` })
      .where(eq(showcase.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllPackages(): Promise<Package[]> {
    return db
      .select()
      .from(packages)
      .orderBy(asc(packages.sortOrder), asc(packages.id));
  }

  async getPackage(id: number): Promise<Package | undefined> {
    const [row] = await db.select().from(packages).where(eq(packages.id, id));
    return row || undefined;
  }

  async createPackage(data: InsertPackage): Promise<Package> {
    const [created] = await db.insert(packages).values(data).returning();
    return created;
  }

  async updatePackage(id: number, data: Partial<Package>): Promise<Package | undefined> {
    const [updated] = await db
      .update(packages)
      .set(data)
      .where(eq(packages.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePackage(id: number): Promise<boolean> {
    const result = await db.delete(packages).where(eq(packages.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
