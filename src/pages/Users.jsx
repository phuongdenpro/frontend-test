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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [gender, setGender] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

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
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        keyword: searchTerm,
      });
      
      if (gender) params.append('gender', gender);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortBy) params.append('sortOrder', sortOrder);

      const response = await api.get(`/users?${params.toString()}`);
      const data = response.data?.data || response.data;
      
      // Xử lý response có phân trang
      if (data?.items && Array.isArray(data.items)) {
        setUsers(data.items);
        setTotalUsers(data.totalCount || data.items.length);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalUsers(data.length);
      } else {
        setUsers(normalizeList(data));
      }
      
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
  }, [currentPage, pageSize, searchTerm, gender, sortBy, sortOrder]);

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
      setCurrentPage(1);
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
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi xóa người dùng!',
      });
    }
  };

  if (loading) {
    return <div className="container"><p>Đang tải danh sách người dùng...</p></div>;
  }

  const totalPages = Math.ceil(totalUsers / pageSize) || 1;

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

      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm user theo tên, email, role..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Giới tính</label>
            <select value={gender} onChange={(e) => {
              setGender(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="">Tất cả</option>
              <option value="1">Nam</option>
              <option value="0">Nữ</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sắp xếp theo</label>
            <select value={sortBy} onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}>
              <option value="">Không sắp xếp</option>
              <option value="name">Tên</option>
              <option value="email">Email</option>
              <option value="createdAt">Ngày tạo</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Thứ tự</label>
            <select value={sortOrder} onChange={(e) => {
              setSortOrder(e.target.value);
              setCurrentPage(1);
            }} disabled={!sortBy}>
              <option value="asc">Tăng dần (A-Z)</option>
              <option value="desc">Giảm dần (Z-A)</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Số lượng / trang</label>
            <select value={pageSize} onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
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
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">Không có người dùng nào.</td>
              </tr>
            ) : (
              users.map((userItem) => {
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

      <div className="pagination-section">
        <div className="pagination-info">
          <p>Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> | Tổng: <strong>{totalUsers}</strong> người dùng</p>
        </div>

        <div className="pagination-controls">
          <button 
            onClick={() => setCurrentPage(1)} 
            disabled={currentPage === 1}
            className="btn btn-pagination"
          >
            ⏮ Đầu
          </button>

          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
            disabled={currentPage === 1}
            className="btn btn-pagination"
          >
            ◀ Trước
          </button>

          <div className="page-input">
            <input 
              type="number" 
              min="1" 
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = Math.min(Math.max(1, Number(e.target.value)), totalPages);
                setCurrentPage(page);
              }}
            />
            <span>/ {totalPages}</span>
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
            disabled={currentPage === totalPages}
            className="btn btn-pagination"
          >
            Sau ▶
          </button>

          <button 
            onClick={() => setCurrentPage(totalPages)} 
            disabled={currentPage === totalPages}
            className="btn btn-pagination"
          >
            Cuối ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
