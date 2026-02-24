import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";

// ===== Types =====
export interface Task {
  text: string;
  done: boolean;
  raw: string;
}

export interface KanbanData {
  active: Task[];
  backlog: Task[];
  completed: Task[];
  lastUpdated: string | null;
}

export interface SkillMeta {
  name?: string;
  description?: string;
  version?: string;
}

export interface Skill {
  name: string;
  type: string;
  path: string;
  meta?: SkillMeta;
  description?: string;
  version?: string;
  packageName?: string;
  hasSkillMd?: boolean;
  target?: string;
}

export interface CronJobState {
  lastStatus: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  lastDuration?: number;
  lastError?: string | null;
  consecutiveErrors: number;
}

export interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  sessionTarget?: string;
  payload?: string;
  state: CronJobState;
}

export interface MemorySection {
  title: string;
  items: string[];
}

export interface MemoryData {
  entries: MemorySection[];
  plan: {
    title: string;
    goal: string;
    sections: MemorySection[];
  } | null;
}

export interface ModelInfo {
  id: string;
  name?: string;
  reasoning?: boolean;
  contextWindow?: number;
  maxTokens?: number;
}

export interface ConfigData {
  version?: string;
  lastTouched?: string;
  primaryModel?: string;
  activeModels?: string[];
  models?: ModelInfo[];
  gateway?: {
    port?: number;
    mode?: string;
    bind?: string;
    tailscale?: string;
  };
  channels?: Record<string, { enabled: boolean; streamMode?: string }>;
  plugins?: Record<string, { enabled: boolean }>;
  maxConcurrent?: number;
  subagentModel?: string;
  subagentMaxConcurrent?: number;
}

export interface IdentityData {
  name?: string;
  role?: string;
  vibe?: string;
  coreSkill?: string;
  emoji?: string;
  coreTruths?: Array<{ key: string; value: string }>;
}

export interface SessionData {
  agentIdentity?: string;
  walletAddress?: string;
  acpStatus?: string;
  serviceItem?: string;
  runtime?: string;
  role?: string;
  coreTasks?: string[];
}

export interface LogEntry {
  timestamp: string | null;
  tag: string | null;
  message: string;
  raw: string;
}

export interface OpenClawData {
  agent: { identity: IdentityData; session: SessionData } | null;
  kanban: KanbanData | null;
  skills: Skill[];
  cron: CronJob[];
  memory: MemoryData | null;
  config: ConfigData | null;
  stability: { sections: MemorySection[]; raw: string } | null;
  logs: LogEntry[];
  connected: boolean;
  loading: boolean;
  lastUpdated: Date | null;
  refetch: () => void;
}

const DataContext = createContext<OpenClawData | undefined>(undefined);

const MAX_LOGS = 500;

// Determine API base URL (works for both dev proxy and production)
function getApiBase() {
  return "";
}

function getWsUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  return `${proto}//${host}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Omit<OpenClawData, "refetch">>({
    agent: null,
    kanban: null,
    skills: [],
    cron: [],
    memory: null,
    config: null,
    stability: null,
    logs: [],
    connected: false,
    loading: true,
    lastUpdated: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/all`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!mountedRef.current) return;
      setData(prev => ({
        ...prev,
        agent: json.agent || null,
        kanban: json.kanban || null,
        skills: json.skills || [],
        cron: json.cron || [],
        memory: json.memory || null,
        config: json.config || null,
        stability: json.stability || null,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (err) {
      console.error("Failed to fetch API data:", err);
      if (mountedRef.current) {
        setData(prev => ({ ...prev, loading: false }));
      }
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/logs?count=100`);
      if (!res.ok) return;
      const logs: LogEntry[] = await res.json();
      if (!mountedRef.current) return;
      setData(prev => ({ ...prev, logs }));
    } catch {}
  }, []);

  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setData(prev => ({ ...prev, connected: true }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "log" && msg.data) {
            setData(prev => ({
              ...prev,
              logs: [...prev.logs.slice(-(MAX_LOGS - 1)), msg.data as LogEntry],
            }));
          } else if (msg.type === "data-changed") {
            // Re-fetch all data when files change
            fetchAll();
          }
        } catch {}
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setData(prev => ({ ...prev, connected: false }));
        wsRef.current = null;
        // Reconnect after 3 seconds
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connectWs();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error("WebSocket connection failed:", err);
    }
  }, [fetchAll]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAll();
    fetchLogs();
    connectWs();

    // Periodic refresh every 30s as fallback
    const refreshTimer = setInterval(() => {
      if (mountedRef.current) fetchAll();
    }, 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(refreshTimer);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [fetchAll, fetchLogs, connectWs]);

  return (
    <DataContext.Provider value={{ ...data, refetch: fetchAll }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
