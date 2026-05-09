import { useState, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  IndianRupee,
  Wallet,
  CreditCard,
  Receipt,
  Calendar,
  Filter,
  Download,
  TrendingUp,
  ArrowDownLeft,
  Search,
  RefreshCcw
} from "lucide-react";

function formatCurrency(n) {
  return "₹" + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export default function MoneyManagement({ year }) {
  const [fromDate, setFromDate] = useState(firstOfMonth());
  const [toDate, setToDate] = useState(todayStr());
  const [feeType, setFeeType] = useState("all"); // all | monthly | admission
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const api = async (url, opts = {}) => {
    const token = sessionStorage.getItem("token");
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) throw new Error((await res.json()).error || "Request failed");
    return res.json();
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        from: fromDate,
        to: toDate,
        type: feeType,
      });
      const res = await api(`/api/money-report?${params}`);
      setData(res);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [year, fromDate, toDate, feeType]);

  const filteredTxns = useMemo(() => {
    if (!data?.transactions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.transactions;
    return data.transactions.filter(
      (t) =>
        (t.name || "").toLowerCase().includes(q) ||
        (t.class_name || "").toLowerCase().includes(q) ||
        (t.transaction_id || "").toLowerCase().includes(q) ||
        (t.payment_mode || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const generatePDF = () => {
    if (!data) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Header
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 95);
    doc.text("Bright Future Primary School", 105, 18, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Money Collection Report", 105, 26, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Period: ${fromDate}  to  ${toDate}  |  Academic Year: ${year}`, 105, 32, { align: "center" });

    // Summary boxes
    const boxY = 40;
    const boxW = 55;
    const boxH = 22;
    const startX = 15;
    const gap = 10;

    const drawBox = (x, title, value, color) => {
      doc.setFillColor(...color);
      doc.roundedRect(x, boxY, boxW, boxH, 3, 3, "F");
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text(title, x + 4, boxY + 7);
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 95);
      doc.text(value, x + 4, boxY + 17);
    };

    drawBox(startX, "Cash Collection", formatCurrency(data.summary.cash_total), [230, 245, 230]);
    drawBox(startX + boxW + gap, "Online Collection", formatCurrency(data.summary.online_total), [227, 242, 253]);
    drawBox(startX + (boxW + gap) * 2, "Grand Total", formatCurrency(data.summary.grand_total), [255, 243, 224]);

    // Breakdown table
    autoTable(doc, {
      startY: boxY + boxH + 10,
      head: [["Fee Type", "Cash (₹)", "Online (₹)", "Total (₹)"]],
      body: [
        ["Monthly Fees", formatCurrency(data.summary.monthly_cash), formatCurrency(data.summary.monthly_online), formatCurrency(data.summary.monthly_total)],
        ["Admission Fees", formatCurrency(data.summary.admission_cash), formatCurrency(data.summary.admission_online), formatCurrency(data.summary.admission_total)],
        ["Total", formatCurrency(data.summary.cash_total), formatCurrency(data.summary.online_total), formatCurrency(data.summary.grand_total)],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold" }, 3: { fontStyle: "bold" } },
    });

    // Transactions table
    const txns = filteredTxns.slice(0, 200); // cap for PDF
    if (txns.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [["#", "Date", "Student", "Class", "Type", "Mode", "Amount (₹)", "Txn ID"]],
        body: txns.map((t, i) => [
          i + 1,
          String(t.paid_at || "").slice(0, 10),
          t.name || "—",
          t.class_name || "—",
          t.fee_type === "monthly" ? "Monthly" : "Admission",
          t.payment_mode || "Cash",
          formatCurrency(t.paid_amount),
          t.transaction_id || "—",
        ]),
        theme: "striped",
        headStyles: { fillColor: [30, 58, 95], textColor: 255, fontSize: 9 },
        styles: { fontSize: 9, cellPadding: 2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      });
    }

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Generated on ${new Date().toLocaleString("en-IN")}  |  Total Records: ${filteredTxns.length}`, 105, 285, { align: "center" });

    doc.save(`Money_Report_${year}_${fromDate}_to_${toDate}.pdf`);
  };

  return (
    <div className="moneyMgmt">
      <div className="moneyHeader">
        <h2><IndianRupee size={22} /> Money Management</h2>
        <p>Track fee collections by payment mode and generate reports</p>
      </div>

      {/* Filters */}
      <div className="moneyFilters">
        <div className="filterGroup">
          <label><Calendar size={14} /> From</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="filterGroup">
          <label><Calendar size={14} /> To</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="filterGroup">
          <label><Filter size={14} /> Fee Type</label>
          <select value={feeType} onChange={(e) => setFeeType(e.target.value)}>
            <option value="all">All Fees</option>
            <option value="monthly">Monthly Fees Only</option>
            <option value="admission">Admission Fees Only</option>
          </select>
        </div>
        <button className="refreshBtn" onClick={load} disabled={loading}>
          <RefreshCcw size={14} /> {loading ? "Loading..." : "Refresh"}
        </button>
        <button className="pdfBtn" onClick={generatePDF} disabled={!data || loading}>
          <Download size={14} /> Download PDF
        </button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="moneyCards">
          <div className="moneyCard cash">
            <div className="cardIcon"><Wallet size={22} /></div>
            <div>
              <span>Cash Collection</span>
              <b>{formatCurrency(data.summary.cash_total)}</b>
            </div>
          </div>
          <div className="moneyCard online">
            <div className="cardIcon"><CreditCard size={22} /></div>
            <div>
              <span>Online Collection</span>
              <b>{formatCurrency(data.summary.online_total)}</b>
            </div>
          </div>
          <div className="moneyCard total">
            <div className="cardIcon"><TrendingUp size={22} /></div>
            <div>
              <span>Grand Total</span>
              <b>{formatCurrency(data.summary.grand_total)}</b>
            </div>
          </div>
          <div className="moneyCard count">
            <div className="cardIcon"><Receipt size={22} /></div>
            <div>
              <span>Total Transactions</span>
              <b>{data.summary.total_transactions}</b>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown Table */}
      {data && (
        <div className="moneyBreakdown">
          <h3>Collection Breakdown</h3>
          <table className="breakdownTable">
            <thead>
              <tr>
                <th>Fee Type</th>
                <th>Cash (₹)</th>
                <th>Online (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly Fees</td>
                <td>{formatCurrency(data.summary.monthly_cash)}</td>
                <td>{formatCurrency(data.summary.monthly_online)}</td>
                <td className="bold">{formatCurrency(data.summary.monthly_total)}</td>
              </tr>
              <tr>
                <td>Admission Fees</td>
                <td>{formatCurrency(data.summary.admission_cash)}</td>
                <td>{formatCurrency(data.summary.admission_online)}</td>
                <td className="bold">{formatCurrency(data.summary.admission_total)}</td>
              </tr>
              <tr className="totalRow">
                <td>Total</td>
                <td className="bold">{formatCurrency(data.summary.cash_total)}</td>
                <td className="bold">{formatCurrency(data.summary.online_total)}</td>
                <td className="bold grand">{formatCurrency(data.summary.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Transactions */}
      <div className="moneyTxns">
        <div className="txnHeader">
          <h3><ArrowDownLeft size={16} /> Transaction Details</h3>
          <div className="txnSearch">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search by name, class, mode, txn ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading && <div className="loading">Loading transactions...</div>}

        {!loading && filteredTxns.length === 0 && (
          <div className="emptyState">No transactions found for selected filters.</div>
        )}

        {!loading && filteredTxns.length > 0 && (
          <div className="txnTableWrap">
            <table className="txnTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Fee Type</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Txn ID</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((t, i) => (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>{String(t.paid_at || "").slice(0, 10)}</td>
                    <td>{t.name || "—"}</td>
                    <td>{t.class_name || "—"}</td>
                    <td>
                      <span className={`feeBadge ${t.fee_type}`}>
                        {t.fee_type === "monthly" ? "Monthly" : "Admission"}
                      </span>
                    </td>
                    <td>
                      <span className={`modeBadge ${t.payment_mode?.toLowerCase()}`}>
                        {t.payment_mode || "Cash"}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(t.paid_amount)}</td>
                    <td className="txnId">{t.transaction_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
