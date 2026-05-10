
import { useState, useEffect } from "react";
import { Database, Upload, Download, Cloud, CheckCircle, XCircle } from "lucide-react";
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
  const [msg, setMsg] = useState("");

  const loadStatus = () => {
    api("/api/backup/status").then(setStatus).catch((e) => setMsg(e.message));
  };

  useEffect(() => {
    loadStatus();
  }, []);

  async function download(selected = year) {
    const data = await api("/api/backup/download?year=" + selected);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `school-backup-${selected}-encrypted.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function ftpUpload() {
    try {
      const r = await api("/api/backup/ftp-upload", {
        method: "POST",
        body: JSON.stringify({ year }),
      });

      alert("Backup uploaded successfully to FTP server: " + r.fileName);
    } catch (e) {
      alert(e.message);
    }
  }

  async function restoreFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!confirm("Restore this backup into database?")) return;

    const text = await f.text();
    const payload = JSON.parse(text);

    const r = await api("/api/backup/upload", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setMsg(r.ok ? "Backup restored successfully." : "Restore completed.");
  }

  return (
    <div className="backupPage">
      <h2><Database size={20} /> Backup & Restore — {year}</h2>

      {msg && <div className="infoMsg">{msg}</div>}

      <div className="backupCard driveCard">
        <div className="driveHeader">
          <div className="driveIconWrap">
            <Cloud size={24} />
          </div>

          <div className="driveInfo">
            <h3>FTP Server Backup</h3>
            <p>Upload encrypted backups directly to FTP server.</p>
            <p><b>Host:</b> 185.27.134.11</p>
            <p><b>Folder:</b> School_management_data</p>
          </div>
        </div>

        <div className="driveUploadRow">
          <button className="btnPrimary" onClick={ftpUpload}>
            <Upload size={14} />
            Upload Backup to FTP Server
          </button>
        </div>
      </div>

      <div className="backupCard">
        <h3>Local Backup</h3>

        <p>
          Download encrypted JSON backup or restore from existing backup file.
        </p>

        <div className="backupActions">
          <button className="btnPrimary" onClick={() => download(year)}>
            <Download size={14} />
            Download Backup ({year})
          </button>

          <button className="btnSecondary" onClick={() => download("all")}>
            <Download size={14} />
            Download All Years
          </button>
        </div>

        <div className="restoreWrap">
          <label className="fileLabel">
            <Upload size={14} />
            Upload / Restore Backup
            <input
              type="file"
              accept=".json"
              onChange={restoreFile}
              hidden
            />
          </label>
        </div>

        <div className="backupMeta">
          <span>
            <CheckCircle size={14} />
            Encryption: <b>{status.encryption || "AES-256-GCM"}</b>
          </span>

          <span>
            {status.backup_secret_set ? (
              <>
                <CheckCircle size={14} />
                BACKUP_SECRET set
              </>
            ) : (
              <>
                <XCircle size={14} />
                Using JWT_SECRET fallback
              </>
            )}
          </span>
        </div>
      </div>

      <div className="backupCard">
        <h3><Upload size={16} /> Migrate Students</h3>

        <p>
          Copy all active students from previous year to current year ({year}).
        </p>

        <div className="migrateRow">
          <label>
            From Year
            <input
              type="number"
              defaultValue={year - 1}
              min={2020}
              max={2030}
            />
          </label>

          <span>→</span>

          <label>
            To Year
            <input type="number" value={year} disabled />
          </label>

          <button
            className="btnPrimary"
            onClick={async () => {
              const fromYear = year - 1;

              try {
                const r = await api("/api/students/migrate", {
                  method: "POST",
                  body: JSON.stringify({
                    fromYear,
                    toYear: year,
                  }),
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
