import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './Products.css';

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productName: '',
    price: '',
    description: '',
    quantity: '',
  });

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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let response;
      try {
        response = await api.get('/products');
      } catch (error) {
        if (error.response?.status === 404) {
          response = await api.get('/admin/products');
        } else {
          throw error;
        }
      }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const callProductEndpoint = async (method, path, data = null) => {
    try {
      if (method === 'post') return await api.post(path, data);
      if (method === 'put') return await api.put(path, data);
      if (method === 'delete') return await api.delete(path);
      return null;
    } catch (error) {
      if (error.response?.status === 404 && path.startsWith('/products')) {
        const adminPath = path.replace('/products', '/admin/products');
        if (method === 'post') return await api.post(adminPath, data);
        if (method === 'put') return await api.put(adminPath, data);
        if (method === 'delete') return await api.delete(adminPath);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingId) {
        await callProductEndpoint('put', `/products/${editingId}`, formData);
        setMessage({ type: 'success', text: 'Cập nhật sản phẩm thành công!' });
      } else {
        await callProductEndpoint('post', '/products', formData);
        setMessage({ type: 'success', text: 'Thêm sản phẩm thành công!' });
      }
      setFormData({ productName: '', price: '', description: '', quantity: '' });
      setEditingId(null);
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi xử lý sản phẩm!',
      });
    }
  };

  const getProductName = (product) => product.name || product.productName || product.title || '';
  const getProductDescription = (product) => product.description || product.desc || product.detail || '';

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      productName: getProductName(product),
      price: product.price,
      description: getProductDescription(product),
      quantity: product.quantity,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return;

    try {
      await callProductEndpoint('delete', `/products/${id}`);
      setMessage({ type: 'success', text: 'Xóa sản phẩm thành công!' });
      fetchProducts();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi xóa sản phẩm!',
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ productName: '', price: '', description: '', quantity: '' });
  };

  if (loading) return <div className="container"><p>Đang tải...</p></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{isAdmin ? 'Quản lý sản phẩm' : 'Danh sách sản phẩm'}</h1>
          <p>{isAdmin ? 'Admin có thể thêm, sửa, xóa sản phẩm trong hệ thống.' : 'Xem danh sách sản phẩm sẵn có.'}</p>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {isAdmin && (
        <button
          className="btn btn-primary"
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
        >
          {showForm ? 'Hủy' : '+ Thêm sản phẩm'}
        </button>
      )}

      {isAdmin && showForm && (
        <div className="form-card">
          <h2>{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tên sản phẩm:</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleChange}
                required
                placeholder="Nhập tên sản phẩm"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Giá:</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Số lượng:</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Nhập mô tả sản phẩm"
                rows="3"
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn btn-success">
                {editingId ? 'Cập nhật' : 'Thêm'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="products-grid">
        {products.length === 0 ? (
          <p className="no-data">Không có sản phẩm nào</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-card">
              <h3>{getProductName(product)}</h3>
              <p className="price">${product.price}</p>
              <p className="description">{getProductDescription(product)}</p>
              <p className="quantity">Số lượng: <strong>{product.quantity}</strong></p>
              {isAdmin && (
                <div className="card-actions">
                  <button className="btn btn-edit" onClick={() => handleEdit(product)}>
                    Sửa
                  </button>
                  <button className="btn btn-delete" onClick={() => handleDelete(product.id)}>
                    Xóa
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
