import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import APIService from '../services/APIService';
import './StudyPage.css';

function StudyPage() {
  const [studyPosts, setStudyPosts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('latest');
  const [popularTags, setPopularTags] = useState([]);
  const [popularBoards, setPopularBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 학습 게시물 데이터 로드
  useEffect(() => {
    const fetchStudyData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 학습 게시물 불러오기 (API 경로 처리 포함)
        const studyPostsData = await APIService.getStudyBoardsWithProcessedContent();
        setStudyPosts(studyPostsData);

        // 인기 태그 불러오기
        try {
          const tagsData = await APIService.getPopularTags(10);
          setPopularTags(tagsData);
        } catch (err) {
          console.error('인기 태그 로드 중 오류:', err);
          // 인기 태그 로드 실패해도 진행
        }

        // 인기 게시판 더미 데이터 (실제 API가 아직 없으므로)
        // 실제 구현 시 백엔드 API로 교체 필요
        setPopularBoards([
          {
            id: 1,
            title: '프로그래밍 기초',
            description: '프로그래밍 기본 개념과 입문자를 위한 팁',
            posts: 78,
            followers: 245,
            image: APIService.getProcessedImageUrl('/api/images/file/board_study_1.jpg')
          },
          {
            id: 2,
            title: '웹 개발',
            description: 'HTML, CSS, JavaScript 및 프레임워크 학습',
            posts: 95,
            followers: 320,
            image: APIService.getProcessedImageUrl('/api/images/file/board_study_2.jpg')
          },
          {
            id: 3,
            title: '알고리즘 스터디',
            description: '코딩 테스트 준비 및 알고리즘 학습',
            posts: 64,
            followers: 187,
            image: APIService.getProcessedImageUrl('/api/images/file/board_study_3.jpg')
          }
        ]);

      } catch (error) {
        console.error('학습 데이터 로드 중 오류:', error);
        setError('학습 게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudyData();
  }, []);

  // 검색어 변경 처리
  const handleSearchChange = (e) => {
    setSearchText(e.target.value);
  };

  // 탭 변경 처리
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // 검색어에 따른 게시물 필터링
  const filteredPosts = studyPosts.filter(post => {
    const searchLower = searchText.toLowerCase();

    return (
      post.boardTitle?.toLowerCase().includes(searchLower) ||
      post.boardContent?.toLowerCase().includes(searchLower) ||
      post.memberNickname?.toLowerCase().includes(searchLower) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  // 탭에 따른 게시물 정렬
  const getSortedPosts = () => {
    switch (activeTab) {
      case 'popular':
        // 좋아요 수 기준 정렬
        return [...filteredPosts].sort((a, b) => (b.boardLike || 0) - (a.boardLike || 0));
      case 'following':
        // 팔로우한 사용자의 게시물 필터링 (실제 구현 필요)
        // 현재는 더미로 게시물의 일부만 표시
        return filteredPosts.filter((_, index) => index % 3 === 0);
      case 'latest':
      default:
        // 최신 게시물 기준 정렬 (기본값)
        return [...filteredPosts].sort((a, b) =>
          new Date(b.boardInputdate) - new Date(a.boardInputdate)
        );
    }
  };

  // 현재 탭에 맞게 정렬된 게시물
  const displayPosts = getSortedPosts();

  // 새 글 작성 페이지로 이동
  const handleCreatePost = () => {
    navigate('/create');
  };

  if (isLoading) {
    return <div className="study-loading">학습 콘텐츠를 불러오는 중...</div>;
  }

  if (error) {
    return <div className="study-error">{error}</div>;
  }

  return (
    <div className="study-page">
      <div className="study-container">
        <div className="study-header">
          <h1>학습 공간</h1>
          <p className="study-description">공부 내용을 기록하고 다른 사람들과 공유해보세요!</p>

          <div className="study-actions">
            <div className="study-search">
              <input
                type="text"
                placeholder="검색"
                value={searchText}
                onChange={handleSearchChange}
              />
              <i className="fas fa-search"></i>
            </div>

            <button className="create-post-btn" onClick={handleCreatePost}>
              <i className="fas fa-plus"></i> 새 글 작성
            </button>
          </div>
        </div>

        <div className="study-tabs">
          <button
            className={`study-tab ${activeTab === 'latest' ? 'active' : ''}`}
            onClick={() => handleTabChange('latest')}
          >
            최신 글
          </button>
          <button
            className={`study-tab ${activeTab === 'popular' ? 'active' : ''}`}
            onClick={() => handleTabChange('popular')}
          >
            인기 글
          </button>
          <button
            className={`study-tab ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => handleTabChange('following')}
          >
            팔로우 중
          </button>
        </div>

        {displayPosts.length > 0 ? (
          <div className="study-posts">
            {displayPosts.map(post => (
              <Link to={`/study/${post.boardNo}`} key={post.boardNo} className="study-post-card">
                <div className="study-post-image">
                  <img
                    src={APIService.getProcessedImageUrl(post.boardImage)}
                    alt={post.boardTitle}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/icon/image.png';
                    }}
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
                  <h2 className="study-post-title">{post.boardTitle}</h2>
                  <p className="study-post-excerpt">
                    {post.boardContent.length > 150
                      ? post.boardContent.substring(0, 150) + '...'
                      : post.boardContent}
                  </p>
                  <div className="study-post-info">
                    <div className="study-post-author">
                      <img
                        src={APIService.getProfileImageUrl(post.memberPhoto)}
                        alt={post.memberNickname}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/icon/profileimage.png';
                        }}
                      />
                      <span>{post.memberNickname}</span>
                    </div>
                    <div className="study-post-date">
                      {new Date(post.boardInputdate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-study-posts">
            <div className="empty-message">
              <i className="fas fa-book"></i>
              <h3>검색 결과가 없습니다</h3>
              <p>다른 검색어로 시도하거나 새 글을 작성해보세요.</p>
              <button className="create-post-btn" onClick={handleCreatePost}>
                <i className="fas fa-plus"></i> 새 글 작성
              </button>
            </div>
          </div>
        )}

        {popularTags.length > 0 && (
          <div className="study-tags-section">
            <h3 className="section-title">인기 태그</h3>
            <div className="study-tags">
              {popularTags.map((tag, index) => (
                <Link key={index} to={`/tags/${tag}`} className="study-tag">
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="study-boards">
          <h3 className="section-title">인기 보드</h3>
          <div className="study-boards-grid">
            {popularBoards.map(board => (
              <div key={board.id} className="study-board-card">
                <div className="study-board-image">
                  <img
                    src={board.image}
                    alt={board.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/icon/image.png';
                    }}
                  />
                </div>
                <div className="study-board-content">
                  <h3 className="study-board-title">{board.title}</h3>
                  <p className="study-board-description">{board.description}</p>
                  <div className="study-board-info">
                    <span>게시물 {board.posts}개</span>
                    <span>팔로워 {board.followers}명</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyPage;