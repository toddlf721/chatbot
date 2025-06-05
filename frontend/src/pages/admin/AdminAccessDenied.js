// src/pages/admin/AdminAccessDenied.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminAccessDenied = () => {
  const navigate = useNavigate();

  useEffect(() => {
    alert('관리자 권한이 없습니다. 홈으로 이동합니다.');
    navigate('/home'); // 자동 이동
  }, [navigate]);

  return null; // 화면에는 아무것도 안 보이게
};

export default AdminAccessDenied;
