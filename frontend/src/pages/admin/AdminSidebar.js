import React from 'react';
import { NavLink } from 'react-router-dom';
import './AdminSidebar.css';

function AdminSidebar() {
  return (
    <div className="admin-sidebar">
      <h2 className="admin-sidebar-title">관리자 메뉴</h2>
      <ul className="admin-sidebar-menu">
        <li>
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
            대시보드
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/members" className={({ isActive }) => isActive ? 'active' : ''}>
            회원 관리
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/reports" className={({ isActive }) => isActive ? 'active' : ''}>
            신고 목록
          </NavLink>
        </li>

      </ul>
    </div>
  );
}

export default AdminSidebar;
