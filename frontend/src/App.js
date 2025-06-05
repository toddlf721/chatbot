import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import MyPage from './pages/MyPage';
import StudyDetail from './pages/StudyDetail';
import CreatePost from './pages/CreatePost';
import Login from './pages/Login';
import EmailSignUp from './pages/EmailSignUp';
import APIService from './services/APIService';
import TagPosts from './pages/TagPosts';
import ChatbotStudyFriend from './components/ChatbotStudyFriend';
import './App.css';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMemberPage from './pages/admin/AdminMemberPage';
import AdminReportPage from './pages/admin/AdminReportPage';
import AdminRoute from './pages/admin/AdminRoute';
import NoticePopup from './components/NoticePopup';
import MessageForm from './pages/MessageForm';
import Message from './pages/Message';
import MessageDetail from './pages/MessageDetail';
import Findpassword from './pages/FindPassword';

function App() {
  // 앱 전반 상태 관리
  const [isDarkMode, setIsDarkMode] = useState(false); // 다크모드 여부
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 여부
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 여부
  const [currentUser, setCurrentUser] = useState(null); // 현재 로그인한 사용자 정보

  // 데이터 관련 상태
  const [posts, setPosts] = useState([]); // 전체 게시글
  const [users, setUsers] = useState({}); // 사용자 정보 목록
  const [suggestedUsers, setSuggestedUsers] = useState([]); // 추천 사용자
  const [studyPosts, setStudyPosts] = useState([]); // 스터디 게시글
  const [likedPosts, setLikedPosts] = useState([]); // 좋아요한 게시글
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]); // 북마크한 게시글
  const [isAdmin, setIsAdmin] = useState(false);//관리자 인지아닌지

  const [notice, setNotice] = useState(null);//공지사항 불러오기

    // 추가된 상태 변수들
    const [visible, setVisible] = useState(false); // 팝업 표시 여부
    const [storageKey, setStorageKey] = useState(null); // 로컬 스토리지 키
    const [hideFor24Hours, setHideFor24Hours] = useState(false); // 24시간 동안 숨기기 체크박스 상태

  // 게시물 전체 불러오기
  const fetchPosts = useCallback(async () => {
    try {
      const data = await APIService.getAllPosts();
      return data || [];
    } catch (error) {
      console.error('게시글 불러오기 오류:', error);
      // 접근 권한 관련 오류 처리
      if (error.message && (
        error.message.includes('로그인이 필요한 게시물입니다') ||
        error.message.includes('팔로워만 볼 수 있는 게시물입니다') ||
        error.message.includes('접근 권한이 없는 게시물입니다')
      )) {
        console.warn('권한 오류:', error.message);
      }
      return [];
    }
  }, []);

  // 추천 사용자 불러오기
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const data = await APIService.getSuggestedUsers();
      const formattedUsers = (data || [])
        .filter(user => user.memberStatus === 'active')
        .map((user, index) => ({
          id: index + 1,
          username: user.memberNickname,
          fullName: user.memberName || user.memberNickname,
          profileImage: user.memberPhoto || '/icon/profileimage.png',
          memberStatus: user.memberStatus,
          isFollowed: false
        }));
      return formattedUsers;
    } catch (error) {
      console.error('추천 사용자 불러오기 오류:', error);
      return [];
    }
  }, []);

  const fetchStudyPosts = useCallback(async () => {
    try {
      const data = await APIService.getStudyPosts();
      return data || [];
    } catch (error) {
      console.error('스터디 게시글 불러오기 오류:', error);
      return [];
    }
  }, []);

  const fetchLikedPosts = useCallback(async () => {
    try {
      const data = await APIService.getLikedPosts();
      setLikedPosts(data || []);
      return data || [];
    } catch (error) {
      console.error('좋아요 게시글 불러오기 오류:', error);
      return [];
    }
  }, []);

  const fetchBookmarkedPosts = useCallback(async () => {
    try {
      const data = await APIService.getScrappedPosts();
      setBookmarkedPosts(data || []);
      return data || [];
    } catch (error) {
      console.error('북마크 게시글 불러오기 오류:', error);
      return [];
    }
  }, []);

  // 사용자 관련 전체 데이터 불러오기
  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 먼저 사용자 정보 가져오기
      const userData = await APIService.getCurrentUser();
      setCurrentUser(userData);

      // 모든 데이터를 병렬로 가져오기
      const [postsData, usersData, studyPostsData, likedPostsIds, bookmarkedPostsIds] = await Promise.allSettled([
        fetchPosts(),
        fetchSuggestedUsers(),
        fetchStudyPosts(),
        fetchLikedPosts(),
        fetchBookmarkedPosts()
      ]);

      // 성공적으로 가져온 데이터만 추출
      const updatedState = {
        posts: postsData.status === 'fulfilled' && Array.isArray(postsData.value) ? postsData.value : [],
        suggestedUsers: usersData.status === 'fulfilled' ? usersData.value || [] : [],
        studyPosts: studyPostsData.status === 'fulfilled' ? studyPostsData.value || [] : [],
        likedPosts: likedPostsIds.status === 'fulfilled' ? likedPostsIds.value || [] : [],
        bookmarkedPosts: bookmarkedPostsIds.status === 'fulfilled' ? bookmarkedPostsIds.value || [] : []
      };

      // 한 번에 상태 업데이트
      setPosts(updatedState.posts);
      setSuggestedUsers(updatedState.suggestedUsers);
      setStudyPosts(updatedState.studyPosts);
      setLikedPosts(updatedState.likedPosts);
      setBookmarkedPosts(updatedState.bookmarkedPosts);

      // 사용자 데이터 처리
      const usersMap = { ...users };

      // 게시물에서 사용자 정보 추출
      if (Array.isArray(updatedState.posts)) {
        updatedState.posts.forEach(post => {
          if (!usersMap[post.memberNickname]) {
            usersMap[post.memberNickname] = {
              username: post.memberNickname,
              name: post.memberName || post.memberNickname,
              profileImage: post.memberPhoto || '/icon/profileimage.png',
              bio: post.memberIntroduce || '',
              posts: 0,
              followers: 0,
              following: 0
            };
          }
          usersMap[post.memberNickname].posts += 1;
        });
      }

      // 현재 사용자 정보도 추가
      if (userData) {
        if (!usersMap[userData.memberNickname]) {
          // 새로 추가
          usersMap[userData.memberNickname] = {
            username: userData.memberNickname,
            name: userData.memberName || userData.memberNickname,
            profileImage: userData.memberPhoto || '/icon/profileimage.png',
            bio: userData.memberIntroduce || '',
            posts: 0,
            followers: 0,
            following: 0
          };
        } else {
          // 기존 정보 업데이트
          usersMap[userData.memberNickname].profileImage = userData.memberPhoto || '/icon/profileimage.png';
          usersMap[userData.memberNickname].name = userData.memberName || userData.memberNickname;
          usersMap[userData.memberNickname].bio = userData.memberIntroduce || '';
        }
      }

      setUsers(usersMap);

    } catch (error) {
      console.error('데이터 불러오기 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await APIService.getCurrentUser();
        if (user.memberRole === 'ADMIN') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('권한 확인 실패:', e);
      }
    };
    checkAdmin();
  }, []);

  // 사용자 목록 업데이트 함수
  const updateUsers = useCallback((userData) => {
    if (!userData) return;

    setUsers(prevUsers => ({
      ...prevUsers,
      [userData.memberNickname]: {
        username: userData.memberNickname,
        name: userData.memberName || userData.memberNickname,
        profileImage: userData.memberPhoto || '/icon/profileimage.png',
        bio: userData.memberIntroduce || '',
        posts: prevUsers[userData.memberNickname]?.posts || 0,
        followers: prevUsers[userData.memberNickname]?.followers || 0,
        following: prevUsers[userData.memberNickname]?.following || 0
      }
    }));
  }, []);


  useEffect(() => {
    const fetchNotice = async () => {
      const latest = await APIService.getLatestNotice();
      if (latest && latest.content) {
        setNotice(latest);
      }
    };
    fetchNotice();
  }, [isLoggedIn]); // isLoggedIn이 변할 때마다 공지사항을 다시 가져옵니다.

  useEffect(() => {
    const checkPopup = async () => {
      try {
        const user = await APIService.getCurrentUser();
        const memberNo = user.memberNo;
        const key = `hideNoticeUntil_${memberNo}`;
        setStorageKey(key);
  
        const lastClosed = localStorage.getItem(key);
        const now = new Date();
  
 
  
        // 공지사항이 있고, 이전에 닫은 시간이 없거나 현재 시간이 이전에 닫은 시간보다 크면 팝업을 보여준다.
        if (notice && (!lastClosed || now > new Date(lastClosed))) {
          setVisible(true);
        }
      } catch (err) {
        console.error('공지 팝업 체크 중 오류:', err);
      }
    };
  
    checkPopup();
  }, [notice]);

  



  // 사용자 정보 업데이트 함수 - 자식 컴포넌트에 전달
  const updateCurrentUser = useCallback((userData) => {
    if (!userData) return;

    // 타임스탬프를 추가한 새 객체 생성 - 강제 리렌더링을 위해
    const updatedUserData = {
      ...userData,
      _updated: Date.now() // 리렌더링을 위한 타임스탬프 추가
    };

    setCurrentUser(updatedUserData);

    // 사용자 목록에도 업데이트
    updateUsers(updatedUserData);

    // 명시적으로 프로필 업데이트 이벤트 발생
    const profileUpdateEvent = new CustomEvent('profileUpdated', {
      detail: { timestamp: Date.now(), userId: userData.memberNo }
    });
    window.dispatchEvent(profileUpdateEvent);

    // 프로필 이미지 변경 후 모든 데이터를 새로고침 - 중요!
    setTimeout(() => {
      loadUserData();
    }, 300); // 약간 지연시켜 서버가 이미지를 완전히 처리할 시간을 줌
  }, [updateUsers, loadUserData]);

  // 로그인 상태 확인
  const checkLoginStatus = useCallback(async () => {
    try {
      const userData = await APIService.getCurrentUser();
      setCurrentUser(userData);
      setIsLoggedIn(true);

      // 로그인 후 사용자 관련 데이터 불러오기
      await loadUserData();
    } catch (error) {
      setIsLoggedIn(false);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, []); // 빈 배열로 처음 마운트 시에만 실행

  // 다크모드 토글
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 다크모드 적용
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // refreshData 이벤트 리스너
  useEffect(() => {
    const handleDataRefresh = async (event) => {
      try {
        console.log('데이터 새로고침 이벤트 발생:', event?.detail);

        // 로딩 상태 설정
        setIsLoading(true);

        // 더 효율적인 로드 - 변경된 데이터만 선택적으로 다시 불러오기
        if (event?.detail?.type === 'posts') {
          // 게시물 데이터만 새로고침
          const updatedPosts = await fetchPosts();
          setPosts(updatedPosts || []);
        } else if (event?.detail?.type === 'likes') {
          // 좋아요 데이터만 새로고침
          const likedPostsIds = await fetchLikedPosts();
          setLikedPosts(likedPostsIds || []);
        } else if (event?.detail?.type === 'bookmarks') {
          // 북마크 데이터만 새로고침
          const bookmarkedPostsIds = await fetchBookmarkedPosts();
          setBookmarkedPosts(bookmarkedPostsIds || []);
        } else {
          // 모든 데이터 새로고침 (기본값)
          await loadUserData();
        }
      } catch (error) {
        console.error('데이터 새로고침 중 오류:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('refreshData', handleDataRefresh);

    return () => {
      window.removeEventListener('refreshData', handleDataRefresh);
    };
  }, [loadUserData, fetchPosts, fetchLikedPosts, fetchBookmarkedPosts, setPosts, setLikedPosts, setBookmarkedPosts]);

  if (isLoading) {
    return (
      <div className="loading-spinner-container">
        <video
          src="/1.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="loading-video"
          onLoadedMetadata={(e) => e.currentTarget.currentTime = 2}
        />
        <div className="loading-text">로딩중...</div>
      </div>
    );
  }





  return (
    <Router>
      <div className={`app ${isDarkMode ? 'dark-mode' : ''}`}>
        {isLoggedIn ? (
          // 로그인된 경우 네비게이션 바 표시
          <Navbar
            user={currentUser}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            suggestedUsers={suggestedUsers}
            setSuggestedUsers={setSuggestedUsers}
            fetchUserData={loadUserData}
          />
        ) : (
          // 비로그인 상태 네비게이션 바 (간단한 로고 및 로그인/회원가입 링크)
          <nav className={`navbar ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="navbar-container">
              <a href="/" className="navbar-logo">
                <div className="milestone-logo">
                  <img
                    src="/icon/logo.png"
                    alt="milestone Logo"
                    className="logo-circle"
                  />
                  <span>MILESTONE</span>
                </div>
              </a>
              <div className="navbar-right">
                <a href="/login" className={`auth-button ${window.location.pathname === '/login' ? 'active' : ''}`}>로그인</a>
                <a href="/signup" className={`auth-button ${window.location.pathname === '/signup' ? 'active' : ''}`}>회원가입</a>
              </div>
            </div>
          </nav>
        )}
        {isLoggedIn && <ChatbotStudyFriend />}
        {isLoggedIn && <NoticePopup notice={notice} isLoggedIn={isLoggedIn} />}

        {isAdmin && (
          <button
            onClick={() => window.location.href = '/admin'}
            style={{
              position: 'fixed',
              bottom: '1.4rem',
              right: '6.6rem', // 챗봇 버튼에서 왼쪽으로
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              fontSize: '24px',
              cursor: 'pointer',
            }}
            title="관리자 페이지"
          >
            ⚙️
          </button>
        )}


        <div className="app-container">
          <Routes>
            {/* 루트 경로: 로그인 여부에 따라 홈 또는 로그인 페이지로 이동 */}
            <Route path="/" element={isLoggedIn ? <Navigate to="/ " /> : <Navigate to="/login" />} />

            {/* 홈 페이지 */}
            <Route
              path="/home"
              element={
                isLoggedIn ? (
                  <Home
                    posts={posts}
                    setPosts={setPosts}
                    suggestedUsers={suggestedUsers}
                    setSuggestedUsers={setSuggestedUsers}
                    users={users}
                    fetchPosts={fetchPosts}
                    currentUser={currentUser}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* 관리자 페이지 보호 */}
            <Route
              path="/admin/"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="/admin/members" element={
              <AdminRoute>
                <AdminMemberPage />
              </AdminRoute>

            } />
            <Route path="/admin/reports" element={
              <AdminRoute>
                <AdminReportPage />
              </AdminRoute>
            } />



            {/* 프로필 페이지 */}
            <Route
              path="/profile/:username"
              element={
                isLoggedIn ? (
                  <Profile
                    users={users}
                    posts={posts}
                    studyPosts={studyPosts}
                    currentUser={currentUser}
                    updateUsers={updateUsers}
                    fetchPosts={fetchPosts}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/mypage"
              element={
                isLoggedIn ? (
                  <MyPage
                    user={currentUser}
                    posts={(posts || []).filter(post => post && currentUser && post.memberNo === currentUser.memberNo)}
                    likes={(posts || []).filter(post => post && likedPosts && likedPosts.includes(post.boardNo))}
                    bookmarks={(posts || []).filter(post => post && bookmarkedPosts && bookmarkedPosts.includes(post.boardNo))}
                    updateCurrentUser={updateCurrentUser}
                    fetchUserData={loadUserData}
                    fetchPosts={fetchPosts}
                    fetchLikedPosts={fetchLikedPosts}
                    fetchBookmarkedPosts={fetchBookmarkedPosts}
                    setLikedPosts={setLikedPosts}
                    setBookmarkedPosts={setBookmarkedPosts}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* 스터디 상세 페이지 */}
            <Route
              path="/study/:postId"
              element={
                isLoggedIn ? (
                  <StudyDetail
                    studyPosts={studyPosts}
                    users={users}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* 게시글 작성 페이지 */}
            <Route
              path="/create"
              element={
                isLoggedIn ? (
                  <CreatePost
                    user={currentUser}
                    fetchPosts={fetchPosts}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/tags/:tagName" element={<TagPosts />} />
            <Route path="/messages/:nickname" element={<Message />} />
            <Route path="/messageform/:nickname" element={<MessageForm />} />
            <Route path="/messageform" element={<MessageForm />} />
            <Route path="/messages/:type/:messageNo" element={<MessageDetail />} />

            {/* 로그인 및 회원가입 페이지 */}
            <Route path="/login" element={<Login isDarkMode={isDarkMode} setIsLoggedIn={setIsLoggedIn} setCurrentUser={setCurrentUser}/>} />
            <Route path="/signup" element={<EmailSignUp isDarkMode={isDarkMode} setIsLoggedIn={setIsLoggedIn} />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/findpassword" element={<Findpassword />} />
            


          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;