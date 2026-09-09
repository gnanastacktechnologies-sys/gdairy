import React, { useState, useEffect } from 'react';
import { FiPlus, FiUserCheck, FiUserX, FiKey, FiEdit2, FiTrash2, FiCheckCircle, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { formatDate } from '../utils/formatters';

const UsersPage = () => {
  const { systemDairyName } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Add User Modal State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    userCode: '',
    dairyName: '',
    joiningDate: todayStr,
    createdAt: todayStr,
    status: 'active',
    permissions: { canAddMilk: true, canEditMilk: true, canDeleteMilk: false, canCreditAccount: true }
  });
  const [addShowPassword, setAddShowPassword] = useState(false);
  const [adding, setAdding] = useState(false);

  // Edit User Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    phone: '',
    userCode: '',
    dairyName: '',
    joiningDate: todayStr,
    createdAt: todayStr,
    status: 'active',
    permissions: { canAddMilk: true, canEditMilk: true, canDeleteMilk: false, canCreditAccount: true }
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Reset Password Modal State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetShowPassword, setResetShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers(1);
  }, [search]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      let query = `/users?page=${page}&limit=10`;
      if (search) query += `&search=${search}`;
      const res = await api.get(query);
      if (res.data.success) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Submit Add User
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await api.post('/users', addForm);
      if (res.data.success) {
        showToast('User created successfully!');
        setAddModalOpen(false);
        setAddForm({
          name: '',
          username: '',
          password: '',
          phone: '',
          userCode: '',
          dairyName: '',
          createdAt: todayStr,
          status: 'active',
          permissions: { canAddMilk: true, canEditMilk: true, canDeleteMilk: false, canCreditAccount: true }
        });
        fetchUsers(1);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setAdding(false);
    }
  };

  // Submit Edit User
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await api.put(`/users/${editingUser._id}`, editForm);
      if (res.data.success) {
        showToast('User updated successfully!');
        setEditModalOpen(false);
        fetchUsers(pagination.page);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetting(true);
    try {
      const res = await api.post(`/users/${resettingUser._id}/reset-password`, { newPassword });
      if (res.data.success) {
        showToast(`Password reset successfully for ${resettingUser.username}`);
        setResetModalOpen(false);
        setNewPassword('');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  // Submit Delete
  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.delete(`/users/${deletingUser._id}`);
      if (res.data.success) {
        showToast('User deleted successfully!');
        setDeleteModalOpen(false);
        fetchUsers(pagination.page);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      label: 'Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-text-main">{row.name}</div>
          <div className="text-xs text-text-sub">@{row.username}</div>
        </div>
      )
    },
    {
      label: 'Code',
      key: 'userCode',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs">
          {row.userCode || (row.role === 'admin' ? 'ADM-001' : 'FARM-001')}
        </span>
      )
    },
    {
      label: 'Role',
      key: 'role',
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'info' : 'secondary'}>
          {row.role.toUpperCase()}
        </Badge>
      )
    },
    {
      label: 'Dairy Name',
      key: 'dairyName',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
          {systemDairyName || row.dairyName || '-'}
        </span>
      )
    },
    {
      label: 'Milk Entry Permission',
      key: 'permissions',
      render: (row) => {
        const canAdd = row.role === 'admin' || row.permissions?.canAddMilk !== false;
        const canEdit = row.role === 'admin' || row.permissions?.canEditMilk !== false;
        const isViewOnly = !canAdd && !canEdit;

        if (isViewOnly) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <FiEye className="w-3.5 h-3.5 text-amber-700" /> View-Only Mode
            </span>
          );
        }

        return (
          <div className="flex flex-col gap-1">
            {canAdd ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                ✓ Entry Allowed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                ✕ Entry Restricted
              </span>
            )}
            {row.role !== 'admin' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                row.permissions?.canCreditAccount !== false ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {row.permissions?.canCreditAccount !== false ? '✓ Credit Allowed' : '🔒 Credit Restricted'}
              </span>
            )}
          </div>
        );
      }
    },
    {
      label: 'Phone',
      key: 'phone',
      render: (row) => <span>{row.phone || '-'}</span>
    },
    {
      label: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={row.status === 'active' ? 'success' : 'danger'}>
          {row.status.toUpperCase()}
        </Badge>
      )
    },
    {
      label: 'Dairy Joining Date',
      key: 'joiningDate',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
          📅 {formatDate(row.joiningDate ? row.joiningDate.split('T')[0] : row.createdAt?.split('T')[0])}
        </span>
      )
    },
    {
      label: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setEditingUser(row);
              setEditForm({
                name: row.name,
                username: row.username,
                userCode: row.userCode || (row.role === 'admin' ? 'ADM-001' : 'FARM-001'),
                phone: row.phone || '',
                dairyName: row.dairyName || '',
                joiningDate: row.joiningDate ? row.joiningDate.split('T')[0] : (row.createdAt ? row.createdAt.split('T')[0] : todayStr),
                createdAt: row.createdAt ? row.createdAt.split('T')[0] : todayStr,
                status: row.status,
                permissions: row.permissions || { canAddMilk: true, canEditMilk: true, canDeleteMilk: false, canCreditAccount: true }
              });
              setEditModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Edit User & Access Permissions"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setResettingUser(row);
              setNewPassword('');
              setResetModalOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
            title="Reset Password"
          >
            <FiKey className="w-4 h-4" />
          </button>
          {row.role !== 'admin' && (
            <button
              onClick={() => {
                setDeletingUser(row);
                setDeleteModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete User"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
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

      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-main">User Management & Permissions</h1>
          <p className="text-xs sm:text-sm text-text-sub mt-1">Admin panel to create users, configure milk entry access permissions, or edit profiles.</p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 flex-shrink-0"
        >
          <FiPlus className="w-5 h-5 stroke-[2.5]" />
          <span>Add User</span>
        </button>
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchUsers(p)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by farmer name, farmer code, username or phone..."
        emptyMessage="No users found."
        emptySubtext="Click + Add User to create a new user account."
      />

      {/* Add User Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New User & Set Permissions">
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Full Name *</label>
            <input
              type="text"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">
              Farmer Code <span className="text-[10px] text-slate-400 font-normal lowercase">(auto-generated if empty)</span>
            </label>
            <input
              type="text"
              value={addForm.userCode}
              onChange={(e) => setAddForm({ ...addForm, userCode: e.target.value })}
              placeholder="e.g. FARM-001, FARM-002"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Username *</label>
            <input
              type="text"
              value={addForm.username}
              onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
              placeholder="e.g. ramesh123"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>



          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Password *</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={addShowPassword ? 'text' : 'password'}
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
              <button
                type="button"
                onClick={() => setAddShowPassword(!addShowPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title={addShowPassword ? 'Hide password' : 'Show password'}
              >
                {addShowPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Phone Number</label>
            <input
              type="text"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              placeholder="e.g. 9876543210"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">
              Dairy Joining Date *
            </label>
            <input
              type="date"
              value={addForm.joiningDate}
              onChange={(e) => setAddForm({ ...addForm, joiningDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Milk collection records for this user will start from this joining date onwards.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Account Status</label>
            <select
              value={addForm.status}
              onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Admin Access Permission Controls */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">
                Milk Entry Access Permissions
              </h4>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setAddForm({
                    ...addForm,
                    permissions: { canAddMilk: false, canEditMilk: false, canDeleteMilk: false }
                  })}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors"
                >
                  👁 View-Only Mode
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm({
                    ...addForm,
                    permissions: { canAddMilk: true, canEditMilk: true, canDeleteMilk: false }
                  })}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-colors"
                >
                  ✓ Standard Access
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.permissions.canAddMilk}
                  onChange={(e) => setAddForm({
                    ...addForm,
                    permissions: { ...addForm.permissions, canAddMilk: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span>Allow Milk Collection Entry Access</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.permissions.canEditMilk}
                  onChange={(e) => setAddForm({
                    ...addForm,
                    permissions: { ...addForm.permissions, canEditMilk: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span>Allow Editing Milk Collection Records</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addForm.permissions.canDeleteMilk}
                  onChange={(e) => setAddForm({
                    ...addForm,
                    permissions: { ...addForm.permissions, canDeleteMilk: e.target.checked }
                  })}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span>Allow Deleting Milk Collection Records</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={addForm.permissions.canCreditAccount !== false}
                  onChange={(e) => setAddForm({
                    ...addForm,
                    permissions: { ...addForm.permissions, canCreditAccount: e.target.checked }
                  })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Allow Credit Account (Mark Paid / Settle Balance) Access</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-sm"
            >
              {adding ? 'Creating...' : 'Save User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit User & Access Permissions">
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Full Name *</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Farmer Code</label>
            <input
              type="text"
              value={editForm.userCode}
              onChange={(e) => setEditForm({ ...editForm, userCode: e.target.value })}
              placeholder="e.g. FARM-001, FARM-002"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Username (Editable by Admin) *</label>
            <input
              type="text"
              value={editForm.username}
              onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>



          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Phone Number</label>
            <input
              type="text"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">
              Dairy Joining Date *
            </label>
            <input
              type="date"
              value={editForm.joiningDate}
              onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Milk collection records for this user start from this joining date.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Admin Access Permission Controls */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-main">
                Milk Entry Access Permissions
              </h4>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditForm({
                    ...editForm,
                    permissions: { canAddMilk: false, canEditMilk: false, canDeleteMilk: false }
                  })}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 transition-colors"
                >
                  👁 View-Only Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm({
                    ...editForm,
                    permissions: { canAddMilk: true, canEditMilk: true, canDeleteMilk: false }
                  })}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 transition-colors"
                >
                  ✓ Standard Access
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.permissions?.canAddMilk}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    permissions: { ...editForm.permissions, canAddMilk: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span>Allow Milk Collection Entry Access</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.permissions?.canEditMilk}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    permissions: { ...editForm.permissions, canEditMilk: e.target.checked }
                  })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <span>Allow Editing Milk Collection Records</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.permissions?.canDeleteMilk}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    permissions: { ...editForm.permissions, canDeleteMilk: e.target.checked }
                  })}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <span>Allow Deleting Milk Collection Records</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer pt-1 border-t border-slate-200/60">
                <input
                  type="checkbox"
                  checked={editForm.permissions?.canCreditAccount !== false}
                  onChange={(e) => setEditForm({
                    ...editForm,
                    permissions: { ...editForm.permissions, canCreditAccount: e.target.checked }
                  })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Allow Credit Account (Mark Paid / Settle Balance) Access</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark shadow-sm"
            >
              {savingEdit ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Reset User Password">
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-text-sub">
            Set a new password for <strong className="text-text-main">{resettingUser?.name}</strong> (@{resettingUser?.username}).
          </p>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-sub mb-1">New Password *</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type={resetShowPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                required
              />
              <button
                type="button"
                onClick={() => setResetShowPassword(!resetShowPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                title={resetShowPassword ? 'Hide password' : 'Show password'}
              >
                {resetShowPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setResetModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={resetting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-sm"
            >
              {resetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete User">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete user account <strong className="text-text-main">{deletingUser?.name}</strong> (@{deletingUser?.username})?
          </p>
          <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-3 rounded-xl border border-rose-100">
            This action cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
            >
              {deleting ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UsersPage;
