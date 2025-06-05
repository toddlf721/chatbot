import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import APIService from '../services/APIService';
import './Sidebar.css';

function Sidebar({ suggestedUsers, setSuggestedUsers, users }) {
  const [searchText, setSearchText] = useState('');
  const [following, setFollowing] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [myFollowing, setMyFollowing] = useState([]);
  const [activeTab, setActiveTab] = useState('following'); // 기본 탭은 팔로우 목록
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 컴포넌트 마운트 시 사용자 정보 및 팔로우 목록 로드
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const storedUser = sessionStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          // 사용자 정보가 있으면 팔로우 목록 로드
          fetchFollowingList(user.memberNickname);
        }
      } catch (error) {
        console.error('사용자 정보 로드 중 오류:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // 팔로우 상태 변경 이벤트 감지 및 목록 새로고침
  useEffect(() => {
    const handleFollowStatusChange = () => {
      if (currentUser?.memberNickname) {
        fetchFollowingList(currentUser.memberNickname);
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [currentUser]);

  // 팔로우 목록 가져오기
  const fetchFollowingList = async (username) => {
    if (!username) return;

    setFollowLoading(true);
    try {
      const data = await APIService.getFollowing(username);

      if (Array.isArray(data)) {
        // 팔로우 목록 설정
        setMyFollowing(data.map((user, index) => ({
          id: index,
          username: user.memberNickname || user,
          fullName: user.memberName || user,
          profileImage: user.memberPhoto ? APIService.getProfileImageUrl(user.memberPhoto) : '/icon/profileimage.png',
          isFollowed: true
        })));
      }
    } catch (error) {
      console.error('팔로우 목록 로드 오류:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  // 이미지 오류 처리 함수
  const handleImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/profileimage.png';
  };

  // 팔로우 상태 초기화
  useEffect(() => {
    // isFollowed 속성을 기준으로 팔로우 상태 초기화
    const initialState = {};
    suggestedUsers.forEach(user => {
      initialState[user.id] = user.isFollowed || false;
    });
    setFollowing(initialState);
  }, [suggestedUsers]);

  // 검색 텍스트 변경 처리
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // 팔로우 상태 토글
  const handleFollowToggle = async (userId, username) => {
    setIsLoading(true);
    try {
      // 상태 확인 - 팔로우 목록의 경우는 항상 true (팔로잉 상태)
      const isCurrentlyFollowed = activeTab === 'following' ? true : (following[userId] || false);

      if (isCurrentlyFollowed) {
        // 언팔로우 처리
        await APIService.unfollowUser(username);

        // 팔로우 목록에서 제거 (언팔로우한 경우)
        setMyFollowing(prev => prev.filter(user => user.username !== username));
      } else {
        // 팔로우 처리
        await APIService.followUser(username);

        // 팔로우 목록에 추가 (새로 팔로우한 경우)
        const followedUser = suggestedUsers.find(u => u.username === username);
        if (followedUser) {
          setMyFollowing(prev => [...prev, {
            ...followedUser,
            isFollowed: true
          }]);
        }
      }

      // UI 상태 업데이트
      setFollowing(prev => ({
        ...prev,
        [userId]: !isCurrentlyFollowed
      }));

      // 팔로우 상태 변경 이벤트 발생시켜 다른 컴포넌트에도 알림
      window.dispatchEvent(new CustomEvent('followStatusChanged'));

      // 추천 사용자 목록 업데이트
      if (setSuggestedUsers) {
        setSuggestedUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId || user.username === username
              ? { ...user, isFollowed: !isCurrentlyFollowed }
              : user
          )
        );
      }
    } catch (error) {
      console.error('팔로우 상태 변경 중 오류:', error);
      alert('팔로우 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어 기반으로 필터링된 사용자 목록
  const filteredUsers = suggestedUsers.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchText.toLowerCase())
  );

  // 검색어 기반으로 필터링된 팔로우 목록
  const filteredFollowing = myFollowing.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-title-tabs">
          <h2
            className={`sidebar-title ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            팔로우 목록
          </h2>
          <h2
            className={`sidebar-title ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            팔로우 추천
          </h2>
        </div>

        <div className="sidebar-search">
          <input
            type="text"
            placeholder={activeTab === 'following' ? "팔로우 검색" : "사용자 검색"}
            value={searchText}
            onChange={handleSearchChange}
            className="sidebar-search-input"
          />
        </div>

        <div className="suggested-users-container">
          {activeTab === 'following' ? (
            // 팔로우 목록 표시
            <>
              {followLoading ? (
                <div className="sidebar-loading">팔로우 목록을 불러오는 중...</div>
              ) : filteredFollowing.length === 0 ? (
                <div className="sidebar-no-results">
                  {searchText ? "검색 결과가 없습니다." : "아직 팔로우한 사용자가 없습니다."}
                </div>
              ) : (
                <div className="suggested-users">
                  {filteredFollowing.map(user => (
                    <div key={user.id} className="suggested-user">
                      <div className="suggested-user-avatar">
                        <img
                          src={user.profileImage}
                          alt={user.username}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="suggested-user-info">
                        <Link to={`/profile/${user.username}`} className="suggested-username">
                          {user.username}
                        </Link>
                        <div className="suggested-fullname">
                          {user.fullName}
                          <span className="follow-status">팔로우 중</span>
                        </div>
                      </div>
                      <button
                        className="follow-button following"
                        onClick={() => handleFollowToggle(user.id, user.username)}
                      >
                        팔로잉
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // 추천 사용자 목록 표시
            <>
              {isLoading ? (
                <div className="sidebar-loading">사용자 정보를 불러오는 중...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="sidebar-no-results">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="suggested-users">
                  {filteredUsers.map(user => {
                    // 팔로우 상태 확인
                    const isCurrentlyFollowed = following[user.id] !== undefined
                      ? following[user.id]
                      : user.isFollowed;

                    // 프로필 이미지 URL 처리
                    const profileImageUrl = APIService.getProfileImageUrl(user.profileImage);

                    return (
                      <div key={user.id} className="suggested-user">
                        <div className="suggested-user-avatar">
                          <img
                            src={profileImageUrl}
                            alt={user.username}
                            onError={handleImageError}
                          />
                        </div>
                        <div className="suggested-user-info">
                          <Link to={`/profile/${user.username}`} className="suggested-username">
                            {user.username}
                          </Link>
                          <div className="suggested-fullname">
                            {user.fullName}
                            {isCurrentlyFollowed && <span className="follow-status">팔로우 중</span>}
                          </div>
                        </div>
                        <button
                          className={`follow-button ${isCurrentlyFollowed ? 'following' : ''}`}
                          onClick={() => handleFollowToggle(user.id, user.username)}
                          disabled={isLoading}
                        >
                          {isCurrentlyFollowed ? '팔로잉' : '팔로우'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sidebar;