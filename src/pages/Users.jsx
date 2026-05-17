import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './Products.css';

const defaultForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'User',
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const normalizeRole = (user) => user.role || user.roleName || user.roles?.[0] || 'User';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(normalizeList(response.data));
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi tải danh sách người dùng!',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (user) => {
    setEditingId(user.id || user.userId || user.idUser);
    setFormData({
      fullName: user.fullName || user.name || user.username || '',
      email: user.email || '',
      role: normalizeRole(user),
      password: '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(defaultForm);
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        role: formData.role,
      };

      if (!editingId || formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        setMessage({ type: 'success', text: 'Cập nhật người dùng thành công!' });
      } else {
        await api.post('/users', payload);
        setMessage({ type: 'success', text: 'Tạo người dùng mới thành công!' });
      }

      handleCancel();
      fetchUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi lưu dữ liệu người dùng!',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa người dùng này?')) return;
    try {
      await api.delete(`/users/${id}`);
      setMessage({ type: 'success', text: 'Xóa người dùng thành công!' });
      fetchUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi xóa người dùng!',
      });
    }
  };

  const filteredUsers = users.filter((userItem) => {
    const keyword = searchTerm.toLowerCase();
    const fullName = (userItem.fullName || userItem.name || userItem.username || '').toLowerCase();
    const email = (userItem.email || '').toLowerCase();
    const role = normalizeRole(userItem).toLowerCase();
    return fullName.includes(keyword) || email.includes(keyword) || role.includes(keyword);
  });

  if (loading) {
    return <div className="container"><p>Đang tải danh sách người dùng...</p></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Quản lý người dùng</h1>
          <p>Danh sách user hiện tại và quản lý role, tạo, sửa hoặc xóa user.</p>
        </div>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div className="form-card">
        <h2>{editingId ? 'Sửa người dùng' : 'Thêm người dùng mới'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Họ và tên</label>
              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label>{editingId ? 'Mật khẩu mới (tùy chọn)' : 'Mật khẩu'}</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={editingId ? 'Để trống nếu không đổi' : '••••••••'}
                minLength={editingId ? 0 : 6}
                required={!editingId}
              />
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn btn-success" disabled={saving}>
              {saving ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Tạo mới'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm user theo tên, email, role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Role</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">Không có người dùng nào.</td>
              </tr>
            ) : (
              filteredUsers.map((userItem) => {
                const id = userItem.id || userItem.userId || userItem.idUser;
                return (
                  <tr key={id || userItem.email || Math.random()}>
                    <td>{id || '-'}</td>
                    <td>{userItem.fullName || userItem.name || userItem.username || '-'}</td>
                    <td>{userItem.email || '-'}</td>
                    <td>
                      <span className="status-chip">{normalizeRole(userItem)}</span>
                    </td>
                    <td>
                      <button className="btn btn-edit" onClick={() => handleEdit(userItem)}>
                        Sửa
                      </button>
                      <button className="btn btn-delete" onClick={() => handleDelete(id)}>
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
