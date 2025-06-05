import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/dateUtils';
import PostModal from '../components/PostModal';
import APIService from '../services/APIService';
import './Profile.css';
import UserFollowsPanel from '../components/UserFollowsPanel'; // 새로운 컴포넌트 import

function Profile({ users, posts, studyPosts, currentUser, updateUsers, fetchPosts }) {
  const { username } = useParams();
  const [activeTab, setActiveTab] = useState('posts');
  const [activePostsSubTab, setActivePostsSubTab] = useState('keyMemory');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLiked, setIsLiked] = useState({});
  const [isSaved, setIsSaved] = useState({});
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const navigate = useNavigate();
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [localPosts, setLocalPosts] = useState([]);
  const [categoryNames, setCategoryNames] = useState({
    keyMemory: '키 메모리',
    activity1: '활동 1',
    activity2: '활동 2'
  });

  // 팔로우 팔로잉 관련
  // Profile 컴포넌트 내부에 추가할 state
  const [isFollowsPanelOpen, setIsFollowsPanelOpen] = useState(false);
  const [followsPanelTab, setFollowsPanelTab] = useState('followers');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // 사이드바가 열려있을 때 스크롤 금지 (useEffect 추가)
  useEffect(() => {
    console.log('username : ' + username);
    console.log('user : ' + user)

    if (isFollowsPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFollowsPanelOpen]);

  // 팔로워/팔로잉 정보 가져오기
  const fetchFollowStats = async () => {
    try {
      if (username) {
        // 팔로워 목록 가져오기
        const followers = await APIService.getFollowers(username);
        setFollowersCount(Array.isArray(followers) ? followers.length : 0);

        // 팔로잉 목록 가져오기
        const following = await APIService.getFollowing(username);
        setFollowingCount(Array.isArray(following) ? following.length : 0);
      }
    } catch (error) {
      console.error('팔로우 통계를 가져오는 중 오류:', error);
    }
  };

  // 마이페이지 게시글 삭제 함수
  const handleDeletePost = async (postId) => {
    // 1) 화면에서 즉시 제거
    setLocalPosts(prev => prev.filter(post => post.boardNo !== postId));

    try {
      // 2) 서버에 삭제 요청
      await APIService.deletePost(postId);
      console.log('프로필 게시물 삭제 성공');
    } catch (error) {
      console.error('삭제 실패, 복구 중…', error);
      // 3) 실패 시 전체 재로드
      if (fetchPosts) {
        const reloaded = await fetchPosts();
        setLocalPosts(reloaded.filter(post => post.memberNickname === username));
      }
    }
  };

  // 팔로워/팔로잉 패널 열기 함수 추가
  const openFollowsPanel = (tab) => {
    setFollowsPanelTab(tab);
    setIsFollowsPanelOpen(true);
    // 패널을 열 때 최신 정보 가져오기
    fetchFollowStats();
  };

  // 팔로워/팔로잉 패널 닫기 함수 추가
  const closeFollowsPanel = () => {
    setIsFollowsPanelOpen(false);
  };

  // 팔로워/팔로잉 탭 변경 처리 함수 추가
  const handleFollowTabChange = (tab) => {
    setFollowsPanelTab(tab);
  };

  // URL을 감지하고 링크로 변환하는 함수
  const convertUrlsToLinks = (text) => {
    if (!text) return '';
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0066cc', textDecoration: 'underline' }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };
  // 컨텍스트 메뉴 관련 상태
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuPostId, setContextMenuPostId] = useState(null);
  const [contextMenuCurrentCategory, setContextMenuCurrentCategory] = useState('');
  const contextMenuRef = useRef(null);
  // URL에서 사용자명을 가져와 해당 사용자 정보 설정
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError('');
      try {
        // API를 통해 사용자 정보 조회
        const userData = await APIService.getMemberByNickname(username);
        // 사용자 정보 설정
        setUser(userData);
        // 사용자 목록 업데이트
        if (updateUsers) {
          updateUsers(userData);
        }
        // 팔로우 상태 확인 (필요한 경우)
        try {
          const followStatus = await APIService.checkFollowStatus(username);
          setIsFollowing(followStatus.isFollowing);
        } catch (err) {
          console.error('팔로우 상태 확인 중 오류:', err);
        }
      } catch (err) {
        console.error('사용자 프로필 조회 중 오류:', err);
        setError('사용자를 찾을 수 없거나 탈퇴한 회원입니다.');
      } finally {
        setIsLoading(false);
      }
    };
    if (username) {
      fetchUserProfile();
      fetchFollowStats();
    }
  }, [username, updateUsers]);

  // useEffect를 추가하거나 기존 useEffect에 추가
  useEffect(() => {
    // 팔로우/언팔로우 동작 후 프로필 정보 갱신
    const handleProfileUpdate = () => {
      if (username) {
        // 약간의 지연을 두고 프로필 정보 새로고침
        setTimeout(async () => {
          try {
            const updatedUserData = await APIService.getMemberByNickname(username);
            setUser(updatedUserData);
            // 사용자 목록 업데이트
            if (updateUsers) {
              updateUsers(updatedUserData);
            }
            // 팔로워/팔로잉 통계 업데이트
            fetchFollowStats();
          } catch (err) {
            console.error('프로필 정보 갱신 중 오류:', err);
          }
        }, 300);
      }
    };
    // 이벤트 리스너 추가
    window.addEventListener('followStatusChanged', handleProfileUpdate);
    return () => {
      window.removeEventListener('followStatusChanged', handleProfileUpdate);
    };
  }, [username, updateUsers]);

  // 게시물 데이터 새로고침 이벤트 리스너 추가
  useEffect(() => {
    const handleDataRefresh = async (event) => {
      // 전체 데이터 새로고침이 요청된 경우
      if (event?.detail?.forceRefresh) {
        if (fetchPosts) {
          const refreshedPosts = await fetchPosts();
          // 프로필 소유자의 게시물만 필터링
          setLocalPosts(refreshedPosts.filter(post => post.memberNickname === username));
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('refreshData', handleDataRefresh);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('refreshData', handleDataRefresh);
    };
  }, [username, fetchPosts]);

  // 게시물 좋아요/스크랩 상태 초기화
  useEffect(() => {
    const initPostStatuses = async () => {
      if (!user) return;
      try {
        // 좋아요 및 북마크 상태 가져오기
        const likedPostsIds = await APIService.getLikedPosts();
        const savedPostsIds = await APIService.getScrappedPosts();
        // 게시물 상태 초기화 객체 생성
        const newLikedState = {};
        const newSavedState = {};
        posts.forEach(post => {
          if (post.memberNickname === username) {
            newLikedState[post.boardNo] = likedPostsIds.includes(post.boardNo);
            newSavedState[post.boardNo] = savedPostsIds.includes(post.boardNo);
          }
        });
        setIsLiked(newLikedState);
        setIsSaved(newSavedState);
      } catch (err) {
        console.error('게시물 상태 초기화 오류:', err);
      }
    };
    initPostStatuses();
  }, [user, posts, username]);

  // 컨텍스트 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (showContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showContextMenu]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePostsSubTabChange = (subTab) => {
    setActivePostsSubTab(subTab);
  };

  // 컨텍스트 메뉴 표시
  const handleContextMenu = (e, postId, currentCategory) => {
    e.preventDefault(); // 기본 컨텍스트 메뉴 방지
    // 현재 사용자가 게시물 작성자인 경우에만 컨텍스트 메뉴 표시
    if (isOwnProfile) {
      // 포지션 설정 (화면 경계 벗어나지 않게)
      const x = Math.min(e.clientX, window.innerWidth - 200);
      const y = Math.min(e.clientY, window.innerHeight - 150);
      setContextMenuPosition({ x, y });
      setContextMenuPostId(postId);
      setContextMenuCurrentCategory(currentCategory);
      setShowContextMenu(true);
    }
  };
  useEffect(() => {
    if (Array.isArray(posts)) {
      // 프로필 주인(username)의 게시물만 로컬 관리
      setLocalPosts(posts.filter(post => post.memberNickname === username));
    }
  }, [posts, username]);

  // 컨텍스트 메뉴에서 카테고리 이동 처리
  const handleMoveToCategory = async (category) => {
    try {
      // 카테고리 매핑 (UI 카테고리 -> DB 카테고리)
      const categoryMapping = {
        'keyMemory': 'keyMemory',
        'activity1': 'activity1',
        'activity2': 'activity2'
      };
      // API 호출하여 게시물 카테고리 변경
      await APIService.updateBoardCategory(contextMenuPostId, categoryMapping[category]);
      // 선택한 카테고리로 서브탭 변경
      handlePostsSubTabChange(category);
      setShowContextMenu(false);
      // 낙관적 UI 업데이트 - 목록에서 게시물 제거 후 새 카테고리에 추가
      const postToMove = filteredPosts.find(post => post.boardNo === contextMenuPostId);
      if (postToMove) {
        const updatedPost = { ...postToMove, boardCategory: categoryMapping[category] };
        // 게시물 새로고침 효과를 위해 상태 업데이트
        setLocalPosts(prevPosts =>
          prevPosts.map(post =>
            post.boardNo === contextMenuPostId ? updatedPost : post
          )
        );
      }
      // 게시물 목록 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }
      // 알림 메시지 표시
      alert(`게시물이 '${category === 'keyMemory' ? '키 메모리' : category === 'activity1' ? '활동 1' : '활동 2'}'로 이동되었습니다.`);
    } catch (error) {
      console.error('카테고리 변경 중 오류:', error);
      alert('카테고리 변경 중 오류가 발생했습니다.');
    }
  };

  // 카테고리 이름 수정 컴포넌트
  const CategoryNameEditor = ({ category, defaultName, onSave, onCancel }) => {
    const [name, setName] = useState(defaultName);
    const inputRef = useRef(null);
    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, []);
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        onSave(category, name);
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    return (
      <div className="category-name-editor">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancel()}
          maxLength={20}
          className="category-name-input"
        />
      </div>
    );
  };

  // 카테고리 이름 수정 시작
  const handleEditCategoryName = (category) => {
    setEditingCategory(category);
    setNewCategoryName(categoryNames[category]);
  };

  // 카테고리 이름 저장
  const handleSaveCategoryName = async (category, newName) => {
    if (newName.trim()) {
      try {
        // 서버에 카테고리 이름 저장
        await APIService.updateCategoryName(category, newName.trim());

        // 상태 업데이트
        setCategoryNames(prev => ({
          ...prev,
          [category]: newName.trim()
        }));

        // 성공 메시지 표시
        alert(`카테고리 이름이 "${newName.trim()}"으로 변경되었습니다.`);
      } catch (error) {
        console.error('카테고리 이름 저장 중 오류:', error);
        alert('카테고리 이름 저장 중 오류가 발생했습니다.');
      }
    }
    setEditingCategory(null);
  };

  // 카테고리 이름 수정 취소
  const handleCancelCategoryEdit = () => {
    setEditingCategory(null);
  };

  // 카테고리 이름 가져오기
  const getCategoryDisplayName = (category) => {
    return categoryNames[category] || (
      category === 'keyMemory' ? '키 메모리' :
        category === 'activity1' ? '활동 1' :
          category === 'activity2' ? '활동 2' :
            category
    );
  };

  // 사용자 정보 변경 시 카테고리 이름도 새로 불러오기
  useEffect(() => {
    if (username && user && user.memberNo) {
      // 서버에서 해당 사용자의 카테고리 이름 불러오기
      const loadUserCategoryNames = async () => {
        try {
          const categoryData = await APIService.getCategoryNames(user.memberNo);
          if (Object.keys(categoryData).length > 0) {
            setCategoryNames(categoryData);
          }
        } catch (error) {
          console.error('사용자 카테고리 이름 로드 중 오류:', error);
        }
      };

      loadUserCategoryNames();
    }
  }, [username, user]);

  const openPostModal = async (post) => {
    setSelectedPost(post);
    document.body.style.overflow = 'hidden';
    if (post) {
      await fetchComments(post.boardNo);
    }
  };

  const closePostModal = () => {
    setSelectedPost(null);
    document.body.style.overflow = 'auto';
  };

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

  // 팔로우 상태 변경
  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await APIService.unfollowUser(username);
      } else {
        await APIService.followUser(username);
      }
      setIsFollowing(!isFollowing);

      // 팔로우 상태 변경 후 통계 업데이트
      setTimeout(() => {
        fetchFollowStats();
      }, 300);

      // 팔로우 상태 변경 이벤트 발생
      window.dispatchEvent(new CustomEvent('followStatusChanged'));
    } catch (err) {
      console.error('팔로우 상태 변경 중 오류:', err);
      alert('팔로우 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 해당 사용자가 작성한 게시물만 필터링
  const userPosts = localPosts.filter(post => post.boardType === 'daily');

  // 게시물 카테고리별 필터링 (실제 카테고리 값으로 필터링)
  const keyMemoryPosts = userPosts.filter(post => post.boardCategory === 'keyMemory' || post.boardCategory === null);
  const activity1Posts = userPosts.filter(post => post.boardCategory === 'activity1');
  const activity2Posts = userPosts.filter(post => post.boardCategory === 'activity2');

  // 해당 사용자가 작성한 학습글만 필터링
  const userStudyPosts = localPosts.filter(post => post.boardType === 'study');

  // 댓글 목록을 가져오는 함수 추가
  const fetchComments = async (postId) => {
    try {
      const data = await APIService.getPostComments(postId);
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

  // 로딩 중이거나 오류 발생 시 표시할 내용
  if (isLoading) {
    return <div className="profile-loading">사용자 정보를 불러오는 중...</div>;
  }
  if (error) {
    return (
      <div className="profile-error">
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <h2>{error}</h2>
          <p>요청한 사용자를 찾을 수 없습니다.</p>
          <button className="btn-primary" onClick={() => navigate('/home')}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 현재 선택된 카테고리의 게시물 배열
  const getFilteredPosts = () => {
    switch (activePostsSubTab) {
      case 'all':
        return userPosts;
      case 'keyMemory':
        return keyMemoryPosts;
      case 'activity1':
        return activity1Posts;
      case 'activity2':
        return activity2Posts;
      default:
        return userPosts;
    }
  };

  const filteredPosts = getFilteredPosts();

  // 프로필 페이지가 현재 로그인한 사용자의 것인지 확인
  const isOwnProfile = currentUser && currentUser.memberNickname === username;

  // 이미지 오류 처리 함수
  const handleImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/image.png';
  };

  // 프로필 이미지 오류 처리 함수
  const handleProfileImageError = (e) => {
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/profileimage.png';
  };

  return (
    <div className="profile">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <img
              src={user.memberPhoto}
              alt={user.memberNickname}
              onError={handleProfileImageError}
            />
          </div>
          <div className="profile-info">
            <div className="profile-header-top">
              <h1 className="profile-username">{user.memberNickname}</h1>
              <div className="profile-buttons">
                {!isOwnProfile ? (
                  <>
                    <button
                      className={`friend-button ${isFollowing ? 'following' : ''}`}
                      onClick={handleFollowToggle}
                    >
                      {isFollowing ? '팔로잉' : '팔로우'}
                    </button>
                    <Link to={`/messageform/${username}`}>
                      <button className="message-button">
                        메세지
                      </button>
                    </Link>
                  </>
                ) : (
                  <button
                    className="edit-profile-button"
                    onClick={() => navigate('/mypage')}
                  >
                    프로필 편집
                  </button>
                )}
              </div>
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                게시물 <span>{userPosts.length}</span>
              </div>
              <div className="stat-item">
                학습 <span>{userStudyPosts.length}</span>
              </div>
              <div
                className="stat-item stat-interactive"
                onClick={() => openFollowsPanel('followers')}
              >
                팔로워 <span>{followersCount}</span>
              </div>
              <div
                className="stat-item stat-interactive"
                onClick={() => openFollowsPanel('following')}
              >
                팔로잉 <span>{followingCount}</span>
              </div>
            </div>
            <div className="profile-bio">
              <h2 className="profile-name">{user.memberName}</h2>
              <p className="profile-bio-text">{convertUrlsToLinks(user.memberIntroduce || '자기소개가 없습니다.')}</p>
            </div>
          </div>
        </div>
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => handleTabChange('posts')}
          >
            <i className="fas fa-th"></i> 게시물
            <span className="profile-tab-badge">{userPosts.length}</span>
          </button>
          <button
            className={`profile-tab ${activeTab === 'study' ? 'active' : ''}`}
            onClick={() => handleTabChange('study')}
          >
            <i className="fas fa-book"></i> 학습
            <span className="profile-tab-badge">{userStudyPosts.length}</span>
          </button>
        </div>
        <div className="profile-content">
          {activeTab === 'posts' && (
            <div className="profile-posts-container">
              {/* 서브 탭 추가 */}
              <div className="posts-subtabs">
                <button
                  className={`posts-subtab ${activePostsSubTab === 'all' ? 'active' : ''}`}
                  onClick={() => handlePostsSubTabChange('all')}
                >
                  전체
                  <span className="subtab-badge">{userPosts.length}</span>
                </button>
                <button
                  className={`posts-subtab ${activePostsSubTab === 'keyMemory' ? 'active' : ''}`}
                  onClick={() => handlePostsSubTabChange('keyMemory')}
                >
                  {editingCategory === 'keyMemory' ? (
                    <CategoryNameEditor
                      category="keyMemory"
                      defaultName={categoryNames.keyMemory}
                      onSave={handleSaveCategoryName}
                      onCancel={handleCancelCategoryEdit}
                    />
                  ) : (
                    <>
                      <span
                        className="category-name"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (isOwnProfile) {
                            handleEditCategoryName('keyMemory');
                          }
                        }}
                        title={isOwnProfile ? "우클릭으로 이름 변경" : ""}
                      >
                        {getCategoryDisplayName('keyMemory')}
                      </span>
                      <span className="subtab-badge">{keyMemoryPosts.length}</span>
                    </>
                  )}
                </button>
                <button
                  className={`posts-subtab ${activePostsSubTab === 'activity1' ? 'active' : ''}`}
                  onClick={() => handlePostsSubTabChange('activity1')}
                >
                  {editingCategory === 'activity1' ? (
                    <CategoryNameEditor
                      category="activity1"
                      defaultName={categoryNames.activity1}
                      onSave={handleSaveCategoryName}
                      onCancel={handleCancelCategoryEdit}
                    />
                  ) : (
                    <>
                      <span
                        className="category-name"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (isOwnProfile) {
                            handleEditCategoryName('activity1');
                          }
                        }}
                        title={isOwnProfile ? "우클릭으로 이름 변경" : ""}
                      >
                        {getCategoryDisplayName('activity1')}
                      </span>
                      <span className="subtab-badge">{activity1Posts.length}</span>
                    </>
                  )}
                </button>
                <button
                  className={`posts-subtab ${activePostsSubTab === 'activity2' ? 'active' : ''}`}
                  onClick={() => handlePostsSubTabChange('activity2')}
                >
                  {editingCategory === 'activity2' ? (
                    <CategoryNameEditor
                      category="activity2"
                      defaultName={categoryNames.activity2}
                      onSave={handleSaveCategoryName}
                      onCancel={handleCancelCategoryEdit}
                    />
                  ) : (
                    <>
                      <span
                        className="category-name"
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (isOwnProfile) {
                            handleEditCategoryName('activity2');
                          }
                        }}
                        title={isOwnProfile ? "우클릭으로 이름 변경" : ""}
                      >
                        {getCategoryDisplayName('activity2')}
                      </span>
                      <span className="subtab-badge">{activity2Posts.length}</span>
                    </>
                  )}
                </button>
              </div>
              {filteredPosts.length > 0 ? (
                <div className="profile-posts">
                  {filteredPosts.map(post => (
                    <div
                      key={post.boardNo}
                      className="profile-post-item"
                      onClick={() => openPostModal(post)}
                      onContextMenu={(e) => isOwnProfile && handleContextMenu(e, post.boardNo, activePostsSubTab)}
                      role="button"
                      aria-label={`${post.memberNickname}의 게시물 열기`}
                    >
                      <img
                        src={post.boardImage}
                        alt="게시물"
                        onError={handleImageError}
                      />
                      <div className="profile-post-overlay">
                        <div className="profile-post-stats">
                          <div className="post-stat">
                            <i className="fas fa-heart"></i> {post.boardLike || 0}
                          </div>
                          <div className="post-stat">
                            <i className="fas fa-comment"></i> {post.replyCount || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-tab">
                  <div className="empty-tab-message">
                    <i className="fas fa-camera empty-icon"></i>
                    <h3>아직 게시물이 없습니다</h3>
                    <p>첫 번째 게시물을 공유해보세요!</p>
                    {isOwnProfile && (
                      <Link to="/create" className="create-content-btn">
                        <i className="fas fa-plus"></i> 게시물 작성하기
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'study' && (
            <div className="profile-study-container">
              {userStudyPosts.length > 0 ? (
                <div className="study-posts">
                  {userStudyPosts.map(post => (
                    <Link to={`/study/${post.boardNo}`} key={post.boardNo} className="study-post-card">
                      <div className="study-post-image">
                        <img
                          src={post.boardImage}
                          alt={post.boardTitle}
                          onError={handleImageError}
                        />
                      </div>
                      <div className="study-post-content">
                        <div className="study-post-tags">
                          {post.tags && post.tags.map((tag, index) => (
                            <span key={index} className="study-post-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h3 className="study-post-title">{post.boardTitle}</h3>
                        <p className="study-post-excerpt">
                          {post.boardContent.replace(/<[^>]+>/g, '').split('\n')[0]}
                        </p>
                        <div className="study-post-meta">
                          <div className="study-post-author">
                            <img
                              src={user.memberPhoto}
                              alt={post.memberNickname}
                              onError={handleProfileImageError}
                            />
                            <span>{post.memberNickname}</span>
                          </div>
                          <div className="study-post-date">
                            {formatTimestamp(post.boardInputdate)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="profile-empty-tab">
                  <div className="empty-tab-message">
                    <i className="fas fa-book empty-icon"></i>
                    <h3>아직 학습 컨텐츠가 없습니다</h3>
                    <p>첫 번째 학습 컨텐츠를 공유해보세요!</p>
                    {isOwnProfile && (
                      <Link to="/create" className="create-content-btn">
                        <i className="fas fa-plus"></i> 학습 컨텐츠 작성하기
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 팔로워/팔로잉 패널 */}
      <UserFollowsPanel
        isOpen={isFollowsPanelOpen}
        handleClose={closeFollowsPanel}
        profileUsername={username}
        memberNickname={username}
        initialTab={followsPanelTab}
        changeTab={handleFollowTabChange}
      />

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
          onDelete={() => {
            handleDeletePost(selectedPost.boardNo);
            closePostModal();
          }}
          users={users}
          fetchComments={() => fetchComments(selectedPost.boardNo)}
          currentUser={currentUser}
        />
      )}
      {/* 컨텍스트 메뉴 */}
      {showContextMenu && isOwnProfile && (
        <div
          className="context-menu"
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            zIndex: 1000
          }}
        >
          <ul className="context-menu-list">
            <li className="context-menu-title">카테고리 이동</li>
            {contextMenuCurrentCategory !== 'keyMemory' && (
              <li
                className="context-menu-item"
                onClick={() => handleMoveToCategory('keyMemory')}
              >
                <i className="fas fa-key"></i> {getCategoryDisplayName('keyMemory')}로 이동
              </li>
            )}
            {contextMenuCurrentCategory !== 'activity1' && (
              <li
                className="context-menu-item"
                onClick={() => handleMoveToCategory('activity1')}
              >
                <i className="fas fa-running"></i> {getCategoryDisplayName('activity1')}로 이동
              </li>
            )}
            {contextMenuCurrentCategory !== 'activity2' && (
              <li
                className="context-menu-item"
                onClick={() => handleMoveToCategory('activity2')}
              >
                <i className="fas fa-hiking"></i> {getCategoryDisplayName('activity2')}로 이동
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
export default Profile;
