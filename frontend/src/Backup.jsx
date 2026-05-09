import { useState, useEffect } from "react";
import {
  Database, Upload, Download, Server, CheckCircle, XCircle, Loader,
  RefreshCw
} from "lucide-react";
import "./backup.css";

function api(url, opts = {}) {
  const token = sessionStorage.getItem("token");
  return fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then(async (r) => {
    if (!r.ok) throw new Error((await r.json()).error || "Request failed");
    return r.json();
  });
}

export default function Backup({ year }) {
  const [status, setStatus] = useState({});
  const [ftpStatus, setFtpStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const [ftpLoading, setFtpLoading] = useState(false);
  const [ftpFiles, setFtpFiles] = useState([]);
  const [showFtpFiles, setShowFtpFiles] = useState(false);

  const loadStatus = () => {
    api("/api/backup/status").then(setStatus).catch((e) => setMsg(e.message));
    api("/api/ftp/status")
      .then(setFtpStatus)
      .catch(() => setFtpStatus({ configured: false }));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  async function downloadLocal(selected = year) {
    const data = await api("/api/backup/download?year=" + selected);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `school-backup-${selected}-encrypted.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function uploadToServer() {
    setFtpLoading(true);
    setMsg("");
    try {
      const r = await api("/api/ftp/upload", {
        method: "POST",
        body: JSON.stringify({ year }),
      });
      setMsg(`Uploaded to FTP server: ${r.filename}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setFtpLoading(false);
    }
  }

  async function listServerFiles() {
    setFtpLoading(true);
    setMsg("");
    try {
      const r = await api("/api/ftp/list");
      setFtpFiles(r.files || []);
      setShowFtpFiles(true);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setFtpLoading(false);
    }
  }

  async function downloadFromServer(filename) {
    setFtpLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/ftp/download?filename=${encodeURIComponent(filename)}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setMsg(`Downloaded ${filename}`);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setFtpLoading(false);
    }
  }

  async function restoreFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!confirm("Restore this backup into database? Existing matching records may be updated.")) return;
    const text = await f.text();
    const payload = JSON.parse(text);
    const r = await api("/api/backup/upload", { method: "POST", body: JSON.stringify(payload) });
    setMsg(r.ok ? "Encrypted backup uploaded/restored successfully." : "Restore completed.");
  }

  return (
    <div className="backupPage">
      <h2><Database size={20} /> Backup & Restore — {year}</h2>
      {msg && <div className="infoMsg">{msg}</div>}

      {/* FTP Server Card */}
      <div className="backupCard driveCard">
        <div className="driveHeader">
          <div className="driveIconWrap"><Server size={24} /></div>
          <div className="driveInfo">
            <h3>FTP Server Backup</h3>
            <p>
              {ftpStatus?.configured
                ? `Server: ${ftpStatus.address}:${ftpStatus.port || 21}`
                : "FTP not configured. Add FTP_ADDRESS, FTP_PORT, FTP_USERNAME and FTP_PASSWORD in Railway."}
            </p>
          </div>
          <div className="driveActions">
            {ftpStatus?.configured ? (
              <>
                <button
                  className="btnPrimary"
                  onClick={uploadToServer}
                  disabled={ftpLoading}
                  style={{ marginRight: 8 }}
                >
                  {ftpLoading ? <Loader size={14} className="spin" /> : <Upload size={14} />}
                  {ftpLoading ? "Uploading..." : "Upload to Server"}
                </button>
                <button
                  className="btnSecondary"
                  onClick={listServerFiles}
                  disabled={ftpLoading}
                >
                  {ftpLoading ? <Loader size={14} className="spin" /> : <Download size={14} />}
                  {ftpLoading ? "Loading..." : "Download from Server"}
                </button>
              </>
            ) : (
              <span className="badgeGray">Not Configured</span>
            )}
          </div>
        </div>

        {/* FTP File List */}
        {showFtpFiles && ftpFiles.length > 0 && (
          <div className="ftpFileList" style={{ marginTop: 16, padding: 12, background: "#f8f9fa", borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 8px 0" }}>Available Backups on Server</h4>
            {ftpFiles.map((file) => (
              <div key={file.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e9ecef" }}>
                <span>{file.name} <small style={{ color: "#666" }}>({(file.size / 1024).toFixed(1)} KB)</small></span>
                <button className="btnOutline" onClick={() => downloadFromServer(file.name)}>
                  <Download size={14} /> Download
                </button>
              </div>
            ))}
            <button className="btnSecondary" onClick={() => setShowFtpFiles(false)} style={{ marginTop: 8 }}>
              Close List
            </button>
          </div>
        )}
        {showFtpFiles && ftpFiles.length === 0 && (
          <div style={{ marginTop: 16, padding: 12, color: "#666" }}>
            No backup files found on server.
            <button className="btnSecondary" onClick={() => setShowFtpFiles(false)} style={{ marginLeft: 8 }}>
              Close
            </button>
          </div>
        )}
      </div>

      {/* Local Backup Card */}
      <div className="backupCard">
        <h3>Local Backup</h3>
        <p>Download an encrypted JSON backup or restore from a previously saved file.</p>
        <div className="backupActions">
          <button className="btnPrimary" onClick={() => downloadLocal(year)}>
            <Download size={14} /> Download Backup ({year})
          </button>
          <button className="btnSecondary" onClick={() => downloadLocal("all")}>
            <Download size={14} /> Download All Years
          </button>
        </div>
        <div className="restoreWrap">
          <label className="fileLabel">
            <Upload size={14} /> Upload / Restore Encrypted Backup
            <input type="file" accept=".json" onChange={restoreFile} hidden />
          </label>
        </div>
        <div className="backupMeta">
          <span><CheckCircle size={14} /> Encryption: <b>{status.encryption || "AES-256-GCM"}</b></span>
          <span>
            {status.backup_secret_set
              ? <><CheckCircle size={14} /> BACKUP_SECRET set</>
              : <><XCircle size={14} /> Using JWT_SECRET fallback</>}
          </span>
        </div>
      </div>

      {/* Migrate Students Card */}
      <div className="backupCard">
        <h3><RefreshCw size={16} /> Migrate Students</h3>
        <p>Copy all active students from a previous year to the current year ({year}).</p>
        <div className="migrateRow">
          <label>From Year<input type="number" defaultValue={year - 1} min={2020} max={2030} /></label>
          <span>→</span>
          <label>To Year<input type="number" value={year} disabled /></label>
          <button
            className="btnPrimary"
            onClick={async () => {
              const fromYear = year - 1;
              if (fromYear === year) return alert("Cannot migrate to same year");
              try {
                const r = await api("/api/students/migrate", {
                  method: "POST",
                  body: JSON.stringify({ fromYear, toYear: year }),
                });
                setMsg(`Migrated ${r.migrated} students to ${year}`);
              } catch (e) {
                alert(e.message);
              }
            }}
          >
            Migrate Students
          </button>
        </div>
      </div>
    </div>
  );
}
