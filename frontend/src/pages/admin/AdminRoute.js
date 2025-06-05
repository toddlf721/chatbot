// src/components/AdminRoute.js
import React, { useEffect, useState } from 'react';
import AdminAccessDenied from './AdminAccessDenied';
import APIService from '../../services/APIService';

const AdminRoute = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const user = await APIService.getCurrentUser();
        setIsAdmin(user.memberRole === 'ADMIN');
      } catch {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, []);

  if (isAdmin === null) return <p>로딩 중...</p>;

  return isAdmin ? children : <AdminAccessDenied />;
};

export default AdminRoute;
