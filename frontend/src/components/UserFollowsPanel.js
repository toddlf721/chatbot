// Before: src/components/UserFollowsPanel.js 전체

// After: src/components/UserFollowsPanel.js 전체 교체
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import APIService from '../services/APIService';
import './UserFollowsPanel.css';

function UserFollowsPanel({ isOpen, handleClose, profileUsername, memberNickname, initialTab, changeTab }) {
  const [query, setQuery] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const panelRef = useRef(null);

  // 현재 로그인한 사용자 가져오기
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

  // 패널 외부 클릭 감지
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isOpen && panelRef.current && !panelRef.current.contains(e.target)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, handleClose]);

  // 팔로워/팔로잉 데이터 로드
  useEffect(() => {
    if (isOpen && memberNickname) {
      loadFollowData();
    }
  }, [isOpen, initialTab, memberNickname]);

  // 팔로워/팔로잉 데이터 로드 함수
  const loadFollowData = async () => {
    if (!memberNickname) return;

    setIsLoading(true);
    setError(null);

    try {
      if (initialTab === 'followers') {
        // 팔로워 목록 가져오기
        const data = await APIService.getFollowers(memberNickname);
        console.log('팔로워 원본 데이터:', data);
        
        if (Array.isArray(data)) {
          // 팔로워 데이터 처리
          const formattedFollowers = data.map(user => {
            // 문자열만 받은 경우
            if (typeof user === 'string') {
              return {
                id: `follower-${Math.random().toString(36).substring(2, 9)}`,
                username: user,
                fullName: user,
                profileImage: '/icon/profileimage.png',
                isFollowed: false
              };
            }
            
            // 사용자 정보가 객체로 온 경우
            return {
              id: user.memberNo || `follower-${Math.random().toString(36).substring(2, 9)}`,
              username: user.memberNickname || '사용자',
              fullName: user.memberName || user.memberNickname || '사용자',
              profileImage: user.memberPhoto ? APIService.getProfileImageUrl(user.memberPhoto) : '/icon/profileimage.png',
              isFollowed: false // 기본값
            };
          });
          
          setFollowers(formattedFollowers);
          
          // 팔로우 상태 초기화
          const statusMap = {};
          formattedFollowers.forEach(user => {
            statusMap[user.id] = user.isFollowed || false;
          });
          setFollowStatus(statusMap);
        }
      } else {
        // 팔로잉 목록 가져오기
        const data = await APIService.getFollowing(memberNickname);
        console.log('팔로잉 원본 데이터:', data);
        
        if (Array.isArray(data)) {
          // 팔로잉 데이터 처리
          const formattedFollowing = data.map(user => {
            // 문자열만 받은 경우
            if (typeof user === 'string') {
              return {
                id: `following-${Math.random().toString(36).substring(2, 9)}`,
                username: user,
                fullName: user,
                profileImage: '/icon/profileimage.png',
                isFollowed: true // 팔로잉 목록이므로 항상 true
              };
            }
            
            // 사용자 정보가 객체로 온 경우
            return {
              id: user.memberNo || `following-${Math.random().toString(36).substring(2, 9)}`,
              username: user.memberNickname || '사용자',
              fullName: user.memberName || user.memberNickname || '사용자',
              profileImage: user.memberPhoto ? APIService.getProfileImageUrl(user.memberPhoto) : '/icon/profileimage.png',
              isFollowed: true // 팔로잉 목록이므로 항상 true
            };
          });
          
          setFollowing(formattedFollowing);
          
          // 팔로우 상태 초기화 (모두 팔로잉 중)
          const statusMap = {};
          formattedFollowing.forEach(user => {
            statusMap[user.id] = true;
          });
          setFollowStatus(statusMap);
        }
      }
    } catch (err) {
      console.error('팔로우 데이터 로드 오류:', err);
      setError('팔로우 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어 변경 핸들러
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };
  
  // 검색어 초기화
  const clearQuery = () => {
    setQuery('');
  };
  
  // 팔로우 토글 처리
  const handleFollowToggle = async (userId, username) => {
    // 본인 계정이면 처리하지 않음
    if (currentUser.memberNickname === username) return;
    
    setIsLoading(true);
    try {
      const isFollowed = followStatus[userId] || false;
      
      // 팔로우 상태 변경
      if (isFollowed) {
        await APIService.unfollowUser(username);
      } else {
        await APIService.followUser(username);
      }
      
      // UI 상태 업데이트
      setFollowStatus(prev => ({
        ...prev,
        [userId]: !isFollowed
      }));
      
      // 팔로우 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('followStatusChanged'));
      
    } catch (error) {
      console.error('팔로우 상태 변경 오류:', error);
      alert('팔로우 상태를 변경할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 이미지 오류 처리
  const handleImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/profileimage.png';
  };
  
  // 필터링된 사용자 목록
  const getFilteredUsers = () => {
    const usersList = initialTab === 'followers' ? followers : following;
    
    if (!query.trim()) {
      return usersList;
    }
    
    return usersList.filter(user => 
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.fullName.toLowerCase().includes(query.toLowerCase())
    );
  };
  
  const filteredUsers = getFilteredUsers();

  return (
    <div className={`user-follows-panel ${isOpen ? 'panel-visible' : ''}`} ref={panelRef}>
      <div className="panel-header">
        <div className="tab-navigation">
          <button
            className={`tab-button ${initialTab === 'followers' ? 'tab-active' : ''}`}
            onClick={() => changeTab('followers')}
          >
            팔로워
          </button>
          <button
            className={`tab-button ${initialTab === 'following' ? 'tab-active' : ''}`}
            onClick={() => changeTab('following')}
          >
            팔로잉
          </button>
        </div>
        <button className="panel-close-btn" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="검색"
          value={query}
          onChange={handleQueryChange}
          className="member-search-input"
        />
        <i className="fas fa-search magnifier-icon"></i>
        {query && (
          <button className="clear-query-btn" onClick={clearQuery}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      <div className="members-container">
        {isLoading ? (
          <div className="loading-indicator">
            <i className="fas fa-spinner fa-spin"></i>
            <p>사용자 정보를 불러오는 중입니다</p>
          </div>
        ) : error ? (
          <div className="error-display">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-results">
            {query ? (
              <p>검색 결과가 없습니다.</p>
            ) : initialTab === 'followers' ? (
              <p>아직 팔로워가 없습니다.</p>
            ) : (
              <p>아직 팔로우하는 사용자가 없습니다.</p>
            )}
          </div>
        ) : (
          <div className="members-list">
            {filteredUsers.map(user => (
              <div key={user.id} className="member-item">
                <div className="member-avatar">
                  <img
                    src={user.profileImage}
                    alt={user.username}
                    onError={handleImageError}
                  />
                </div>
                
                <div className="member-details">
                  <Link to={`/profile/${user.username}`} className="member-nickname">
                    {user.username}
                  </Link>
                  <div className="member-name">
                    {user.fullName}
                  </div>
                </div>
                
                {/* 자신의 계정이 아닌 경우에만 팔로우 버튼 표시 */}
                {currentUser.memberNickname !== user.username && (
                  <button
                    className={`follow-action-btn ${followStatus[user.id] ? 'following-state' : ''}`}
                    onClick={() => handleFollowToggle(user.id, user.username)}
                    disabled={isLoading}
                  >
                    {followStatus[user.id] ? '팔로잉' : '팔로우'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserFollowsPanel;