import React, { useEffect, useState } from 'react';
import APIService from '../services/APIService';
import './NoticePopup.css';
import ParticlesBackground from './ParticlesBackground';

const NoticePopup = ({ notice }) => {
  const [visible, setVisible] = useState(false);
  const [hideFor24Hours, setHideFor24Hours] = useState(false);
  const [storageKey, setStorageKey] = useState(null);

  useEffect(() => {
    const checkPopup = async () => {
      try {
        const user = await APIService.getCurrentUser();
        const memberNo = user.memberNo;
        const key = `hideNoticeUntil_${memberNo}`;
        setStorageKey(key);

        const lastClosed = localStorage.getItem(key);
        const now = new Date();

        if (notice && notice.content && (!lastClosed || now > new Date(lastClosed))) {
          setVisible(true);
        }
      } catch (err) {
        console.error('공지 팝업 체크 중 오류:', err);
      }
    };

    checkPopup();
  }, [notice]);

  const handleClose = () => {
    if (hideFor24Hours && storageKey) {
      const hideUntil = new Date();
      hideUntil.setDate(hideUntil.getDate() + 1);
      localStorage.setItem(storageKey, hideUntil.toISOString());
    }
    setVisible(false);
  };

  if (!visible || !notice) return null;

  return (
    <div className="notice-popup-overlay">
      <ParticlesBackground />
      <div className="notice-popup">
        <h3>📢 공지사항</h3>
        <p>{notice.content}</p>

        <div className="notice-option">
          <label>
            <input
              type="checkbox"
              checked={hideFor24Hours}
              onChange={(e) => setHideFor24Hours(e.target.checked)}
            />
            24시간 동안 보지 않기
          </label>
        </div>

        <div className="notice-popup-buttons">
          <button className="notice-button close" onClick={handleClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default NoticePopup;
