import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { formatTimestamp } from '../utils/dateUtils';
import APIService from '../services/APIService';
import './Navbar.css';
import './navbarSearch.css';
import PostModal from './PostModal';
import axios from 'axios';

function Navbar({ user, isDarkMode, toggleDarkMode, suggestedUsers, setSuggestedUsers, fetchUserData }) {
  const [searchText, setSearchText] = useState('');
  const [activeIcon, setActiveIcon] = useState('home');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [follows, setFollows] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  //검색창
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const dropdownRef = useRef(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // 상태 변수 추가 (기존 상태 변수에 추가)
  const [isTagMode, setIsTagMode] = useState(false);


  // 알림에서 게시물모달띄우기도전
  const [selectedPost, setSelectedPost] = useState(null);
  const [commentsList, setCommentsList] = useState([]);

  const [isLiked, setIsLiked] = useState({});
  const [isSaved, setIsSaved] = useState({});
  const [currentUser, serCurrentUser] = useState(user);
  const [users, setUsers] = useState('');
  const [fetchPosts, setFetchPosts] = useState();

  const handleLike = async (postId) => {
    try {
      const currentLiked = isLiked[postId] || false;
      if (currentLiked) {
        await APIService.unlikePost(postId);
      } else {
        await APIService.likePost(postId);
      }
      setIsLiked(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
      // 게시물 목록 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }
    } catch (error) {
      console.error('좋아요 상태 변경 중 오류:', error);
    }
  };

  const handleSave = async (postId) => {
    try {
      const currentSaved = isSaved[postId] || false;
      if (currentSaved) {
        await APIService.unscrapPost(postId);
      } else {
        await APIService.scrapPost(postId);
      }
      setIsSaved(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
      // 게시물 목록 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }
    } catch (error) {
      console.error('저장 상태 변경 중 오류:', error);
    }
  };

  const closePostModal = () => {
    setSelectedPost(null);
    document.body.style.overflow = 'auto';
  };

  // 기본 프로필 이미지
  const defaultProfileImage = '/icon/profileimage.png';

  // 현재 경로에 따라 활성화된 아이콘 결정
  useEffect(() => {

    const path = location.pathname;
    if (path === '/' || path === '/home') {
      setActiveIcon('home');
    } else if (path.startsWith('/create')) {
      setActiveIcon('create');
    } else if (path.startsWith('/messages')) {
      setActiveIcon('messages');
    } else if (path.startsWith('/notifications')) {
      setActiveIcon('notifications');
    } else if (path.startsWith('/profile')) {
      setActiveIcon('profile');
    }
  }, [location]);

  // 컴포넌트 마운트 시 알림 개수만 불러옴
  useEffect(() => {
    const storedUser = sessionStorage.getItem("currentUser");

    if (!storedUser) {
      console.warn("currentUser가 세션에 없습니다.");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      serCurrentUser(parsedUser); // 상태에 저장

      // ✅ fetch는 다음 tick에서 실행되도록 지연 (보장 목적)
      setTimeout(() => {
        fetchUnreadCount();
        fetchUnreadMessageCount(parsedUser);
      }, 0);

      const interval = setInterval(() => {
        fetchUnreadCount();
        fetchUnreadMessageCount(parsedUser);
      }, 60000);

      return () => clearInterval(interval);
    } catch (e) {
      console.error("세션 사용자 파싱 실패", e);
    }
  }, []);

  // 읽지 않은 쪽지 개수 가져오기
  const fetchUnreadMessageCount = async (user) => {
    if (!user || !user.memberNo) {
      console.warn('유효하지 않은 사용자 정보:', user);
      return; // 🔐 여기가 핵심 방어 코드!
    }
    try {
      const response = await axios.get(`http://localhost:9000/api/messages/unread-count/${user.memberNo}`);
      if (response.data && response.data.count !== undefined) {
        setUnreadMessageCount(response.data.count);
      }
    } catch (error) {
      console.error('읽지 않은 쪽지 개수를 가져오는 중 오류 발생:', error);
    }
  };



  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await APIService.getNotifications();
      const formattedNotifications = data.map(notification => {
        const defaultImage = '/icon/profileimage.png';
        const type = notification.noticeType;
        const timestamp = formatTimestamp(notification.noticeInputdate);

        // 여기서 APIService의 getProfileImageUrl을 사용하여 이미지 경로 처리
        const profileImage = notification.noticeSenderPhoto ?
          APIService.getProfileImageUrl(notification.noticeSenderPhoto) :
          defaultImage;

        return {
          id: notification.noticeNo,
          type: type,
          noticeType: notification.noticeType,
          username: extractUsername(notification.noticeMessage),
          content: notification.noticeMessage.replace(/^[^님]+님/, '님'),
          timestamp: timestamp,
          image: profileImage,
          isRead: notification.noticeRead,
          boardNo: notification.noticeTypeNo || null
        };
      });

      setNotifications(formattedNotifications);

    } catch (error) {
      console.error('알림을 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 읽지 않은 알림 개수 가져오기
  const fetchUnreadCount = async () => {
    try {
      const data = await APIService.getUnreadNotificationCount();
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('읽지 않은 알림 개수를 가져오는 중 오류 발생:', error);
    }
  };

  // 알림 메시지에서 사용자명 추출
  const extractUsername = (message) => {
    const match = message.match(/^(.+?)님/);
    return match ? match[1] : '사용자';
  };

  // 검색어 변경 처리 함수
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchText(value);

    // 태그 모드 감지 (#으로 시작하면 태그 모드)
    const isTag = value.startsWith('#');
    setIsTagMode(isTag);

    if (value.trim() === '') {
      setIsDropdownVisible(false);
      setSearchResults([]);
      setIsTagMode(false);
    } else {
      setIsSearchLoading(true);

      try {
        let results = [];

        if (isTag) {
          // 태그 검색 API 호출
          const tagResults = await APIService.searchTags(value);


          setSearchResults(tagResults);
        } else {
          // 백엔드 API 호출
          console.log('닉네임 검색 : ' + value);
          const userResults = await APIService.searchUsers(value);

          // 검색 결과 가공
          const formattedResults = userResults.map(user => ({
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
            type: 'user'
          }));
          setSearchResults(formattedResults);
        }




        setIsDropdownVisible(true);
      } catch (error) {
        console.error('검색 중 오류 발생:', error);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }
  };

  // 검색 결과 항목 클릭 처리 함수 - else 추가
  const handleResultClick = (result) => {
    if (result.type === 'user') {
      // 사용자 프로필로 이동
      navigate(`/profile/${result.username}`);
    } else if (result.type === 'tag') {
      // 태그 게시물 페이지로 이동
      navigate(`/tags/${result.tagName}`);
    } else {
      // 그 외 경우 (예상치 못한 타입의 결과가 있을 경우)
      console.log('알 수 없는 결과 타입:', result.type);
      // 기본 홈으로 이동하거나 아무 작업도 하지 않을 수 있음
    }

    // 검색창 상태 초기화
    setSearchText('');
    setIsDropdownVisible(false);
    setIsTagMode(false);
  };

  const handleProfileClick = () => {
    setDropdownOpen(!dropdownOpen);
    setNotificationOpen(false);
  };

  // 알림 버튼 클릭 시 알림 목록 불러오기
  const handleNotificationClick = () => {
    setNotificationOpen(!notificationOpen);
    setDropdownOpen(false);

    if (!notificationOpen && unreadCount > 0) {
      markAllNotificationsAsRead();
    }

    if (!notificationOpen) {
      fetchNotifications();
    }
  };

  const handleCloseNotification = () => {
    setNotificationOpen(false);
  };

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = async () => {
    try {
      await APIService.markAllNotificationsAsRead();

      // UI 업데이트
      setUnreadCount(0);
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        isRead: true
      })));
    } catch (error) {
      console.error('알림 읽음 처리 중 오류 발생:', error);
    }
  };

  // 알림 삭제 기능
  const handleRemoveNotification = async (id, e) => {
    e.stopPropagation(); // 부모 요소 클릭 방지

    try {
      await APIService.deleteNotification(id);

      // UI에서 알림 제거
      setNotifications(prev => prev.filter(notification => notification.id !== id));

      // 읽지 않은 알림이었다면 카운트 감소
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('알림 삭제 중 오류 발생:', error);
    }
  };

  // 알림 읽음 처리
  const markNotificationAsRead = async (id) => {
    try {
      await APIService.markNotificationAsRead(id);

      // UI 업데이트
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // 읽지 않은 알림 카운트 감소
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 중 오류 발생:', error);
    }
  };

  // 팔로우 토글 기능
  const handleToggleFollow = async (id, username, e) => {
    e.stopPropagation(); // 부모 요소 클릭 방지

    try {
      const isFollowed = follows[id] || false;

      if (isFollowed) {
        // 언팔로우
        await APIService.unfollowUser(username);
      } else {
        // 팔로우
        await APIService.followUser(username);
      }

      // follows 상태 업데이트
      setFollows(prev => ({
        ...prev,
        [id]: !prev[id]
      }));

      // 사이드바 추천 유저 목록 업데이트
      if (!isFollowed && setSuggestedUsers && typeof setSuggestedUsers === 'function') {
        const notification = notifications.find(notif => notif.id === id);

        // 해당 사용자가 이미 추천 목록에 있는지 확인
        const existingUser = suggestedUsers.find(user => user.username === username);

        if (!existingUser && notification) {
          // 추천 목록에 새 사용자 추가
          const newUser = {
            id: suggestedUsers.length + 1,
            username: notification.username,
            fullName: notification.username.replace('_', ' '),
            isFollowed: true,
            profileImage: notification.image
          };

          setSuggestedUsers([...suggestedUsers, newUser]);
        } else if (existingUser) {
          // 이미 목록에 있다면 팔로우 상태만 변경
          const updatedUsers = suggestedUsers.map(user => {
            if (user.username === username) {
              return { ...user, isFollowed: true };
            }
            return user;
          });

          setSuggestedUsers(updatedUsers);
        }
      }

      // 데이터 새로고침
      if (fetchUserData) {
        fetchUserData();
      }
    } catch (error) {
      console.error('팔로우 상태 변경 중 오류 발생:', error);
    }
  };

  const handleNavigation = async (path) => {
    navigate(path);
    setDropdownOpen(false);
    // 마이페이지 또는 프로필 관련 페이지로 이동 시 데이터 새로고침
    if (path.includes('/mypage') || path.includes('/profile')) {
      // 데이터 새로고침
      if (fetchUserData) {
        await fetchUserData();
      }

      // 명시적으로 새로고침 이벤트 발생
      window.dispatchEvent(new CustomEvent('refreshData', {
        detail: { timestamp: Date.now(), path: path }
      }));
    }
  };

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownOpen && !e.target.closest('.dropdown')) {
        setDropdownOpen(false);
      }
      if (notificationOpen && !e.target.closest('.notification-dropdown') && !e.target.closest('.notification-close-btn')) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [dropdownOpen, notificationOpen]);

  const handleLogout = async () => {
    try {
      // 백엔드 API 호출하여 로그아웃 요청
      await APIService.logout();
      // 리다이렉션 처리
      window.location.href = '/login';
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  const handleNotificationItemClick = async (notification) => {
    const postId = notification.boardNo;
    try {
      // 게시물 데이터 가져오기
      const postData = await APIService.getPostById(postId);

      console.log('postData', postData);

      // 가져온 게시물 데이터로 모달 열기
      openPostModal(postData);
    } catch (error) {
      console.error('게시물을 가져오는 중 오류 발생:', error);
    }
  }

  // 알림에서 게시물 모달 띄우기 도전
  const openPostModal = async (postData) => {

    setSelectedPost(postData);

    console.log('selectedPost : ', selectedPost);

    document.body.style.overflow = 'hidden';
    if (postData) {
      await fetchComments(postData.boardNo);
    }
  };

  // 댓글 목록을 가져오는 함수 추가
  const fetchComments = async (noticeTypeNo) => {
    try {
      const data = await APIService.getPostComments(noticeTypeNo);
      // 현재 로그인한 사용자 정보 가져오기
      const storedUser = sessionStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      // 댓글 포맷팅
      const formattedComments = data.map(comment => {
        // 프로필 이미지 직접 URL 생성
        let profileImage = comment.memberNo ?
          `http://localhost:9000/api/images/profile/${comment.memberNo}?t=${Date.now()}` :
          '/icon/profileimage.png';
        return {
          id: comment.replyNo,
          username: comment.memberNickname,
          text: comment.replyContent,
          timestamp: formatTimestamp(comment.replyInputdate),
          profileImage: profileImage
        };
      });
      setCommentsList(formattedComments);
    } catch (error) {
      console.error('댓글을 불러오는 중 오류 발생:', error);
    }
  };

  return (
    <nav className={`navbar ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo" style={{ cursor: 'pointer' }} onClick={() => { window.location.href = '/home'; }}>
          <div className="milestone-logo">
            <img
              src="/icon/logo.png"
              alt="milestone Logo"
              className="logo-circle"
            />
            <span>MILESTONE</span>
          </div>
        </div>

        {/* 검색창 컴포넌트 전체 (태그 검색 결과 표시 방식만 수정) */}
        <div className="navbar-search-container" ref={dropdownRef}>
          <div className={`navbar-search ${isTagMode ? 'tag-mode' : ''}`}>
            <input
              type="text"
              placeholder="검색"
              value={searchText}
              onChange={handleSearchChange}
            />
            <i className="fas fa-search search-icon"></i>
          </div>

          {isDropdownVisible && (
            <div className="search-dropdown">
              {isSearchLoading ? (
                <div className="search-loading">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>검색 중...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <ul className="search-results-list">
                  {searchResults.map((result) => (
                    <li
                      key={result.id}
                      className={`search-result-item ${result.type === 'tag' ? 'tag-result' : 'user-result'}`}
                      onClick={() => handleResultClick(result)}
                    >
                      {result.type === 'user' ? (
                        <>
                          <div className="search-result-avatar">
                            <img
                              src={result.profileImage}
                              alt={result.username}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = defaultProfileImage;
                              }}
                            />
                          </div>
                          <div className="search-result-info">
                            <div className="search-result-username">{result.username}</div>
                            {result.fullName && result.fullName !== result.username && (
                              <div className="search-result-fullname">{result.fullName}</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="search-result-tag">
                          <i className="fas fa-hashtag"></i>
                          <div className="tag-info">
                            <div className="tag-name">#{result.tagName}</div>
                            <div className="tag-count">{result.postCount}건</div>
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="search-no-results">
                  <i className={isTagMode ? "fas fa-hashtag" : "fas fa-search"}></i>
                  {isTagMode ? (
                    <span>'{searchText.substring(1)}'에 대한 태그가 없습니다.</span>
                  ) : (
                    <span>'{searchText}'에 대한 검색 결과가 없습니다.</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navbar-right">
          <div className="dark-mode-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleDarkMode}
              />
              <span className="slider"></span>
            </label>
          </div>

          <div className="navbar-icons">
            <Link
              to="/home"
              className={`nav-icon ${activeIcon === 'home' ? 'active' : ''}`}
            >
              <i className="fas fa-home"></i>
            </Link>
            <Link
              to="/create"
              className={`nav-icon ${activeIcon === 'create' ? 'active' : ''}`}
            >
              <i className="fas fa-edit"></i>
            </Link>
            {user && (
              <Link
                to={`/messages/${user.memberNickname}`}
                className={`nav-icon ${activeIcon === 'messages' ? 'active' : ''}`}
              >
                <i className="far fa-paper-plane"></i>
                {unreadMessageCount > 0 && <span className="notification-badge">{unreadMessageCount}</span>}
              </Link>
            )}
            <div className="notification-dropdown">
              <div
                className={`nav-icon ${activeIcon === 'notifications' ? 'active' : ''}`}
                onClick={handleNotificationClick}
              >
                <i className="far fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </div>

              {notificationOpen && (
                <div className="notification-content" ref={notificationRef}>
                  <div className="notification-header">
                    <h3 className="notification-title">알림</h3>
                    <button className="notification-close-btn" onClick={handleCloseNotification}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  <div className="notification-list">
                    {isLoading ? (
                      <div className="empty-notification">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>알림을 불러오는 중...</p>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map(notification => {
                        const isFollowed = follows[notification.id] || false;
                        const notificationType = notification.type.toLowerCase();

                        return (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                            onClick={() => {
                              markNotificationAsRead(notification.id);
                              
                              // 사용자 프로필로 이동 (알림 발신자)
                              if (notification.username) {
                                navigate(`/profile/${notification.username}`);
                                setNotificationOpen(false);
                              }
                            }}
                          >
                            <div className="notification-avatar">
                              <img
                                src={notification.image}
                                alt={notification.username}
                                onError={(e) => {
                                  e.target.onerror = null; // 무한 루프 방지
                                  e.target.src = defaultProfileImage;
                                }}
                              />
                            </div>
                            <div className="notification-info">
                              <div className="notification-text">
                                <Link to={`/profile/${notification.username}`} className="notification-username">
                                  {notification.username}
                                </Link>
                                {notification.noticeType === 'reply' || notification.noticeType === 'likes' ? (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationItemClick(notification);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {notification.content}
                                  </span>
                                ) : (
                                  notification.content
                                )}
                              </div>
                              <div className="notification-time">{notification.timestamp}</div>
                            </div>
                            <div className="notification-actions">
                              {notificationType === 'follow' && (
                                <button
                                  className={`notification-btn ${isFollowed ? 'following' : ''}`}
                                  onClick={(e) => handleToggleFollow(notification.id, notification.username, e)}
                                >
                                  {isFollowed ? '팔로잉' : '팔로우'}
                                </button>
                              )}
                              <button
                                className="notification-delete-btn"
                                onClick={(e) => handleRemoveNotification(notification.id, e)}
                                title="알림 삭제"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-notification">
                        <i className="far fa-bell-slash"></i>
                        <p>알림이 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="dropdown">
              <div
                className={`nav-icon profile-icon ${activeIcon === 'profile' ? 'active' : ''}`}
                onClick={handleProfileClick}
              >
                <img
                  src={user?.memberPhoto}
                  alt="프로필"
                  onError={(e) => {
                    e.target.onerror = null; // 무한 루프 방지
                    e.target.src = defaultProfileImage;
                  }}
                />
              </div>
              {dropdownOpen && (
                <div className="dropdown-content">
                  <Link to={`/profile/${user?.memberNickname}`} className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <i className="fas fa-user"></i> 내 계정
                  </Link>
                  <div className="dropdown-item" onClick={() => handleNavigation("/mypage")}>
                    <i className="fas fa-id-card"></i> 마이페이지
                  </div>
                  <div className="dropdown-item" onClick={() => handleNavigation("/mypage?tab=likes")}>
                    <i className="fas fa-heart"></i> 좋아요
                  </div>
                  <div className="dropdown-item" onClick={() => handleNavigation("/mypage?tab=bookmarks")}>
                    <i className="fas fa-bookmark"></i> 북마크
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> 로그아웃
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPost && (
        <PostModal
          id={selectedPost.boardNo}
          username={selectedPost.memberNickname}
          profileImage={selectedPost.memberPhoto}
          image={selectedPost.boardImage}
          content={selectedPost.boardContent}
          likes={selectedPost.boardLike || 0}
          comments={selectedPost.replyCount || 0}
          commentsList={commentsList}
          setCommentsList={setCommentsList}
          timestamp={selectedPost.boardInputdate}
          tags={selectedPost.tags || []}
          isLiked={isLiked[selectedPost.boardNo] || false}
          isSaved={isSaved[selectedPost.boardNo] || false}
          onLike={() => handleLike(selectedPost.boardNo)}
          onSave={() => handleSave(selectedPost.boardNo)}
          onClose={closePostModal}
          users={users}
          fetchComments={() => fetchComments(selectedPost.boardNo)}
          currentUser={currentUser}
        />
      )}
    </nav>
  );
}

export default Navbar;