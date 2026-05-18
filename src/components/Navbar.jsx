import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/products">
            <h2>📦 Vibe Coding</h2>
          </Link>
        </div>

        <button className="hamburger" onClick={() => setShowMenu(!showMenu)}>
          ☰
        </button>

        <div className={`navbar-menu ${showMenu ? 'active' : ''}`}>
          {!user ? (
            <div className="navbar-items">
              <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Đăng nhập
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Đăng ký
              </NavLink>
            </div>
          ) : (
            <div className="navbar-items">
              <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Sản phẩm
              </NavLink>
              <NavLink to="/buy-product" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Mua hàng
              </NavLink>
              <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Hóa đơn
              </NavLink>

              {isAdmin && (
                <>
                  <NavLink to="/users" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Khách hàng
                  </NavLink>
                </>
              )}

              <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Hồ sơ
              </NavLink>

              <div className="user-info info-link d-flex flex-column justify-content-center mx-4">
                {user.role && <span className="user-role">{user.role}</span>}
                <span className="user-name">{user.fullName || user.username || user.email || 'Người dùng'}</span>
                
              </div>

              <button className="nav-link logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
