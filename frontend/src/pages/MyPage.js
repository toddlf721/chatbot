import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/dateUtils';
import PostModal from '../components/PostModal';
import APIService from '../services/APIService';
import './MyPage.css';

function MyPage({ user, posts, likes, bookmarks, updateCurrentUser, fetchUserData, fetchPosts, fetchLikedPosts, fetchBookmarkedPosts, setLikedPosts, setBookmarkedPosts, setIsLoggedIn }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isLiked, setIsLiked] = useState({});
  const [isSaved, setIsSaved] = useState({});

  // 회원 정보 수정을 위한 상태
  const [profileImage, setProfileImage] = useState(user?.memberPhoto || '/icon/profileimage.png');
  const [previewImage, setPreviewImage] = useState(null);
  const [memberName, setMemberName] = useState(user?.memberName || '');
  const [memberNickname, setMemberNickname] = useState(user?.memberNickname || '');
  const [memberIntroduce, setMemberIntroduce] = useState(user?.memberIntroduce || '');

  // 알림 설정
  const [notificationLikes, setNotificationLikes] = useState(true);
  const [notificationComments, setNotificationComments] = useState(true);
  const [notificationFollows, setNotificationFollows] = useState(true);

  // 공개 설정
  const [privacyLevel, setPrivacyLevel] = useState('public');

  // 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  // 회원 탈퇴 확인 모달
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  const fileInputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 서브 탭 상태 관리
  const [activeSubTab, setActiveSubTab] = useState('all');

  // 좋아요 게시물 필터링 함수
  const getFilteredLikes = () => {
    switch (activeSubTab) {
      case 'study':
        return likes.filter(post => post.boardType === 'study');
      case 'daily':
      default:
        return likes.filter(post => post.boardType === 'daily');
    }
  };

  // 북마크 게시물 필터링 함수
  const getFilteredBookmarks = () => {
    switch (activeSubTab) {
      case 'study':
        return bookmarks.filter(post => post.boardType === 'study');
      case 'daily':
      default:
        return bookmarks.filter(post => post.boardType === 'daily');
    }
  };

  // 탭 변경 시 서브탭 초기화
  useEffect(() => {
    setActiveSubTab('daily');
  }, [activeTab]);

  // 이미지 URL 처리 함수 - MySQL에 저장된 이미지에 맞게 업데이트
  const getImageUrl = (imagePath) => {
    return APIService.getProfileImageUrl(imagePath);
  };

  // 이미지 로딩 오류 처리
  const handleImageError = (e) => {
    console.log("이미지 로딩 실패, 기본 이미지로 대체");
    e.target.onerror = null; // 무한 루프 방지
    e.target.src = '/icon/profileimage.png';
  };

  // URL 쿼리 파라미터에서 탭 설정
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam && ['profile', 'likes', 'bookmarks', 'notification', 'privacy', 'withdraw'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      setMemberName(user.memberName || '');
      setMemberNickname(user.memberNickname || '');
      setMemberIntroduce(user.memberIntroduce || '');
      setProfileImage(user.memberPhoto || '/icon/profileimage.png');

      // 공개 설정 초기화 - 비공개(private) 옵션 추가
      if (user.memberVisible) {
        // 기존 값이 'logined'인 경우, 'private'으로 맵핑
        if (user.memberVisible === 'logined') {
          setPrivacyLevel('private');
        } else {
          setPrivacyLevel(user.memberVisible);
        }
      }

      // 알림 설정 초기화 로직 (사용자 설정이 저장되어 있다면 여기서 로드)
      // 현재는 기본값으로 설정되어 있음
    }
  }, [user]);

  // 게시물 상태 초기화
  useEffect(() => {
    const initializePostStatuses = async () => {
      try {
        // 좋아요 및 북마크 상태 초기화
        const newLikedState = {};
        const newSavedState = {};

        // likes와 bookmarks 배열의 각 게시물에 대해 상태 설정
        likes.forEach(post => {
          newLikedState[post.boardNo] = true;
        });

        bookmarks.forEach(post => {
          newSavedState[post.boardNo] = true;
        });

        setIsLiked(newLikedState);
        setIsSaved(newSavedState);
      } catch (error) {
        console.error('게시물 상태 초기화 중 오류:', error);
      }
    };

    initializePostStatuses();
  }, [likes, bookmarks]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // URL 쿼리 파라미터 업데이트 (브라우저 히스토리에 기록)
    navigate(`/mypage?tab=${tab}`, { replace: true });
  };

  // 이미지 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 이미지 파일 타입 검증
      if (!file.type.match('image.*')) {
        setError('이미지 파일만 업로드 가능합니다.');
        return;
      }

      // 파일 크기 검증 (10MB 이하)
      if (file.size > 10 * 1024 * 1024) {
        setError('파일 크기는 10MB 이하여야 합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setError(''); // 에러 초기화
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 변경 버튼 클릭 핸들러
  const handleImageButtonClick = () => {
    fileInputRef.current.click();
  };

  // 이미지 초기화 핸들러
  const handleResetImage = () => {
    // 기본 이미지로 설정
    setProfileImage('/icon/profileimage.png');
    setPreviewImage(null);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 회원 정보 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!memberName.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }

    if (!memberNickname.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // FormData 객체 생성
      const formData = new FormData();
      formData.append('memberName', memberName);
      formData.append('memberNickname', memberNickname);
      formData.append('memberIntroduce', memberIntroduce || '');

      // 새로운 프로필 이미지가 있는 경우 파일 추가
      if (fileInputRef.current.files[0]) {
        formData.append('profileImage', fileInputRef.current.files[0]);
      }

      // 프로필 이미지 초기화인 경우 추가 파라미터 전송
      if (profileImage === '/icon/profileimage.png' && !previewImage) {
        formData.append('resetProfileImage', 'true');
      }

      // API 요청
      const updatedUser = await APIService.updateProfile(formData);

      // 성공 메시지 표시
      setSuccessMessage('프로필 정보가 성공적으로 업데이트되었습니다.');

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      // 프로필 이미지 및 미리보기 업데이트
      console.log('서버 응답 이미지 경로:', updatedUser.memberPhoto); // 디버깅용

      // 캐시 무효화를 위해 타임스탬프 추가
      const timestamp = Date.now();
      let newProfileImage = updatedUser.memberPhoto;

      // 이미 타임스탬프가 포함된 URL인지 확인하고 새 타임스탬프 추가
      if (newProfileImage && newProfileImage !== '/icon/profileimage.png') {
        if (newProfileImage.includes('?')) {
          newProfileImage = newProfileImage.split('?')[0] + `?t=${timestamp}`;
        } else {
          newProfileImage = newProfileImage + `?t=${timestamp}`;
        }
      }

      setProfileImage(newProfileImage);
      setPreviewImage(null);

      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 부모 컴포넌트 상태 업데이트 (앱 전체에 변경 반영)
      if (updateCurrentUser) {
        updateCurrentUser(updatedUser);
      }

      // 전체 데이터 새로고침 (중요: 이미지 변경 후 모든 데이터 새로고침)
      if (fetchUserData) {
        await fetchUserData();
      }

      // 브라우저 캐시 새로고침 강제 적용 (프로필 이미지가 변경된 경우)
      if (newProfileImage && newProfileImage !== '/icon/profileimage.png') {
        const newImg = new Image();
        // 타임스탬프를 포함한 URL로 이미지 강제 새로고침
        newImg.src = newProfileImage;

        // 이미지 로드 이벤트를 기다림
        newImg.onload = () => {
          // 이미지가 로드된 후 명시적으로 프로필 업데이트 이벤트 발생
          const profileUpdateEvent = new CustomEvent('profileUpdated', {
            detail: { timestamp, userId: updatedUser.memberNo }
          });
          window.dispatchEvent(profileUpdateEvent);

          // 세션 스토리지 업데이트 - 캐시 방지를 위한 타임스탬프 포함
          const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
          currentUser.memberPhoto = newProfileImage;
          sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

          // 스토리지 변경 이벤트 발생
          window.dispatchEvent(new Event('storage'));

          console.log('프로필 이미지 새로고침 완료:', newProfileImage);
        };
      } else {
        // 기본 이미지로 변경된 경우에도 이벤트 발생
        window.dispatchEvent(new CustomEvent('profileUpdated'));
        window.dispatchEvent(new Event('storage'));
      }

    } catch (err) {
      console.error('프로필 업데이트 오류:', err);
      setError(err.message || '프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 알림 설정 저장 핸들러
  const handleSaveNotificationSettings = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // FormData 객체 생성
      const formData = new FormData();

      // 알림 설정을 JSON 형태로 저장
      const notificationSettings = JSON.stringify({
        likes: notificationLikes,
        comments: notificationComments,
        follows: notificationFollows
      });

      formData.append('notificationSettings', notificationSettings);

      // API 요청
      await APIService.updateProfile(formData);

      // 성공 메시지 표시
      setSuccessMessage('알림 설정이 성공적으로 저장되었습니다.');

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err) {
      console.error('알림 설정 저장 오류:', err);
      setError(err.message || '알림 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 공개 설정 저장 핸들러
  const handleSavePrivacySettings = async () => {
    try {
      setIsSubmitting(true);
      setError('');
  
      // FormData 객체 생성
      const formData = new FormData();
  
      // 'private' 값은 API에 전송할 때 'private'로 설정
      formData.append('memberVisible', privacyLevel);
  
      // API 요청
      const updatedUser = await APIService.updateProfile(formData);
  
      // 성공 메시지 표시
      setSuccessMessage('공개 설정이 성공적으로 저장되었습니다.');
  
      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
  
      // 부모 컴포넌트 상태 업데이트 (앱 전체에 변경 반영)
      if (updateCurrentUser) {
        updateCurrentUser(updatedUser);
      }
  
      // 게시물 목록 새로고침 (새 권한 설정 반영)
      if (fetchPosts) {
        await fetchPosts();
      }
      
      // 데이터 새로고침 이벤트 발생
      window.dispatchEvent(new CustomEvent('refreshData', {
        detail: { timestamp: Date.now(), type: 'posts' }
      }));
  
    } catch (err) {
      console.error('공개 설정 저장 오류:', err);
      setError(err.message || '공개 설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 회원 탈퇴 처리 핸들러
  const handleWithdrawMember = async () => {
    try {
      setIsSubmitting(true);

      // 회원 탈퇴 API 호출
      await APIService.withdrawMember();

      // 로그아웃 API 호출 (세션스토리지 정리 및 서버 로그아웃)
      await APIService.logout();

      // setIsLoggedIn prop이 있으면 false로 설정 (App에서 내려줄 경우)
      if (typeof setIsLoggedIn === 'function') {
        setIsLoggedIn(false);
      }

      // 로그인 페이지로 이동
      navigate('/login');

    } catch (err) {
      console.error('회원 탈퇴 오류:', err);
      setError(err.message || '회원 탈퇴 처리 중 오류가 발생했습니다.');
      setShowWithdrawConfirm(false);
      setIsSubmitting(false);
    }
  };

  // 폼 초기화 핸들러
  const handleFormReset = () => {
    // 원래 사용자 정보로 상태 복원
    setMemberName(user.memberName || '');
    setMemberNickname(user.memberNickname || '');
    setMemberIntroduce(user.memberIntroduce || '');
    setProfileImage(user.memberPhoto || '/icon/profileimage.png');
    setPreviewImage(null);
    setError('');

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 모달 열기
  const openPostModal = async (post) => {
    // 학습 게시물인 경우 해당 페이지로 이동
    if (post.boardType === 'study') {
      navigate(`/study/${post.boardNo}`);
      return;
    }

    try {
      // 최신 게시물 정보 가져오기
      const postId = post.id || post.boardNo;
      let currentPostData = post;

      // API를 통해 최신 게시물 정보 가져오기
      try {
        const latestPostData = await APIService.getPostById(postId);
        if (latestPostData) {
          currentPostData = {
            ...post,
            ...latestPostData,
            // 기존 속성 유지를 위한 병합
            id: postId,
            boardNo: postId,
            boardLike: latestPostData.boardLike || post.boardLike || 0,
            boardContent: latestPostData.boardContent || post.boardContent,
            tags: latestPostData.tags || post.tags || []
          };
        }
      } catch (err) {
        console.warn('최신 게시물 정보 로드 실패, 캐시된 정보 사용:', err);
      }

      // 댓글 불러오기
      const comments = await APIService.getPostComments(postId);
      const formattedComments = comments.map(comment => ({
        id: comment.replyNo,
        username: comment.memberNickname,
        text: comment.replyContent,
        timestamp: formatTimestamp(comment.replyInputdate),
        profileImage: comment.memberNo ? `http://localhost:9000/api/images/profile/${comment.memberNo}?t=${Date.now()}` : '/icon/profileimage.png'
      }));

      // 각 게시물의 현재 좋아요, 저장 상태 확인하여 정확하게 설정
      setSelectedPost({
        ...currentPostData,
        isLiked: isLiked[postId] || false,
        isSaved: isSaved[postId] || false,
        commentsList: formattedComments,
        timestamp: currentPostData.boardInputdate,
        likes: currentPostData.boardLike || 0,
        comments: formattedComments.length
      });
      document.body.style.overflow = 'hidden';
    } catch (error) {
      console.error('게시물 모달 준비 중 오류:', error);
    }
  };

  // 모달 닫기
  const closePostModal = () => {
    setSelectedPost(null);
    document.body.style.overflow = 'auto';
  };

  const handleLike = async (postId) => {
    try {
      const currentLiked = isLiked[postId] || false;
      let updatedPost;

      if (currentLiked) {
        await APIService.unlikePost(postId);
        // 좋아요 취소 시 카운트 감소
        if (selectedPost && selectedPost.boardNo === postId) {
          setSelectedPost(prev => ({
            ...prev,
            boardLike: Math.max(0, (prev.boardLike || 0) - 1)
          }));
        }
      } else {
        await APIService.likePost(postId);
        // 좋아요 추가 시 카운트 증가
        if (selectedPost && selectedPost.boardNo === postId) {
          setSelectedPost(prev => ({
            ...prev,
            boardLike: (prev.boardLike || 0) + 1
          }));
        }
      }

      // UI 상태 즉시 업데이트
      setIsLiked(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      // 해당 게시물 정보 업데이트
      const updatedPostInfo = await APIService.getPostById(postId);

      // 좋아요 목록 확인 - 좋아요/북마크 탭일 때 목록 업데이트
      const activeTabIslikes = activeTab === 'likes';

      // 데이터 새로고침 - 좋아요 목록 직접 갱신
      if (fetchLikedPosts) {
        const updatedLikedPosts = await fetchLikedPosts();
        if (setLikedPosts) {
          setLikedPosts(updatedLikedPosts);
        }
      }

      // 게시물 전체 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }
    } catch (error) {
      console.error('좋아요 상태 변경 중 오류:', error);
    }
  };

  // 저장 상태 변경
  const handleSave = async (postId) => {
    try {
      const currentSaved = isSaved[postId] || false;

      if (currentSaved) {
        await APIService.unscrapPost(postId);
      } else {
        await APIService.scrapPost(postId);
      }

      // UI 상태 즉시 업데이트
      setIsSaved(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));

      // 해당 게시물 정보 업데이트
      const updatedPostInfo = await APIService.getPostById(postId);

      // 북마크 목록 확인 - 북마크 탭일 때 목록 업데이트
      const activeTabIsBookmarks = activeTab === 'bookmarks';

      // 데이터 새로고침 - 북마크 목록 직접 갱신
      if (fetchBookmarkedPosts) {
        const updatedBookmarks = await fetchBookmarkedPosts();
        if (setBookmarkedPosts) {
          setBookmarkedPosts(updatedBookmarks);
        }
      }

      // 게시물 전체 새로고침
      if (fetchPosts) {
        await fetchPosts();
      }
    } catch (error) {
      console.error('저장 상태 변경 중 오류:', error);
    }
  };

  return (
    <div className="mypage">
      <div className="mypage-container">
        <div className="mypage-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              <img
                src={previewImage || (profileImage ? APIService.getProfileImageUrl(profileImage) : '/icon/profileimage.png')}
                alt={user?.memberNickname || '사용자'}
                onError={handleImageError}
              />
            </div>
            <h2 className="sidebar-username">{user?.memberNickname || '사용자'}</h2>
            <p className="sidebar-name">{user?.memberName || ''}</p>
            <p className="sidebar-introduce">{convertUrlsToLinks(user?.memberIntroduce)}</p>
          </div>

          <div className="sidebar-menu">
            <button
              className={`sidebar-menu-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
            >
              <i className="fas fa-user-edit"></i>
              <span>회원정보 수정</span>
            </button>
            <button
              className={`sidebar-menu-item ${activeTab === 'likes' ? 'active' : ''}`}
              onClick={() => handleTabChange('likes')}
            >
              <i className="fas fa-heart"></i>
              <span>좋아요</span>
            </button>
            <button
              className={`sidebar-menu-item ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => handleTabChange('bookmarks')}
            >
              <i className="fas fa-bookmark"></i>
              <span>북마크</span>
            </button>
            <button
              className={`sidebar-menu-item ${activeTab === 'notification' ? 'active' : ''}`}
              onClick={() => handleTabChange('notification')}
            >
              <i className="fas fa-bell"></i>
              <span>알림 설정</span>
            </button>
            <button
              className={`sidebar-menu-item ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => handleTabChange('privacy')}
            >
              <i className="fas fa-lock"></i>
              <span>공개 설정</span>
            </button>
            <button
              className={`sidebar-menu-item sidebar-menu-item-withdraw ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => handleTabChange('withdraw')}
            >
              <i className="fas fa-user-times"></i>
              <span>회원 탈퇴</span>
            </button>
          </div>
        </div>

        <div className="mypage-content">
          {activeTab === 'profile' && (
            <div className="mypage-section">
              <h2 className="section-title">회원정보 수정</h2>

              {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="success-message" style={{ color: 'green', marginBottom: '15px' }}>
                  {successMessage}
                </div>
              )}

              <form className="profile-edit-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>프로필 이미지</label>
                  <div className="profile-image-upload">
                    <img
                      src={previewImage || (profileImage ? APIService.getProfileImageUrl(profileImage) : '/icon/profileimage.png')}
                      alt={user?.memberNickname || '사용자'}
                      onError={handleImageError}
                    />
                    <div className="profile-image-buttons">
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                      <button
                        type="button"
                        className="upload-btn"
                        onClick={handleImageButtonClick}
                      >
                        이미지 변경
                      </button>
                      <button
                        type="button"
                        className="upload-btn"
                        onClick={handleResetImage}
                      >
                        기본 이미지로 초기화
                      </button>
                      {previewImage && (
                        <button
                          type="button"
                          className="upload-cancel-btn"
                          onClick={() => setPreviewImage(null)}
                        >
                          취소
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="memberName">이름</label>
                  <input
                    type="text"
                    id="memberName"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="memberNickname">닉네임</label>
                  <input
                    type="text"
                    id="memberNickname"
                    value={memberNickname}
                    onChange={(e) => setMemberNickname(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="memberIntroduce">소개</label>
                  <textarea
                    id="memberIntroduce"
                    value={memberIntroduce}
                    onChange={(e) => setMemberIntroduce(e.target.value)}
                    className="form-textarea"
                    rows="4"
                    placeholder="자기소개를 입력해주세요. https:// 로 시작하는 URL은 자동으로 링크로 변환됩니다."
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '저장 중...' : '저장하기'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={handleFormReset}
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="mypage-section">
              <h2 className="section-title">좋아요한 게시물</h2>

              {/* 서브 탭 추가 */}
              <div className="posts-subtabs">
                <button
                  className={`posts-subtab ${activeSubTab === 'daily' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('daily')}
                >
                  게시물
                  <span className="subtab-badge">{likes.filter(post => post.boardType === 'daily').length}</span>
                </button>
                <button
                  className={`posts-subtab ${activeSubTab === 'study' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('study')}
                >
                  학습
                  <span className="subtab-badge">{likes.filter(post => post.boardType === 'study').length}</span>
                </button>
              </div>

              {activeSubTab === 'study' ? (
                // 학습 게시물 리스트 형태로 표시
                <div className="study-posts">
                  {getFilteredLikes().length > 0 ? (
                    getFilteredLikes().map(post => (
                      <div
                        key={post.id || post.boardNo}
                        className="study-post-card"
                        onClick={() => openPostModal(post)}
                      >
                        <div className="study-post-image">
                          <img
                            src={APIService.getProcessedImageUrl(post.boardImage) || '/icon/image.png'}
                            alt={post.boardTitle || "게시물"}
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
                          <h3 className="study-post-title">{post.boardTitle || "제목 없음"}</h3>
                          <p className="study-post-excerpt">
                            {post.boardContent ? post.boardContent.replace(/<[^>]+>/g, '').split('\n')[0] : "내용 없음"}
                          </p>
                          <div className="study-post-meta">
                            <div className="study-post-author">
                              <img
                                src={APIService.getProfileImageUrl(post.memberPhoto) || '/icon/profileimage.png'}
                                alt={post.memberNickname}
                                onError={handleImageError}
                              />
                              <span>{post.memberNickname}</span>
                            </div>
                            <div className="study-post-date">
                              {formatTimestamp(post.boardInputdate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-content">
                      <i className="fas fa-book empty-icon"></i>
                      <h3>좋아요한 학습 게시물이 없습니다</h3>
                      <p>학습 게시물을 좋아요하면 여기에 표시됩니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                // 일반 게시물은 그리드 형태로 표시 (기존과 동일)
                <div className="posts-grid">
                  {getFilteredLikes().length > 0 ? (
                    getFilteredLikes().map(post => (
                      <div
                        key={post.id || post.boardNo}
                        className="grid-item"
                        onClick={() => openPostModal(post)}
                        role="button"
                        aria-label={`${post.memberNickname}의 게시물 열기`}
                      >
                        <img
                          src={APIService.getProcessedImageUrl(post.boardImage) || '/icon/image.png'}
                          alt="게시물"
                          onError={handleImageError}
                        />
                        <div className="grid-item-overlay">
                          <div className="grid-item-stats">
                            <div className="stat-item">
                              <i className="fas fa-heart"></i> {post.boardLike || 0}
                            </div>
                            <div className="stat-item">
                              <i className="fas fa-comment"></i> {post.replyCount || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-content">
                      <i className="fas fa-heart empty-icon"></i>
                      <h3>좋아요한 게시물이 없습니다</h3>
                      <p>게시물에 좋아요를 누르면 여기에 표시됩니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'bookmarks' && (
            <div className="mypage-section">
              <h2 className="section-title">북마크한 게시물</h2>

              {/* 서브 탭 추가 */}
              <div className="posts-subtabs">
                <button
                  className={`posts-subtab ${activeSubTab === 'daily' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('daily')}
                >
                  게시물
                  <span className="subtab-badge">{bookmarks.filter(post => post.boardType === 'daily').length}</span>
                </button>
                <button
                  className={`posts-subtab ${activeSubTab === 'study' ? 'active' : ''}`}
                  onClick={() => setActiveSubTab('study')}
                >
                  학습
                  <span className="subtab-badge">{bookmarks.filter(post => post.boardType === 'study').length}</span>
                </button>
              </div>

              {activeSubTab === 'study' ? (
                // 학습 게시물 리스트 형태로 표시
                <div className="study-posts">
                  {getFilteredBookmarks().length > 0 ? (
                    getFilteredBookmarks().map(post => (
                      <div
                        key={post.id || post.boardNo}
                        className="study-post-card"
                        onClick={() => openPostModal(post)}
                      >
                        <div className="study-post-image">
                          <img
                            src={APIService.getProcessedImageUrl(post.boardImage) || '/icon/image.png'}
                            alt={post.boardTitle || "게시물"}
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
                          <h3 className="study-post-title">{post.boardTitle || "제목 없음"}</h3>
                          <p className="study-post-excerpt">
                            {post.boardContent ? post.boardContent.replace(/<[^>]+>/g, '').split('\n')[0] : "내용 없음"}
                          </p>
                          <div className="study-post-meta">
                            <div className="study-post-author">
                              <img
                                src={APIService.getProfileImageUrl(post.memberPhoto) || '/icon/profileimage.png'}
                                alt={post.memberNickname}
                                onError={handleImageError}
                              />
                              <span>{post.memberNickname}</span>
                            </div>
                            <div className="study-post-date">
                              {new Date(post.boardInputdate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-content">
                      <i className="fas fa-book empty-icon"></i>
                      <h3>북마크한 학습 게시물이 없습니다</h3>
                      <p>학습 게시물을 저장하면 여기에 표시됩니다.</p>
                    </div>
                  )}
                </div>
              ) : (
                // 일반 게시물은 그리드 형태로 표시 (기존과 동일)
                <div className="posts-grid">
                  {getFilteredBookmarks().length > 0 ? (
                    getFilteredBookmarks().map(post => (
                      <div
                        key={post.id || post.boardNo}
                        className="grid-item"
                        onClick={() => openPostModal(post)}
                        role="button"
                        aria-label={`${post.memberNickname}의 게시물 열기`}
                      >
                        <img
                          src={APIService.getProcessedImageUrl(post.boardImage) || '/icon/image.png'}
                          alt="게시물"
                          onError={handleImageError}
                        />
                        <div className="grid-item-overlay">
                          <div className="grid-item-stats">
                            <div className="stat-item">
                              <i className="fas fa-heart"></i> {post.boardLike || 0}
                            </div>
                            <div className="stat-item">
                              <i className="fas fa-comment"></i> {post.replyCount || 0}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-content">
                      <i className="fas fa-bookmark empty-icon"></i>
                      <h3>북마크한 게시물이 없습니다</h3>
                      <p>게시물을 저장하면 여기에 표시됩니다.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="mypage-section">
              <h2 className="section-title">알림 설정</h2>

              {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="success-message" style={{ color: 'green', marginBottom: '15px' }}>
                  {successMessage}
                </div>
              )}

              <div className="notification-settings">
                <div className="setting-group">
                  <div className="setting-item">
                    <div className="setting-info">
                      <h3>좋아요</h3>
                      <p>내 게시물에 좋아요를 누를 때 알림 받기</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationLikes}
                        onChange={() => setNotificationLikes(!notificationLikes)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h3>댓글</h3>
                      <p>내 게시물에 댓글이 달릴 때 알림 받기</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationComments}
                        onChange={() => setNotificationComments(!notificationComments)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h3>팔로우</h3>
                      <p>새로운 팔로워가 생길 때 알림 받기</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={notificationFollows}
                        onChange={() => setNotificationFollows(!notificationFollows)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSaveNotificationSettings}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="mypage-section">
              <h2 className="section-title">공개 설정</h2>

              {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="success-message" style={{ color: 'green', marginBottom: '15px' }}>
                  {successMessage}
                </div>
              )}

              <div className="privacy-settings">
                <div className="setting-group">
                  <h3 className="setting-group-title">계정 공개 범위</h3>
                  <p className="setting-group-desc">계정 및 게시물의 공개 범위를 설정하세요.</p>

                  <div className="privacy-options">
                    <div className="privacy-option">
                      <input
                        type="radio"
                        id="public"
                        name="privacy"
                        value="public"
                        checked={privacyLevel === 'public'}
                        onChange={() => setPrivacyLevel('public')}
                      />
                      <label htmlFor="public">
                        <div className="option-info">
                          <h4>전체 공개</h4>
                          <p>모든 사용자가 프로필 및 게시물을 볼 수 있습니다.</p>
                        </div>
                      </label>
                    </div>

                    <div className="privacy-option">
                      <input
                        type="radio"
                        id="follow"
                        name="privacy"
                        value="follow"
                        checked={privacyLevel === 'follow'}
                        onChange={() => setPrivacyLevel('follow')}
                      />
                      <label htmlFor="follow">
                        <div className="option-info">
                          <h4>팔로워 공개</h4>
                          <p>나를 팔로우한 사용자만 프로필 및 게시물을 볼 수 있습니다.</p>
                        </div>
                      </label>
                    </div>

                    <div className="privacy-option">
                      <input
                        type="radio"
                        id="private"
                        name="privacy"
                        value="private"
                        checked={privacyLevel === 'private'}
                        onChange={() => setPrivacyLevel('private')}
                      />
                      <label htmlFor="private">
                        <div className="option-info">
                          <h4>비공개</h4>
                          <p>내 프로필 및 게시물을 아무도 볼 수 없습니다.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleSavePrivacySettings}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="mypage-section mypage-withdraw-section">
              <h2 className="section-title">회원 탈퇴</h2>

              {error && (
                <div className="error-message" style={{ color: 'red', marginBottom: '15px' }}>
                  {error}
                </div>
              )}

              <div className="withdraw-content">
                <div className="withdraw-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                  <h3>회원 탈퇴 전 아래 내용을 꼭 확인해주세요.</h3>
                </div>

                <div className="withdraw-info">
                  <p>회원 탈퇴 시 모든 데이터는 복구할 수 없습니다.</p>
                  <ul>
                    <li>계정 정보 (이메일, 닉네임, 프로필 등)</li>
                    <li>작성한 게시물 및 댓글</li>
                    <li>팔로우/팔로잉 관계</li>
                    <li>좋아요 및 북마크한 게시물</li>
                  </ul>
                </div>

                <div className="withdraw-button-container">
                  <button
                    className="withdraw-button"
                    onClick={() => setShowWithdrawConfirm(true)}
                    disabled={isSubmitting}
                  >
                    회원 탈퇴하기
                  </button>
                </div>
              </div>

              {/* 회원 탈퇴 확인 모달 */}
              {showWithdrawConfirm && (
                <div className="withdraw-confirm-overlay">
                  <div className="withdraw-confirm-modal">
                    <div className="withdraw-confirm-header">
                      <h3>회원 탈퇴 확인</h3>
                      <button
                        className="withdraw-confirm-close"
                        onClick={() => setShowWithdrawConfirm(false)}
                        disabled={isSubmitting}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="withdraw-confirm-content">
                      <p>정말로 탈퇴하시겠습니까?</p>
                      <p>탈퇴 후에는 모든 정보를 복구할 수 없습니다.</p>
                    </div>
                    <div className="withdraw-confirm-buttons">
                      <button
                        className="withdraw-cancel-button"
                        onClick={() => setShowWithdrawConfirm(false)}
                        disabled={isSubmitting}
                      >
                        취소
                      </button>
                      <button
                        className="withdraw-confirm-button"
                        onClick={handleWithdrawMember}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? '처리 중...' : '탈퇴하기'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <PostModal
          id={selectedPost.id || selectedPost.boardNo}
          username={selectedPost.username || selectedPost.memberNickname}
          profileImage={getImageUrl(selectedPost.memberPhoto) || '/icon/profileimage.png'}
          image={getImageUrl(selectedPost.boardImage) || '/icon/image.png'}
          content={selectedPost.content || selectedPost.boardContent}
          likes={selectedPost.likes || selectedPost.boardLike || 0}
          comments={selectedPost.comments || selectedPost.replyCount || 0}
          commentsList={selectedPost.commentsList || []}
          setCommentsList={setSelectedPost}
          timestamp={selectedPost.timestamp}
          tags={selectedPost.tags || []}
          isLiked={isLiked[selectedPost.id || selectedPost.boardNo] || false}
          isSaved={isSaved[selectedPost.id || selectedPost.boardNo] || false}
          onLike={() => handleLike(selectedPost.id || selectedPost.boardNo)}
          onSave={() => handleSave(selectedPost.id || selectedPost.boardNo)}
          onClose={closePostModal}
          currentUser={user}
          fetchComments={async () => {
            try {
              const comments = await APIService.getPostComments(selectedPost.id || selectedPost.boardNo);
              setSelectedPost(prev => ({
                ...prev,
                commentsList: comments.map(comment => ({
                  id: comment.replyNo,
                  username: comment.memberNickname,
                  text: comment.replyContent,
                  timestamp: formatTimestamp(comment.replyInputdate),
                  profileImage: comment.memberNo ? `http://localhost:9000/api/images/profile/${comment.memberNo}?t=${Date.now()}` : '/icon/profileimage.png'
                }))
              }));
            } catch (error) {
              console.error('댓글 로드 중 오류:', error);
            }
          }}
        />
      )}
    </div>
  );
}

export default MyPage;