import { useEffect, useState } from "react";
import {
  getLogBuffer,
  onLogUpdate,
  readAppLogText,
  getAppLogPath,
  logInfo,
  logWarn,
} from "@/lib/logger";

export default function DebugConsole() {
  const [memLogs, setMemLogs] = useState<string[]>([]);
  const [fileLogs, setFileLogs] = useState<string>("");
  const [logFilePath, setLogFilePath] = useState<string>("");

  useEffect(() => {
    setMemLogs(getLogBuffer());
    const unsubscribe = onLogUpdate((lines) => setMemLogs(lines));
    logInfo("[debug] Enter DebugConsole");
    getAppLogPath().then((p) => p && setLogFilePath(p));
    return unsubscribe;
  }, []);

  async function refreshFileLogs() {
    const text = await readAppLogText();
    if (text) {
      setFileLogs(text);
      logInfo("[debug] Loaded app.log", { bytes: text.length });
    } else {
      setFileLogs("(无法读取 app.log，可能不在桌面环境或插件未启用)");
      logWarn("[debug] app.log not readable");
    }
  }

  async function copyMemLogs() {
    const text = memLogs.join("\n");
    await navigator.clipboard.writeText(text);
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Debug Console</h2>
      <div style={{ marginBottom: 12 }}>
        <button onClick={refreshFileLogs} style={{ marginRight: 8 }}>
          刷新持久化日志
        </button>
        <button onClick={copyMemLogs}>复制内存日志</button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <strong>日志文件路径：</strong>
        <span>{logFilePath || "(未知)"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <h3>内存日志（最近 {memLogs.length} 条）</h3>
          <pre
            style={{
              background: "#121212",
              color: "#d9d9d9",
              padding: 12,
              borderRadius: 6,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            {memLogs.join("\n")}
          </pre>
        </div>
        <div>
          <h3>持久化日志文件（app.log）</h3>
          <pre
            style={{
              background: "#121212",
              color: "#d9d9d9",
              padding: 12,
              borderRadius: 6,
              maxHeight: 400,
              overflow: "auto",
            }}
          >
            {fileLogs}
          </pre>
        </div>
      </div>
    </div>
  );
}