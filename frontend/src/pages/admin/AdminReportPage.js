// src/admin/AdminReportPage.js
import React, { useState, useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';
import APIService from '../../services/APIService';

function AdminReportPage() {
  const [reports, setReports] = useState([]);

  const handleAction = (reportId, actionType) => {
    let action = '';
    let suspendUntil = null;
    let suspendReason = null;
  
    switch (actionType) {
      case '삭제':
        action = 'DELETE';
        break;
      case '무시':
        action = 'IGNORE';
        break;
      case '정지':
        const confirmBan = window.confirm("정말 이 사용자를 정지하시겠습니까?");
        if (!confirmBan) return;
  
        const days = prompt("정지 기간 (일 수)을 입력하세요:", "7");
        if (!days || isNaN(days)) return;
  
        suspendUntil = new Date();
        suspendUntil.setDate(suspendUntil.getDate() + parseInt(days));
        suspendReason = prompt("정지 사유를 입력하세요:", "신고 처리로 인한 정지");
        action = 'SUSPEND';
        break;
      default:
        return;
    }
  
    APIService.processReport({
      reportId,
      action,
      suspendUntil,
      suspendReason
    })
      .then(() => {
        alert('처리 완료되었습니다.');
        fetchReports(); // 상태 새로고침용 함수
      })
      .catch((err) => {
        console.error("신고 처리 중 오류:", err);
        alert("오류가 발생했습니다.");
      });
  };

  useEffect(() => {
    fetchReports(); // 🚀 mount 시 자동 실행
  }, []);
  
  const fetchReports = () => {
    APIService.getAllReports()
      .then(data => {
        setReports(data);
      })
      .catch(err => {
        console.error("신고 목록 가져오기 실패:", err);
      });
  };

  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="admin-main">
        <h2>신고 목록</h2>
        {reports.length === 0 ? (
          <p>신고된 항목이 없습니다.</p>
        ) : (
          <table className="admin-table admin-report-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>게시물 ID</th>
                <th>신고자</th>
                <th>사유</th>
                <th>날짜</th>
                <th>상태</th>
                <th>조치</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.reportId}>
                  <td>{report.reportId}</td>
                  <td>{report.reportedBoardNo}</td>
                  <td>{report.reporterNickname}</td>
                  <td>{report.reason}</td>
                  <td>   {report.createdAt
                    ? new Date(
                      report.createdAt[0],
                      report.createdAt[1] - 1,
                      report.createdAt[2],
                      report.createdAt[3],
                      report.createdAt[4]
                    ).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                    : '-'}</td>
                  <td>{report.status === 'PENDING' ? '대기' : '처리완료'}</td>
                  <td>
                    <button className="btn-delete" onClick={() => handleAction(report.reportId, '삭제')}>삭제</button>
                    <button className="btn-ignore" onClick={() => handleAction(report.reportId, '무시')}>무시</button>
                    <button className="btn-ban" onClick={() => handleAction(report.reportId, '정지')}>정지</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminReportPage;
