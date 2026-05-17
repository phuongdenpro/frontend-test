import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AdminPages.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const getProductName = (product) => product.name || product.productName || product.title || '';

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/products');
      setProducts(getArray(response.data));
      setMessage({ type: '', text: '' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi tải sản phẩm!',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    getProductName(product).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container"><p>Đang tải...</p></div>;

  return (
    <div className="container">
      <h1>Quản lý sản phẩm (Admin)</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Số lượng</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  Không có sản phẩm nào
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.id}</td>
                  <td className="product-name">{getProductName(product)}</td>
                  <td className="price">${product.price}</td>
                  <td className="quantity">{product.quantity}</td>
                  <td className="description">{product.description || product.desc || ''}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-stats">
        <p>Tổng sản phẩm: <strong>{filteredProducts.length}</strong></p>
        <p>
          Tổng giá trị:
          <strong>
            ${filteredProducts
              .reduce((sum, p) => sum + p.price * p.quantity, 0)
              .toFixed(2)}
          </strong>
        </p>
      </div>
    </div>
  );
}
