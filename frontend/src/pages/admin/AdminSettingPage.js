import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import './AdminDashboard.css';
import APIService from '../../services/APIService';

function AdminSettingPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [dmDisabled, setDmDisabled] = useState(false);
  const [reportThreshold, setReportThreshold] = useState(3);
  const [announcement, setAnnouncement] = useState('');
  const [noticeText, setNoticeText] = useState('');

  const handleNoticeSubmit = async () => {
    try {
      await APIService.saveNotice({
        content: announcement,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      alert('공지사항이 등록되었습니다.');
      setAnnouncement('');
    } catch (err) {
      console.error('공지사항 등록 실패:', err);
      alert('공지사항 등록 중 오류 발생');
    }
  };





  return (
    <div className="admin-dashboard">
      <AdminSidebar />
      <div className="admin-main">
        <h2>관리자 설정</h2>

        <div className="admin-setting-grid">
          {/* 공지사항 카드 */}
          <div className="admin-setting-card">
            <h3>📢 공지사항</h3>
            <div className="admin-setting-group">
              <label>공지 입력</label>
              <textarea
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows="5"
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>
            <button
              onClick={handleNoticeSubmit}
              style={{ marginTop: '10px', padding: '0.5rem 1rem', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              공지사항 등록
            </button>
          </div>

          {/* 시스템 옵션 카드 */}
          <div className="admin-setting-card">
            <h3>🛠️ 시스템 설정</h3>

            <div className="admin-setting-group">
              <label>
                점검 모드
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={() => setMaintenanceMode(!maintenanceMode)}
                />
              </label>
            </div>

            <div className="admin-setting-group">
              <label>
                DM 차단
                <input
                  type="checkbox"
                  checked={dmDisabled}
                  onChange={() => setDmDisabled(!dmDisabled)}
                />
              </label>
            </div>

            <div className="admin-setting-group">
              <label>
                신고 자동 숨김 기준 (건수)
                <input
                  type="number"
                  value={reportThreshold}
                  min={1}
                  max={20}
                  onChange={(e) => setReportThreshold(e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="admin-setting-preview">
          <strong>📋 현재 설정 상태:</strong>
          <p>점검 모드: <b>{maintenanceMode ? 'ON' : 'OFF'}</b></p>
          <p>DM 차단: <b>{dmDisabled ? 'ON' : 'OFF'}</b></p>
          <p>신고 자동 숨김 기준: <b>{reportThreshold}건</b></p>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingPage;
