import React, { useState, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiSun, FiMoon, FiFilter, FiCheckCircle, FiRefreshCw, FiHome, FiShield, FiUserCheck, FiEye } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { formatCurrency, formatLitres, formatDate } from '../utils/formatters';

const MilkRecordsPage = () => {
  const { isAdmin, user, systemDairyName } = useAuth();

  const canEditMilk = isAdmin || user?.permissions?.canEditMilk !== false;
  const canDeleteMilk = isAdmin || user?.permissions?.canDeleteMilk === true;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', session: 'morning', litres: '', milkPricePerLitre: '', dairyName: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRecords(1);
  }, [sessionFilter, startDate, endDate, sortBy, sortOrder]);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      let query = `/milk?page=${page}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      if (sessionFilter) query += `&session=${sessionFilter}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;
      if (search) query += `&search=${search}`;

      const res = await api.get(query);
      if (res.data.success) {
        setRecords(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch milk records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchRecords(newPage);
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  // Open Edit Modal
  const openEditModal = (record) => {
    setSelectedRecord(record);
    setEditForm({
      date: record.date,
      session: record.session,
      litres: record.litres,
      milkPricePerLitre: record.milkPricePerLitre,
      dairyName: record.dairyName || ''
    });
    setEditModalOpen(true);
  };

  // Save Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.put(`/milk/${selectedRecord._id}`, editForm);
      if (res.data.success) {
        showToast('Milk record updated successfully!');
        setEditModalOpen(false);
        fetchRecords(pagination.page);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update record');
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Delete Modal
  const openDeleteModal = (record) => {
    setDeletingRecord(record);
    setDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/milk/${deletingRecord._id}`);
      if (res.data.success) {
        showToast('Milk record deleted successfully!');
        setDeleteModalOpen(false);
        fetchRecords(pagination.page);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const columns = [
    {
      label: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-semibold">{formatDate(row.date)}</span>
    },
    {
      label: 'Session',
      key: 'session',
      render: (row) => (
        <Badge variant={row.session === 'morning' ? 'warning' : 'info'}>
          {row.session === 'morning' ? (
            <span className="flex items-center gap-1"><FiSun className="w-3 h-3" /> Morning</span>
          ) : (
            <span className="flex items-center gap-1"><FiMoon className="w-3 h-3" /> Evening</span>
          )}
        </Badge>
      )
    },
    {
      label: 'Dairy Name',
      key: 'dairyName',
      render: (row) => (
        <span className="font-semibold text-text-main text-xs">
          {systemDairyName || row.dairyName || '-'}
        </span>
      )
    },
    {
      label: 'Litres',
      key: 'litres',
      sortable: true,
      render: (row) => <span className="font-bold text-text-main">{formatLitres(row.litres)}</span>
    },
    {
      label: 'Price/Litre',
      key: 'milkPricePerLitre',
      render: (row) => <span>₹{row.milkPricePerLitre}</span>
    },
    {
      label: 'Total Amount',
      key: 'totalAmount',
      sortable: true,
      render: (row) => <span className="font-bold text-emerald-600">{formatCurrency(row.totalAmount)}</span>
    },
    ...(isAdmin
      ? [
          {
            label: 'Farmer',
            key: 'user',
            render: (row) => (
              <div className="text-xs">
                <span className="font-bold text-slate-800 block">{row.user?.name || 'Unknown'}</span>
                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  #{row.user?.userCode || 'FARM-001'}
                </span>
              </div>
            )
          }
        ]
      : []),
    {
      label: 'Recorded By',
      key: 'createdBy',
      render: (row) => {
        const recorder = row.createdBy;
        if (!recorder) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium border border-slate-200">
              <FiUserCheck className="w-3 h-3 text-slate-400" />
              {row.user?.name || 'System / Self'}
            </span>
          );
        }
        const isRecordedByAdmin = recorder.role === 'admin';
        const codeTag = recorder.userCode ? ` (#${recorder.userCode})` : '';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
              isRecordedByAdmin
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}
          >
            {isRecordedByAdmin ? (
              <>
                <FiShield className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>Admin ({recorder.name}{codeTag})</span>
              </>
            ) : (
              <>
                <FiUserCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>Farmer ({recorder.name}{codeTag})</span>
              </>
            )}
          </span>
        );
      }
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          {canEditMilk && (
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Edit Record"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
          )}
          {canDeleteMilk && (
            <button
              onClick={() => openDeleteModal(row)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Record"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
          {!canEditMilk && !canDeleteMilk && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <FiEye className="w-3 h-3 text-amber-600" /> Read Only
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold animate-fadeIn">
          <FiCheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">Milk Collection Records</h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">View, search, and monitor historical milk collection entries.</p>
        </div>
      </div>

      {!canEditMilk && !canDeleteMilk && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900 font-semibold shadow-2xs">
          <FiEye className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>
            <strong>View-Only Account:</strong> You can view all recorded milk collection history and details, but editing or deleting entries is restricted by Administrator.
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">Session</label>
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Sessions</option>
            <option value="morning">Morning</option>
            <option value="evening">Evening</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by user or date..."
        emptyMessage="No milk records found."
        emptySubtext="Start by recording today's milk collection."
      />

      {/* Edit Milk Record Modal (Has compulsory FiX React Icon) */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Milk Record"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Date *</label>
            <input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Session *</label>
            <select
              value={editForm.session}
              onChange={(e) => setEditForm({ ...editForm, session: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Litres *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={editForm.litres}
              onChange={(e) => setEditForm({ ...editForm, litres: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Price / Litre (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editForm.milkPricePerLitre}
              onChange={(e) => setEditForm({ ...editForm, milkPricePerLitre: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>



          <div className="p-3 bg-slate-50 rounded-xl text-xs font-semibold text-text-sub flex justify-between">
            <span>Computed Total:</span>
            <span className="font-bold text-emerald-600">
              {formatCurrency((parseFloat(editForm.litres) || 0) * (parseFloat(editForm.milkPricePerLitre) || 0))}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-sm transition-all"
            >
              {savingEdit ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal (Has compulsory FiX React Icon) */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this milk record for{' '}
            <strong className="text-text-main">{formatDate(deletingRecord?.date)}</strong> (
            {deletingRecord?.session}) of <strong className="text-text-main">{formatLitres(deletingRecord?.litres)}</strong>?
          </p>
          <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">
            This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm transition-all"
            >
              {deleting ? 'Deleting...' : 'Delete Record'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MilkRecordsPage;
