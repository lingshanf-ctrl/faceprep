// 练习记录存储 - 使用后端 API + IndexedDB 离线缓存
import { practicesApi, statsApi } from "./api-client";

// 重新导出类型
export interface PracticeRecord {
  id: string;
  questionId: string;
  questionTitle: string;
  answer: string;
  score: number;
  feedback: {
    good: string[];
    improve: string[];
    suggestion: string;
    starAnswer?: string;
  };
  createdAt: string;
}

// IndexedDB 配置（离线缓存）
const DB_NAME = "job-pilot-db";
const DB_VERSION = 1;
const STORE_NAME = "practices";
const SYNC_QUEUE = "sync-queue";

// 打开 IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE)) {
        db.createObjectStore(SYNC_QUEUE, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

// 离线队列操作
async function addToSyncQueue(operation: { type: "create" | "delete"; data: unknown }) {
  const db = await openDB();
  const tx = db.transaction(SYNC_QUEUE, "readwrite");
  const store = tx.objectStore(SYNC_QUEUE);
  await store.add({ ...operation, timestamp: Date.now() });
  db.close();
}

// 获取练习记录列表
export async function getPracticeRecords(options?: {
  limit?: number;
  offset?: number;
}): Promise<PracticeRecord[]> {
  // 先尝试从 API 获取
  const result = await practicesApi.getList(options);

  if (result.data) {
    // 更新本地缓存
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const practice of result.data.practices) {
      await store.put(practice);
    }
    db.close();

    return result.data.practices;
  }

  // 离线时从 IndexedDB 读取
  if (result.offline) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const records = request.result as PracticeRecord[];
        // 按时间排序
        records.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        db.close();
        resolve(records.slice(0, options?.limit || 100));
      };
      request.onerror = () => {
        db.close();
        resolve([]);
      };
    });
  }

  console.error("Failed to fetch practices:", result.error);
  return [];
}

// 保存练习记录
export async function savePracticeRecord(
  record: Omit<PracticeRecord, "id" | "createdAt">
): Promise<PracticeRecord | null> {
  // 先保存到本地缓存
  const newRecord: PracticeRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  // 保存到 IndexedDB
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.put(newRecord);
  db.close();

  // 尝试同步到服务器
  const result = await practicesApi.create({
    questionId: record.questionId,
    answer: record.answer,
    score: record.score,
    feedback: JSON.stringify(record.feedback),
  });

  if (result.offline) {
    // 离线时加入同步队列
    await addToSyncQueue({ type: "create", data: record });
  }

  if (result.data) {
    return result.data.practice;
  }

  // 返回本地记录（即使服务器同步失败）
  return newRecord;
}

// 根据 ID 获取练习记录
export async function getPracticeRecordById(
  id: string
): Promise<PracticeRecord | undefined> {
  // 先查本地缓存
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);

  const record = await new Promise<PracticeRecord | undefined>((resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(undefined);
  });

  db.close();
  return record;
}

// 删除练习记录
export async function deletePracticeRecord(id: string): Promise<void> {
  // 删除本地缓存
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  await store.delete(id);
  db.close();

  // 尝试同步到服务器
  const result = await practicesApi.delete(id);

  if (result.offline) {
    await addToSyncQueue({ type: "delete", data: { id } });
  }
}

// 获取最近记录
export async function getRecentRecords(
  limit: number = 10
): Promise<PracticeRecord[]> {
  return getPracticeRecords({ limit });
}

// 获取某题目的练习记录
export async function getRecordsByQuestionId(
  questionId: string
): Promise<PracticeRecord[]> {
  const result = await practicesApi.getList({ questionId });

  if (result.data) {
    return result.data.practices;
  }

  // 离线时从本地筛选
  const all = await getPracticeRecords();
  return all.filter((r) => r.questionId === questionId);
}

// 获取统计数据
export async function getStats(): Promise<{
  totalPractices: number;
  averageScore: number;
  highestScore: number;
  recentTrend: number[];
}> {
  const result = await statsApi.getStats();

  if (result.data) {
    return {
      totalPractices: result.data.totalPractices,
      averageScore: result.data.averageScore,
      highestScore: result.data.highestScore,
      recentTrend: result.data.recentTrend,
    };
  }

  // 离线时从本地计算
  const records = await getPracticeRecords();

  if (records.length === 0) {
    return {
      totalPractices: 0,
      averageScore: 0,
      highestScore: 0,
      recentTrend: [],
    };
  }

  const scores = records.map((r) => r.score);
  return {
    totalPractices: records.length,
    averageScore: Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    ),
    highestScore: Math.max(...scores),
    recentTrend: records.slice(0, 7).map((r) => r.score).reverse(),
  };
}

// 获取连续练习天数
export async function getStreak(): Promise<number> {
  const result = await statsApi.getStats();

  if (result.data) {
    return result.data.streak;
  }

  // 离线时从本地计算
  const records = await getPracticeRecords();
  if (records.length === 0) return 0;

  const practiceDates = new Set<string>();
  records.forEach((r) => {
    practiceDates.add(new Date(r.createdAt).toDateString());
  });

  const sortedDates = Array.from(practiceDates).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const today = new Date().toDateString();
  const yesterday = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toDateString();

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diffDays = Math.round(
      (current.getTime() - next.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// 导出兼容函数（保持旧 API 兼容）
export function getPracticeRecordsSync(): PracticeRecord[] {
  if (typeof window === "undefined") return [];
  console.warn("getPracticeRecordsSync is deprecated, use getPracticeRecords instead");
  return [];
}

export function savePracticeRecordSync(
  record: Omit<PracticeRecord, "id" | "createdAt">
): PracticeRecord {
  const newRecord: PracticeRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  console.warn("savePracticeRecordSync is deprecated, use savePracticeRecord instead");
  return newRecord;
}
