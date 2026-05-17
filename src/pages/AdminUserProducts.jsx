import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AdminPages.css';

export default function AdminUserProducts() {
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUserProducts();
  }, []);

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const fetchUserProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/order-details/admin/all');
      setUserProducts(getArray(response.data));
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi tải dữ liệu!',
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (item) => item.userName || item.username || item.user || '';
  const getProductName = (item) => item.productName || item.name || '';

  const filteredUserProducts = userProducts.filter((item) =>
    getUserName(item).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getProductName(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container"><p>Đang tải...</p></div>;

  return (
    <div className="container">
      <h1>Lịch sử mua hàng người dùng (Admin)</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên người dùng hoặc sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Giá (từng cái)</th>
              <th>Tổng tiền</th>
              <th>Ngày mua</th>
            </tr>
          </thead>
          <tbody>
            {filteredUserProducts.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  Không có dữ liệu nào
                </td>
              </tr>
            ) : (
              filteredUserProducts.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td className="user-name">{getUserName(item)}</td>
                  <td className="product-name">{getProductName(item)}</td>
                  <td className="quantity">{item.quantity}</td>
                  <td className="price">${item.price}</td>
                  <td className="total-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                  <td className="date">
                    {new Date(item.createdDate).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-stats">
        <p>Tổng giao dịch: <strong>{filteredUserProducts.length}</strong></p>
        <p>
          Tổng doanh thu:
          <strong>
            ${filteredUserProducts
              .reduce((sum, item) => sum + item.price * item.quantity, 0)
              .toFixed(2)}
          </strong>
        </p>
      </div>
    </div>
  );
}
