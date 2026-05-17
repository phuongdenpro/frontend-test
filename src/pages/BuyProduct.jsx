import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import './BuyProduct.css';

export default function BuyProduct() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const getProductName = (product) => product.name || product.productName || product.title || '';
  const getProductDescription = (product) => product.description || product.desc || product.detail || '';

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
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi tải sản phẩm!',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const normalized = getArray(response.data);
      setUsers(normalized);
      if (!selectedUserId && normalized.length > 0) {
        setSelectedUserId(normalized[0].id || normalized[0].userId || normalized[0].idUser || '');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi tải người dùng!',
      });
    }
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!selectedProduct) {
      setMessage({ type: 'error', text: 'Vui lòng chọn sản phẩm!' });
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      setMessage({ type: 'error', text: 'Số lượng phải lớn hơn 0!' });
      return;
    }

    if (isAdmin && !selectedUserId) {
      setMessage({ type: 'error', text: 'Vui lòng chọn người dùng để mua hàng.' });
      return;
    }

    try {
      setSubmitting(true);
      const productId = selectedProduct.id || selectedProduct.productId;
      const payload = {
        productId,
        quantity: qty,
      };
      if (isAdmin) {
        payload.userId = Number(selectedUserId);
      }

      await api.post('/orders/buy', payload);
      setMessage({ type: 'success', text: 'Mua hàng thành công!' });
      setSelectedProduct(null);
      setQuantity(1);

      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Lỗi mua hàng!',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container"><p>Đang tải...</p></div>;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>Mua hàng</h1>
          <p>{isAdmin ? 'Admin có thể chọn người dùng và mua hàng thay họ.' : 'Chọn sản phẩm và mua hàng ngay.'}</p>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="buy-form-card">
        <form onSubmit={handleBuy}>
          {isAdmin && (
            <div className="form-group">
              <label>Chọn người dùng:</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                required
              >
                <option value="">-- Chọn người dùng --</option>
                {users.map((user) => {
                  const userId = user.id || user.userId || user.idUser;
                  return (
                    <option key={userId} value={userId}>
                      {user.fullName || user.name || user.username || user.email}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Chọn sản phẩm:</label>
            <select
              value={selectedProduct?.id || selectedProduct?.productId || ''}
              onChange={(e) => {
                const product = products.find(
                  (p) => (p.id || p.productId) === Number(e.target.value)
                );
                setSelectedProduct(product || null);
                setQuantity(1);
              }}
              required
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map((product) => {
                const productId = product.id || product.productId;
                return (
                  <option key={productId} value={productId}>
                    {getProductName(product)} - ${product.price}
                  </option>
                );
              })}
            </select>
          </div>

          {selectedProduct && (
            <div className="product-info-card">
              <h3>{getProductName(selectedProduct)}</h3>
              <p>
                <span className="label">Giá:</span>
                <span className="value">${selectedProduct.price}</span>
              </p>
              <p>
                <span className="label">Mô tả:</span>
                <span className="value">{getProductDescription(selectedProduct)}</span>
              </p>
              <p>
                <span className="label">Có sẵn:</span>
                <span className="value">{selectedProduct.quantity} sản phẩm</span>
              </p>
            </div>
          )}

          <div className="form-group">
            <label>Số lượng:</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              max={selectedProduct?.quantity || 1}
              required
            />
            <small>
              {selectedProduct && `Tối đa: ${selectedProduct.quantity}`}
            </small>
          </div>

          {selectedProduct && (
            <div className="total-info">
              <p>
                Tổng tiền:
                <span className="total-price">
                  ${(selectedProduct.price * quantity).toFixed(2)}
                </span>
              </p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={submitting || !selectedProduct || (isAdmin && !selectedUserId)}
          >
            {submitting ? 'Đang xử lý...' : 'Mua ngay'}
          </button>
        </form>
      </div>

      <div className="products-preview">
        <h2>Danh sách sản phẩm</h2>
        <div className="products-grid">
          {products.length === 0 ? (
            <p className="no-data">Không có sản phẩm nào</p>
          ) : (
            products.map((product) => {
              const productId = product.id || product.productId;
              return (
                <div
                  key={productId}
                  className={`product-card ${selectedProduct?.id === productId ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedProduct(product);
                    setQuantity(1);
                  }}
                >
                  <h3>{getProductName(product)}</h3>
                  <p className="price">${product.price}</p>
                  <p className="description">{getProductDescription(product)}</p>
                  <p className="quantity">Có sẵn: {product.quantity}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
