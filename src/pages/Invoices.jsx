import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import "./Products.css";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import customToast from "../components/Toast";
import "./Invoices.css";

export default function Invoices() {
  const { isAdmin,user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  
  // const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const normalizeList = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });
  };

  const formatDate = (item) => {
    const value =
      item.createdAt || item.date || item.orderDate || item.purchasedAt;

    if (!value) return "-";

    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);

        const endpoint = isAdmin
          ? "/order-details/admin/all"
          : "/order-details";

        const response = await api.get(endpoint, {
          params: {
            Keyword: searchTerm,
            Page: page,
            PageSize: pageSize,
          },
        });

        setOrders(normalizeList(response.data));
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.totalItems || 0);
      } catch (error) {
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Lỗi tải hóa đơn!",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAdmin, searchTerm, page, pageSize]);

  const getUserName = (item) => {
    return (
      item.fullName ||
      item.username ||
      item.user?.fullName ||
      item.user?.name ||
      item.user?.email ||
      ""
    );
  };

  const getProductName = (item) =>
    item.productName || item.name || item.product?.name || "";
  const getQuantity = (item) =>
    item.quantity ?? item.qty ?? item.orderQuantity ?? 0;
  const getPrice = (item) =>
    item.productPrice ?? item.price ?? item.product?.price ?? 0;
  const getTotal = (item) =>
    item.total ?? item.amount ?? getQuantity(item) * getPrice(item);
  const getDate = (item) => {
    const value =
      item.createdAt || item.date || item.orderDate || item.purchasedAt;
    return value ? new Date(value).toLocaleDateString("vi-VN") : "-";
  };
  const handleDelete = async (order) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hóa đơn này?")) return;

    try {
      const productId = order.productId || order.product?.id;
      const userId = order.userId || order.user?.id;

      if (isAdmin) {
        await api.delete(`/order-details/admin`, {
          params: {
            userId,
            productId,
          },
        });
      } else {
        await api.delete(`/order-details/${productId}`);
      }

      customToast.success("Xóa hóa đơn thành công!");

      setOrders((prev) =>
        prev.filter((x) => {
          const xProductId = x.productId || x.product?.id;
          const xUserId = x.userId || x.user?.id;

          if (isAdmin) {
            return !(xProductId === productId && xUserId === userId);
          }

          return xProductId !== productId;
        }),
      );
    } catch (error) {
      customToast.error(
        error.response?.data?.message || "Xóa hóa đơn thất bại!",
      );
    }
  };
  const handleView = (order) => {
    alert(`
Người dùng: ${getUserName(order) || user?.fullName || "-"}
Sản phẩm: ${getProductName(order) || "-"}
Số lượng: ${getQuantity(order)}
Giá: ${formatMoney(getPrice(order))}
Tổng tiền: ${formatMoney(getTotal(order))}
Ngày mua: ${formatDate(order)}
  `);
  };
  // const filteredOrders = useMemo(() => {
  //   const keyword = searchTerm.toLowerCase();
  //   return orders.filter((order) => {
  //     const userName = getUserName(order).toLowerCase();
  //     const productName = getProductName(order).toLowerCase();
  //     return userName.includes(keyword) || productName.includes(keyword);
  //   });
  // }, [orders, searchTerm]);

  if (loading) {
    return (
      <div className="container">
        <p>Đang tải hóa đơn...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1>{isAdmin ? "Hóa đơn tất cả user" : "Hóa đơn của tôi"}</h1>
          <p>
            {isAdmin
              ? "Xem hóa đơn toàn bộ người dùng."
              : "Xem lịch sử mua hàng của bạn."}
          </p>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <div className="search-box">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên user hoặc sản phẩm..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value="8">8 / trang</option>
          <option value="12">12 / trang</option>
          <option value="20">20 / trang</option>
          <option value="0">Tất cả</option>
        </select>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              {isAdmin && <th>Người dùng</th>}
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Giá</th>
              <th>Tổng tiền</th>
              <th>Ngày mua</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="no-data">
                  Không có hóa đơn nào.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const orderId = order.id || order.orderId || Math.random();
                return (
                  <tr key={orderId}>
                    <td>{orderId}</td>
                    {isAdmin && <td>{getUserName(order) || "-"}</td>}
                    <td>{getProductName(order) || "-"}</td>
                    <td>{getQuantity(order)}</td>
                    <td>{formatMoney(getPrice(order))}</td>
                    <td>{formatMoney(getTotal(order))}</td>
                    <td>{formatDate(order)}</td>
                    {/* <td colSpan={isAdmin ? 8 : 7} className="no-data"></td> */}
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-view"
                          onClick={() => handleView(order)}
                        >
                          Xem
                        </button>

                        <button
                          className="btn btn-delete"
                          onClick={() => handleDelete(order)}
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Trước
        </button>

        <span>
          Trang {page} / {totalPages} - Tổng {totalItems} hóa đơn
        </span>

        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
          Sau
        </button>
      </div>
    </div>
  );
}
