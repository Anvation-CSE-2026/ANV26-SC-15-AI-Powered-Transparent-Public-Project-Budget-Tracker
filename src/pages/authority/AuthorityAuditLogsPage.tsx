import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  RotateCw,
  Eye,
  ShieldCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  HardHat,
} from 'lucide-react';
import { getAuditLogs } from '../../api/auditService';
import type { AuditLogEntry } from '../../types/audit';
import type { UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const ITEMS_PER_PAGE = 8;

export const AuthorityAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeDetailLog, setActiveDetailLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs()
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[AuthorityAuditLogsPage] Failed to fetch audit logs:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    getAuditLogs()
      .then((data) => {
        if (isMounted) {
          setLogs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[AuthorityAuditLogsPage] Failed to fetch audit logs:', err);
          setLoading(false);
        }
      });

    const handleUpdate = () => {
      getAuditLogs().then((data) => {
        if (isMounted) setLogs(data);
      });
    };

    window.addEventListener('civicsight_audit_logs_updated', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('civicsight_audit_logs_updated', handleUpdate);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEntityType !== 'all' && log.entityType !== selectedEntityType) {
        return false;
      }
      if (selectedRole !== 'all' && log.actorRole !== selectedRole) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = log.actionTitle.toLowerCase().includes(q);
        const matchesSummary = log.summary.toLowerCase().includes(q);
        const matchesActor = log.actorName.toLowerCase().includes(q);
        const matchesEntityNumber = log.entityNumber?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSummary && !matchesActor && !matchesEntityNumber) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedEntityType, selectedRole, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLogs, currentPage]);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `civicsight_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'project_manager':
        return 'primary';
      case 'contractor':
        return 'warning';
      case 'citizen':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'project_manager':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'contractor':
        return <HardHat className="w-3.5 h-3.5" />;
      case 'citizen':
        return <User className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
              Municipal Audit Trail &amp; Governance Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable trace of project sanctions, budget changes, contractor reviews, and complaint actions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-xs cursor-pointer transition-colors"
            title="Refresh Ledger"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Trail</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search action, actor, or PRJ ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Entity:</span>
          </div>
          <select
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Entities</option>
            <option value="project">Projects</option>
            <option value="submission">Submissions</option>
            <option value="complaint">Complaints</option>
            <option value="poll">Polls</option>
            <option value="suggestion">Suggestions</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
            <span>Role:</span>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="project_manager">Authority / PM</option>
            <option value="contractor">Contractor</option>
            <option value="citizen">Citizen</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Summary</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                    <span>Loading verified audit trail...</span>
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No matching audit events</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try broadening your search or filter options.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-slate-800">{entry.actorName}</div>
                        <Badge variant={getRoleBadgeVariant(entry.actorRole)} size="sm">
                          <span className="flex items-center gap-1">
                            {getRoleIcon(entry.actorRole)}
                            <span className="capitalize">{entry.actorRole.replace('_', ' ')}</span>
                          </span>
                        </Badge>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{entry.actionTitle}</span>
                    </td>

                    {/* Entity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          <span className="capitalize">{entry.entityType}</span>
                        </Badge>
                        {entry.entityNumber && (
                          <span className="font-mono text-[11px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">
                            {entry.entityNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md truncate text-slate-600">
                      {entry.summary}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveDetailLog(entry)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors font-semibold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-700">{filteredLogs.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
            <span className="font-bold text-slate-700">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length)}
            </span>{' '}
            of <span className="font-bold text-slate-700">{filteredLogs.length}</span> audit events
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Detail / Diff Inspection Modal */}
      <Modal
        isOpen={Boolean(activeDetailLog)}
        onClose={() => setActiveDetailLog(null)}
        title="Audit Event Inspection"
        maxWidth="lg"
      >
        {activeDetailLog && (
          <div className="space-y-4 text-xs text-slate-700">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{activeDetailLog.actionTitle}</span>
                <span className="font-mono text-[10px] text-slate-400">ID: {activeDetailLog.id}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{activeDetailLog.summary}</p>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                <span className="font-semibold text-slate-500">Actor:</span>
                <span className="font-bold text-slate-800">{activeDetailLog.actorName}</span>
                <Badge variant={getRoleBadgeVariant(activeDetailLog.actorRole)} size="sm">
                  {activeDetailLog.actorRole}
                </Badge>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700">{new Date(activeDetailLog.timestamp).toISOString()}</span>
              </div>
            </div>

            {/* Before vs After State Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Before State</span>
                {activeDetailLog.beforeState ? (
                  <pre className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono overflow-x-auto text-slate-800">
                    {JSON.stringify(activeDetailLog.beforeState, null, 2)}
                  </pre>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No prior state recorded (creation event).</p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">After State</span>
                {activeDetailLog.afterState ? (
                  <pre className="p-2 rounded-lg bg-white border border-slate-200 text-[10px] font-mono overflow-x-auto text-slate-800">
                    {JSON.stringify(activeDetailLog.afterState, null, 2)}
                  </pre>
                ) : (
                  <p className="text-slate-400 italic text-[11px]">No state change recorded.</p>
                )}
              </div>
            </div>

            {/* Governance Security Note */}
            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                <strong>Audit Trail Policy:</strong> This entry is stored with SHA-256 integrity checks.
                CivicSight ensures entries are append-only; retroactive edits are mathematically prevented.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuthorityAuditLogsPage;
