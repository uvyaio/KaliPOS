import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import { supabase } from "../lib/supabaseClient";
import { formatDate, formatKsh, formatTime, maskPhone, relativeTime } from "../lib/format";

const PAGE_SIZE = 10;

export default function MpesaTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadTransactions() {
    const { data } = await supabase.from("mpesa_transactions").select("*").order("created_at", { ascending: false }).limit(200);
    setTransactions(data ?? []);
    setLastSync(new Date());
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (statusFilter === "all") return transactions;
    return transactions.filter((t) => t.status === statusFilter);
  }, [transactions, statusFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const stats = useMemo(() => {
    const successToday = transactions.filter((t) => t.status === "success");
    const volume = successToday.reduce((sum, t) => sum + Number(t.amount), 0);
    const flagged = transactions.filter((t) => t.status === "failed" || t.status === "timeout").length;
    const successRate = transactions.length ? Math.round((successToday.length / transactions.length) * 100) : 0;
    return { volume, count: transactions.length, flagged, successRate };
  }, [transactions]);

  return (
    <AppShell searchPlaceholder="Search by receipt, phone, or amount...">
      <div className="flex flex-col w-full h-full relative overflow-hidden bg-background">
        <div className="w-full px-container-padding py-8 flex-1 flex flex-col relative">
          {/* Header + stats */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-8">
            <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                <h1 className="font-display-lg text-display-lg text-on-surface mb-2">M-Pesa Ledger</h1>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                  Real-time mobile money settlement log. Reconcile transactions and track pending transfers.
                </p>
              </div>
              <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 bg-surface-container-low rounded-xl w-fit shadow-sm">
                <div className="relative flex items-center justify-center w-6 h-6">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-20 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </div>
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface">Live Sync Active</div>
                  <div className="text-[11px] text-on-surface-variant font-body-md">Last captured: {relativeTime(lastSync.toISOString())}</div>
                </div>
              </div>
            </div>
            <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-base">
              <StatCard icon="account_balance_wallet" label="Total Volume" value={formatKsh(stats.volume)} accentColor="primary" />
              <StatCard icon="receipt_long" label="Tx Count" value={String(stats.count)} sub={`${stats.successRate}% success rate`} accentColor="secondary" />
              <div className="bg-error-container/20 p-4 rounded-xl shadow-sm flex flex-col justify-between md:col-span-1 col-span-2 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <span className="material-symbols-outlined text-error text-[20px]">flag</span>
                  <span className="font-label-sm text-label-sm text-error">Flagged Txs</span>
                </div>
                <div className="relative z-10">
                  <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{stats.flagged}</div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">Failed or timed-out payments.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 bg-surface-container-lowest p-2 rounded-xl shadow-sm z-20 sticky top-16">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {["all", "pending", "success", "failed"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(0);
                  }}
                  className={`px-3 py-2 rounded-lg transition-colors font-body-md text-[13px] capitalize ${
                    statusFilter === status ? "bg-primary/10 text-primary font-semibold" : "text-on-surface-variant hover:bg-surface-container-low"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={loadTransactions}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high transition-colors text-on-surface font-label-sm text-label-sm"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-body-md">
                <thead>
                  <tr className="text-on-surface-variant text-[12px] uppercase tracking-wider border-b border-outline-variant/30">
                    <th className="px-6 py-4 font-label-sm"></th>
                    <th className="px-6 py-4 font-label-sm">Receipt</th>
                    <th className="px-6 py-4 font-label-sm">Customer</th>
                    <th className="px-6 py-4 font-label-sm text-right">Amount (KSh)</th>
                    <th className="px-6 py-4 font-label-sm">Time</th>
                    <th className="px-6 py-4 font-label-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    paged.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-auto p-4 flex items-center justify-between border-t border-outline-variant/20 bg-surface-container-lowest/80">
              <div className="text-[12px] text-on-surface-variant font-body-md">
                Showing <span className="font-semibold text-on-surface">{filtered.length === 0 ? 0 : page * PAGE_SIZE + 1}</span> to{" "}
                <span className="font-semibold text-on-surface">{Math.min((page + 1) * PAGE_SIZE, filtered.length)}</span> of{" "}
                <span className="font-semibold text-on-surface">{filtered.length}</span> transactions
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant disabled:text-outline disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary font-label-sm text-[13px]">
                  {page + 1}
                </span>
                <span className="text-on-surface-variant text-[13px] px-1">of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant disabled:text-outline disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, sub, accentColor }) {
  return (
    <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <span className={`material-symbols-outlined text-[20px] ${accentColor === "primary" ? "text-primary" : "text-secondary"}`}>{icon}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
      </div>
      <div className="relative z-10">
        <div className="font-headline-lg text-headline-lg text-on-surface tracking-tight">{value}</div>
        {sub && (
          <div className="flex items-center gap-1 mt-1 text-[11px] text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            <span>{sub}</span>
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  success: { icon: "call_made", badge: "bg-primary/10 text-primary", bubble: "bg-primary-container/20 text-primary", label: "Success" },
  pending: { icon: "hourglass_top", badge: "bg-secondary-container text-on-secondary-container", bubble: "bg-secondary-container text-on-secondary-container", label: "Pending" },
  failed: { icon: "call_missed", badge: "bg-error/10 text-error", bubble: "bg-error-container/30 text-error", label: "Failed" },
  timeout: { icon: "schedule", badge: "bg-error/10 text-error", bubble: "bg-error-container/30 text-error", label: "Timeout" },
};

function TransactionRow({ tx }) {
  const style = STATUS_STYLES[tx.status] ?? STATUS_STYLES.pending;
  return (
    <tr className="hover:bg-surface-container-low/30 transition-colors relative after:absolute after:bottom-0 after:left-6 after:right-6 after:h-[1px] after:bg-outline-variant/30 last:after:hidden">
      <td className="px-6 py-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style.bubble}`}>
          <span className="material-symbols-outlined text-[16px]">{style.icon}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-mono text-on-surface font-medium tracking-tight">{tx.mpesa_receipt || "—"}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-on-surface font-medium">{tx.customer_name || "Walk-in customer"}</div>
        <div className="text-[11px] text-on-surface-variant mt-0.5">{maskPhone(tx.phone)}</div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="text-on-surface font-semibold">{Number(tx.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}</div>
      </td>
      <td className="px-6 py-4 text-on-surface-variant">
        <div>{formatTime(tx.created_at)}</div>
        <div className="text-[10px] mt-0.5">{formatDate(tx.created_at)}</div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-label-sm text-[11px] uppercase tracking-wide ${style.badge}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {style.label}
        </span>
      </td>
    </tr>
  );
}
