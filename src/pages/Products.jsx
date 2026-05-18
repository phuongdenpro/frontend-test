import React, { useState, useEffect } from "react";
import { useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import "./Products.css";
import customToast from "../components/Toast";

const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    productName: "",
    price: "",
    description: "",
    quantity: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortByPrice, setSortByPrice] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);
  const searchInputRef = useRef(null);
  const minPriceInputRef = useRef(null);
  const maxPriceInputRef = useRef(null);
  const navigate = useNavigate();

  const handleGoToBuy = (product) => {
    navigate("/buy-product", {
      state: { product },
    });
  };

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortByPrice,
  ]);

  const getArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const parsePagedResponse = (response) => {
    const payload = response.data;

    const items = payload?.data || [];

    const totalCount =
      payload?.totalItems ??
      payload?.totalCount ??
      payload?.totalRecords ??
      payload?.count ??
      payload?.total ??
      items.length;

    const page =
      payload?.page ?? payload?.pageNumber ?? payload?.currentPage ?? 1;

    return {
      items,
      totalCount,
      page,
    };
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let response;
      const params = new URLSearchParams({
        Page: currentPage,
        PageSize: pageSize,
        Keyword: debouncedSearch,
      });

      if (minPrice) params.append("MinPrice", minPrice);
      if (maxPrice) params.append("MaxPrice", maxPrice);
      if (sortByPrice) {
        params.append("SortByPrice", sortByPrice);
      }

      try {
        response = await api.get(`/admin/products?${params.toString()}`);
      } catch (error) {
        if (error.response?.status === 404) {
          response = await api.get(`/admin/products?${params.toString()}`);
        } else {
          throw error;
        }
      }

      const { items, totalCount, page } = parsePagedResponse(response);
      setProducts(items);
      setTotalProducts(totalCount);
      setCurrentPage(page);
      setMessage({ type: "", text: "" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Lỗi tải sản phẩm!",
      });
    } finally {
      setLoading(false);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const callProductEndpoint = async (method, path, data = null) => {
    try {
      if (method === "post") return await api.post(path, data);
      if (method === "put") return await api.put(path, data);
      if (method === "delete") return await api.delete(path);
      return null;
    } catch (error) {
      if (error.response?.status === 404 && path.startsWith("/products")) {
        const adminPath = path.replace("/admin/products", "/admin/products");
        if (method === "post") return await api.post(adminPath, data);
        if (method === "put") return await api.put(adminPath, data);
        if (method === "delete") return await api.delete(adminPath);
      }
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    console.log(formData);

    try {
      if (editingId) {
        await callProductEndpoint(
          "put",
          `/admin/products/${editingId}`,
          formData,
        );
        customToast.success("Cập nhật sản phẩm thành công!");
        // setMessage({ type: "success", text: "Cập nhật sản phẩm thành công!" });
      } else {
        await callProductEndpoint("post", "/admin/products", formData);
        customToast.success("Thêm sản phẩm thành công!");
        // setMessage({ type: "success", text: "Thêm sản phẩm thành công!" });
      }
      setFormData({
        productName: "",
        price: "",
        description: "",
        quantity: "",
      });
      setEditingId(null);
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Lỗi xử lý sản phẩm!",
      });
    }
  };

  const getProductName = (product) =>
    product.name || product.productName || product.title || "";
  const getProductDescription = (product) =>
    product.description || product.desc || product.detail || "";

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: getProductName(product),
      price: product.price,
      description: getProductDescription(product),
      quantity: product.quantity,
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn chắc chắn muốn xóa sản phẩm "${name}"?`)) return;

    try {
      await callProductEndpoint("delete", `/admin/products/${id}`);
      customToast.success("Xóa sản phẩm thành công!");
      fetchProducts();
    } catch (error) {
      customToast.error("Xóa sản phẩm thất bại!");
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Lỗi xóa sản phẩm!",
      });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ productName: "", price: "", description: "", quantity: "" });
  };

  if (loading)
    return (
      <div className="container">
        <p>Đang tải...</p>
      </div>
    );

  const totalPages = Math.ceil(totalProducts / pageSize) || 1;

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{isAdmin ? "Quản lý sản phẩm" : "Danh sách sản phẩm"}</h1>
          <p>
            {isAdmin
              ? "Quản lý có thể thêm, sửa, xóa sản phẩm trong hệ thống."
              : "Xem danh sách sản phẩm sẵn có."}
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
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
          {showForm ? "Hủy" : "+ Thêm sản phẩm"}
        </button>
      )}

      {isAdmin && showForm && (
        <div className="form-card">
          <h2>{editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Tên sản phẩm:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
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
                {editingId ? "Cập nhật" : "Thêm"}
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

      <div className="filter-section">
        <div className="search-box">
          <input
            ref={searchInputRef}
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
              ref={minPriceInputRef}
              type="number"
              placeholder="Min Price"
              value={minPrice}
              onFocus={() => (activeInputRef.current = minPriceInputRef)}
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
              ref={maxPriceInputRef}
              type="number"
              placeholder="Max Price"
              value={maxPrice}
              onFocus={() => (activeInputRef.current = maxPriceInputRef)}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              min="0"
            />
          </div>
          <div className="filter-group">
            <label>Sắp xếp giá</label>

            <select
              value={sortByPrice}
              onChange={(e) => {
                setSortByPrice(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Mặc định</option>
              <option value="asc">Giá tăng dần</option>
              <option value="desc">Giá giảm dần</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Số lượng / trang</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
              <option value={0}>Tất cả</option>
            </select>
          </div>
        </div>
      </div>

      <div className="products-grid">
        {products.length === 0 ? (
          <p className="no-data">Không có sản phẩm nào</p>
        ) : (
          products.map((product) => {
            const isOutOfStock = product.quantity <= 0;

            return (
              <div
                key={product.id}
                className={`product-card ${isOutOfStock ? "disabled" : ""}`}
                onClick={() => {
                  if (!isOutOfStock) {
                    handleGoToBuy(product);
                  }
                }}
                style={{
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  opacity: isOutOfStock ? 0.5 : 1,
                }}
              >
                <h3>{getProductName(product)}</h3>

                <p className="price">${product.price}</p>

                <p className="description">{getProductDescription(product)}</p>

                <p className="quantity">
                  {isOutOfStock ? (
                    <strong style={{ color: "red" }}>Hết hàng</strong>
                  ) : (
                    <>
                      Số lượng: <strong>{product.quantity}</strong>
                    </>
                  )}
                </p>

                {isAdmin && (
                  <div className="card-actions">
                    <button
                      className="btn btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(product);
                      }}
                    >
                      Sửa
                    </button>

                    <button
                      className="btn btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product.id, product.name);
                      }}
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="pagination-section">
        <div className="pagination-info">
          <p>
            Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>{" "}
            | Tổng: <strong>{totalProducts}</strong> sản phẩm
          </p>
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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                const page = Math.min(
                  Math.max(1, Number(e.target.value)),
                  totalPages,
                );
                setCurrentPage(page);
              }}
            />
            <span>/ {totalPages}</span>
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
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
