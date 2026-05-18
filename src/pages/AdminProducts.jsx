import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import './AdminPages.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [currentPage, pageSize, searchTerm, minPrice, maxPrice]);

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
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: pageSize,
        keyword: searchTerm,
      });
      
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const response = await api.get(`/admin/products?${params.toString()}`);
      const data = response.data?.data || response.data;
      
      // Xử lý response có phân trang
      if (data?.items && Array.isArray(data.items)) {
        setProducts(data.items);
        setTotalProducts(data.totalCount || data.items.length);
      } else if (Array.isArray(data)) {
        setProducts(data);
        setTotalProducts(data.length);
      } else {
        setProducts(getArray(data));
      }
      
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

  if (loading) return <div className="container"><p>Đang tải...</p></div>;

  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  return (
    <div className="container">
      <h1>Quản lý sản phẩm (Admin)</h1>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Giá tối thiểu</label>
            <input
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setCurrentPage(1);
              }}
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>Giá tối đa</label>
            <input
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              min="0"
            />
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
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Số lượng</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  Không có sản phẩm nào
                </td>
              </tr>
            ) : (
              products.map((product) => (
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

      <div className="pagination-section">
        <div className="pagination-info">
          <p>Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> | Tổng: <strong>{totalProducts}</strong> sản phẩm</p>
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

      <div className="table-stats">
        <p>Đang hiển thị sản phẩm từ <strong>{(currentPage - 1) * pageSize + 1}</strong> đến <strong>{Math.min(currentPage * pageSize, totalProducts)}</strong></p>
      </div>
    </div>
  );
}
