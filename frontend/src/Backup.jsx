import { useState, useEffect } from "react";
import {
  Database, Upload, Download, Cloud, CheckCircle, XCircle, Loader,
  ExternalLink, Unlink
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
  const [driveStatus, setDriveStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [popup, setPopup] = useState(null);

  const loadStatus = () => {
    api("/api/backup/status").then(setStatus).catch((e) => setMsg(e.message));
    api("/api/drive/status").then(setDriveStatus).catch(() => setDriveStatus({ connected: false, configured: false }));
  };

  useEffect(() => {
    loadStatus();
    const onMessage = (ev) => {
      if (ev.data?.type === "GOOGLE_DRIVE_CONNECTED") {
        setShowDriveModal(false);
        setMsg(`Google Drive connected: ${ev.data.email || ""}`);
        loadStatus();
        if (popup && !popup.closed) popup.close();
        setPopup(null);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [popup]);

  async function download(selected = year) {
    const data = await api("/api/backup/download?year=" + selected);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `school-backup-${selected}-encrypted.json`; a.click();
    URL.revokeObjectURL(url);
  }

  async function gd() {
    try {
      const r = await api("/api/backup/google-drive", { method: "POST", body: JSON.stringify({ year }) });
      alert("Uploaded encrypted backup to Google Drive: " + r.fileId);
    } catch (e) { alert(e.message); }   // ✅ FIXED: changed (e" to (e)
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

  async function connectDrive() {
    setDriveLoading(true);
    try {
      const { url } = await api("/api/drive/auth-url");
      const w = window.open(url, "googleDriveAuth", "width=500,height=600,top=100,left=100");
      setPopup(w);
    } catch (e) { alert(e.message); }
    finally { setDriveLoading(false); }
  }

  async function disconnectDrive() {
    if (!confirm("Disconnect Google Drive? You will need to reconnect to upload backups.")) return;
    await api("/api/drive/disconnect", { method: "POST" });
    setMsg("Google Drive disconnected.");
    loadStatus();
  }

  return (
    <div className="backupPage">
      <h2><Database size={20} /> Backup & Restore — {year}</h2>
      {msg && <div className="infoMsg">{msg}</div>}

      <div className="backupCard driveCard">
        <div className="driveHeader">
          <div className="driveIconWrap"><Cloud size={24} /></div>
          <div className="driveInfo">
            <h3>Google Drive Backup</h3>
            <p>
              {driveStatus?.connected
                ? `Connected: ${driveStatus.email || "Google Account"}`
                : driveStatus?.configured
                ? "Not connected. Link your Google account to upload backups directly to Drive."
                : "Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Railway."}
            </p>
          </div>
          <div className="driveActions">
            {driveStatus?.connected ? (
              <button className="btnOutline" onClick={disconnectDrive}><Unlink size={14} /> Disconnect</button>
            ) : driveStatus?.configured ? (
              <button className="btnPrimary" onClick={() => setShowDriveModal(true)} disabled={driveLoading}>
                {driveLoading ? <Loader size={14} className="spin" /> : <ExternalLink size={14} />}
                {driveLoading ? "Opening..." : "Connect Google Drive"}
              </button>
            ) : (
              <span className="badgeGray">Not Configured</span>
            )}
          </div>
        </div>
        {driveStatus?.connected && (
          <div className="driveUploadRow">
            <button className="btnPrimary" onClick={gd}><Upload size={14} /> Upload Backup to Drive</button>
            <span className="folderBadge">Folder ID: {status.configured_google_login || status.configured_service_account ? "Set" : "Not set"}</span>
          </div>
        )}
      </div>

      <div className="backupCard">
        <h3>Local Backup</h3>
        <p>Download an encrypted JSON backup or restore from a previously saved file.</p>
        <div className="backupActions">
          <button className="btnPrimary" onClick={() => download(year)}><Download size={14} /> Download Backup ({year})</button>
          <button className="btnSecondary" onClick={() => download("all")}><Download size={14} /> Download All Years</button>
        </div>
        <div className="restoreWrap">
          <label className="fileLabel"><Upload size={14} /> Upload / Restore Encrypted Backup<input type="file" accept=".json" onChange={restoreFile} hidden /></label>
        </div>
        <div className="backupMeta">
          <span><CheckCircle size={14} /> Encryption: <b>{status.encryption || "AES-256-GCM"}</b></span>
          <span>{status.backup_secret_set ? <><CheckCircle size={14} /> BACKUP_SECRET set</> : <><XCircle size={14} /> Using JWT_SECRET fallback</>}</span>
        </div>
      </div>

      <div className="backupCard">
        <h3><Upload size={16} /> Migrate Students</h3>
        <p>Copy all active students from a previous year to the current year ({year}).</p>
        <div className="migrateRow">
          <label>From Year<input type="number" defaultValue={year - 1} min={2020} max={2030} /></label>
          <span>→</span>
          <label>To Year<input type="number" value={year} disabled /></label>
          <button className="btnPrimary" onClick={async () => {
            const fromYear = year - 1;
            if (fromYear === year) return alert("Cannot migrate to same year");
            try { const r = await api("/api/students/migrate", { method: "POST", body: JSON.stringify({ fromYear, toYear: year }) }); setMsg(`Migrated ${r.migrated} students to ${year}`); }
            catch (e) { alert(e.message); }
          }}>Migrate Students</button>
        </div>
      </div>

      {showDriveModal && (
        <div className="modalOverlay" onClick={() => setShowDriveModal(false)}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <h3><Cloud size={18} /> Connect Google Drive</h3>
              <button className="modalClose" onClick={() => setShowDriveModal(false)}>×</button>
            </div>
            <div className="modalBody">
              <div className="stepList">
                <div className="step"><span className="stepNum">1</span><p>Click the button below to open Google login in a popup window.</p></div>
                <div className="step"><span className="stepNum">2</span><p>Sign in with the Google account where you want backups saved.</p></div>
                <div className="step"><span className="stepNum">3</span><p>Grant permission to access Google Drive. The popup will close automatically.</p></div>
              </div>
              <div className="modalNote"><b>Note:</b> Make sure <code>GOOGLE_DRIVE_FOLDER_ID</code> is set in your Railway environment variables so backups are uploaded to the correct folder.</div>
            </div>
            <div className="modalFooter">
              <button className="btnSecondary" onClick={() => setShowDriveModal(false)}>Cancel</button>
              <button className="btnPrimary" onClick={connectDrive} disabled={driveLoading}>
                {driveLoading ? <Loader size={14} className="spin" /> : <ExternalLink size={14} />}
                {driveLoading ? "Please wait..." : "Connect with Google"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}