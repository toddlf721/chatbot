import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import APIService from '../services/APIService';
import PostModal from '../components/PostModal'; // 게시물 모달 컴포넌트
import { formatTimestamp } from '../utils/dateUtils';
import './TagPosts.css';

function TagPosts() {
  const { tagName } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(''); // 초기값은 빈 문자열 (자동 결정됨)
  const [selectedPost, setSelectedPost] = useState(null); // 모달에 표시할 게시물
  const [isLiked, setIsLiked] = useState({}); // 좋아요 상태 관리
  const [isSaved, setIsSaved] = useState({}); // 저장 상태 관리
  const [commentsList, setCommentsList] = useState([]); // 댓글 목록
  const [currentUser, setCurrentUser] = useState(null); // 현재 로그인한 사용자

  useEffect(() => {
    const fetchTagPosts = async () => {
      try {
        setLoading(true);
        const tagPosts = await APIService.getPostsByTag(tagName);


        console.log('받은 게시물 데이터:', tagPosts);
        setPosts(tagPosts);

        // 게시물 목록에 따라 초기 탭 설정
        setInitialTab(tagPosts);

        // 게시물 좋아요/저장 상태 초기화
        initPostStates(tagPosts);

        // 현재 사용자 정보 가져오기
        fetchCurrentUser();
      } catch (err) {
        console.error('태그별 게시물 로드 중 오류 발생:', err);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTagPosts();
  }, [tagName]);

  // 현재 사용자 정보 가져오기
  const fetchCurrentUser = async () => {
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      } else {
        // 세션 스토리지에 없으면 API로 가져오기
        const userData = await APIService.getCurrentUser();
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('현재 사용자 정보 로드 중 오류:', error);
    }
  };

  // 초기 탭 설정 함수
  const setInitialTab = (posts) => {
    // 게시물 타입에 따라 카운트
    const dailyCount = posts.filter(post => post.boardType === 'daily').length;
    const blogCount = posts.filter(post => post.boardType === 'study').length;

    // boardType에 따라 자동으로 탭 선택
    if (dailyCount > 0 && blogCount === 0) {
      setActiveTab('daily');
    } else if (blogCount > 0 && dailyCount === 0) {
      setActiveTab('blog');
    } else if (blogCount > 0) {
      // 양쪽 다 있을 경우 daily 탭 먼저 보여줌
      setActiveTab('daily');
    } else {
      // 기본값
      setActiveTab('daily');
    }
  };

  // 게시물 좋아요/스크랩 상태 초기화
  const initPostStates = async (postsData) => {
    try {
      // 좋아요 및 북마크 상태 가져오기
      const likedPostsIds = await APIService.getLikedPosts();
      const savedPostsIds = await APIService.getScrappedPosts();

      // 게시물 상태 초기화 객체 생성
      const newLikedState = {};
      const newSavedState = {};

      postsData.forEach(post => {
        newLikedState[post.boardNo] = likedPostsIds.includes(post.boardNo);
        newSavedState[post.boardNo] = savedPostsIds.includes(post.boardNo);
      });

      setIsLiked(newLikedState);
      setIsSaved(newSavedState);
    } catch (err) {
      console.error('게시물 상태 초기화 오류:', err);
    }
  };

  // 일일 게시물(daily) 수
  const dailyCount = posts.filter(post => post.boardType === 'daily').length;

  // 블로그 게시물(study) 수
  const blogCount = posts.filter(post => post.boardType === 'study').length;

  // 모달 열기 함수
  const openPostModal = async (post) => {
    // 게시물 데이터 정리 및 필요한 필드 확인
    const enrichedPost = {
      ...post,
      boardNo: post.boardNo,
      memberNickname: post.memberNickname || '사용자',
      memberPhoto: APIService.getProfileImageUrl(post.memberPhoto) || '/icon/profileimage.png',
      boardImage: APIService.getProcessedImageUrl(post.thumbnailImage || post.boardImage) || '/icon/image.png',
      boardContent: post.boardContent || '',
      boardLike: post.boardLike || 0,
      boardReplies: post.replyCount || post.boardReplies || 0,
      tags: post.tags || [],
      boardInputdate: post.boardInputdate
    };

    setSelectedPost(enrichedPost);
    document.body.style.overflow = 'hidden'; // 배경 스크롤 방지

    // 댓글 불러오기
    if (post && post.boardNo) {
      await fetchComments(post.boardNo);
    }
  };

  // 댓글 불러오기 함수
  const fetchComments = async (postId) => {
    try {
      // getPostComments API 사용
      const commentsData = await APIService.getPostComments(postId);

      // 댓글 데이터 변환 (PostModal에서 사용하는 형식으로 변환)
      const formattedComments = commentsData.map(comment => {
        // replyInputdate가 문자열인지 확인
        let timestamp;
        if (typeof comment.replyInputdate === 'string') {
          timestamp = comment.replyInputdate;
        } else {
          timestamp = formatTimestamp(comment.replyInputdate);
        }

        return {
          id: comment.replyNo,
          username: comment.memberNickname || '사용자',
          profileImage: comment.memberNo ?
            `http://localhost:9000/api/images/profile/${comment.memberNo}?t=${Date.now()}` :
            '/icon/profileimage.png',
          text: comment.replyContent || '',
          timestamp: timestamp
        };
      });

      setCommentsList(formattedComments);
      console.log('로드된 댓글:', formattedComments);
    } catch (error) {
      console.error('댓글 로드 중 오류:', error);
      setCommentsList([]);
    }
  }

  // 모달 닫기 함수
  const closePostModal = () => {
    setSelectedPost(null);
    document.body.style.overflow = 'auto'; // 배경 스크롤 복원
    setCommentsList([]); // 댓글 목록 초기화
  };

  // 좋아요 상태 변경 함수
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

      // 게시물 좋아요 수 업데이트
      setPosts(prevPosts =>
        prevPosts.map(post => {
          if (post.boardNo === postId) {
            const newLikeCount = currentLiked ?
              (post.boardLike > 0 ? post.boardLike - 1 : 0) :
              (post.boardLike || 0) + 1;

            return {
              ...post,
              boardLike: newLikeCount
            };
          }
          return post;
        })
      );

      // 선택된 게시물이 현재 좋아요 상태를 변경한 게시물인 경우 업데이트
      if (selectedPost && selectedPost.boardNo === postId) {
        setSelectedPost(prevPost => ({
          ...prevPost,
          boardLike: currentLiked ?
            (prevPost.boardLike > 0 ? prevPost.boardLike - 1 : 0) :
            (prevPost.boardLike || 0) + 1
        }));
      }
    } catch (error) {
      console.error('좋아요 상태 변경 중 오류:', error);
    }
  };

  // 저장 상태 변경 함수
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
    } catch (error) {
      console.error('저장 상태 변경 중 오류:', error);
    }
  };

  // 게시물 수정 후 호출되는 함수
  const handleEditPost = (updatedPost) => {
    // 게시물 목록 업데이트
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.boardNo === selectedPost.boardNo) {
          return {
            ...post,
            boardContent: updatedPost.content,
            tags: updatedPost.tags,
            // 이미지가 업데이트된 경우 처리
            thumbnailImage: updatedPost.image ? URL.createObjectURL(updatedPost.image) : post.thumbnailImage
          };
        }
        return post;
      })
    );
  };

  // 게시물 삭제 후 호출되는 함수
  const handleDeletePost = () => {
    // 게시물 목록에서 삭제된 게시물 제거
    setPosts(prevPosts => prevPosts.filter(post => post.boardNo !== selectedPost.boardNo));
  };

  if (loading) {
    return (
      <div className="tag-posts-container">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>게시물을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tag-posts-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tag-posts-container">
      <div className="tag-header">
        <h1>
          <i className="fas fa-hashtag"></i>
          {tagName}
        </h1>
        <p>{posts.length}개의 게시물</p>
      </div>

      {/* 항상 탭 메뉴 표시 (조건 제거) */}
      <div className="tag-tabs">
        <button
          className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
          title="Daily"
        >
          <i className="fas fa-images"></i>
          <span className="tab-count">{dailyCount}</span>
        </button>
        <button
          className={`tab-button ${activeTab === 'blog' ? 'active' : ''}`}
          onClick={() => setActiveTab('blog')}
          title="Blog"
        >
          <i className="fas fa-file-alt"></i>
          <span className="tab-count">{blogCount}</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="no-posts">
          <i className="fas fa-search"></i>
          <p>#{tagName} 태그가 포함된 게시물이 없습니다.</p>
        </div>
      ) : (
        <div className={`posts-container ${activeTab === 'blog' ? 'blog-view' : 'gallery-view'}`}>
          {/* Blog 타입 게시물 표시 - boardType이 'study'인 경우만 */}
          {activeTab === 'blog' ? (
            blogCount > 0 ? (
              <div className="blog-posts">
                {posts
                  .filter(post => post.boardType === 'study')
                  .map((post) => (
                    <div key={post.boardNo} className="blog-post-card">
                      <Link to={`/study/${post.boardNo}`}>
                        <div className="blog-post-content">
                          {/* 왼쪽: 썸네일 이미지 */}
                          <div className="blog-post-thumbnail">
                            <img
                              src={APIService.getProcessedImageUrl(post.thumbnailImage) || '/icon/image.png'}
                              alt={post.boardTitle || '게시물'}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/icon/image.png';
                              }}
                            />
                          </div>

                          {/* 오른쪽: 제목, 태그, 메타 정보 */}
                          <div className="blog-post-info">
                            {/* 태그 (있는 경우) */}
                            {post.tags && post.tags.length > 0 && (
                              <div className="blog-post-tags">
                                {post.tags.map((tag, index) => (
                                  <span key={index} className="blog-post-tag">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* 제목 */}
                            <h3 className="blog-post-title">{post.boardTitle || '제목 없음'}</h3>

                            {/* 하단 메타 정보 */}
                            <div className="blog-post-meta">
                              {/* 왼쪽 하단: 작성자 정보 */}
                              <div className="blog-post-author">
                                <img
                                  src={APIService.getProfileImageUrl(post.memberPhoto) || '/icon/profileimage.png'}
                                  alt={post.memberNickname || '사용자'}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/icon/profileimage.png';
                                  }}
                                />
                                <span>{post.memberNickname || '사용자'}</span>
                              </div>

                              {/* 오른쪽 하단: 작성일자 및 통계 */}
                              <div className="blog-post-details">
                                <div className="blog-post-date">
                                  {formatTimestamp(post.boardInputdate)}
                                </div>
                                <div className="blog-post-stats">
                                  <span><i className="fas fa-heart"></i> {post.boardLike || 0}</span>
                                  <span><i className="fas fa-comment"></i> {post.boardReplies || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
              </div>
            ) : (
              // Blog 게시물이 없을 때 메시지 표시
              <div className="no-posts">
                <i className="fas fa-file-alt"></i>
                <p>#{tagName} 태그가 포함된 블로그 게시물이 없습니다.</p>
              </div>
            )
          ) : null}

          {/* Daily 타입 게시물 표시 - boardType이 'daily'인 경우만 */}
          {activeTab === 'daily' ? (
            dailyCount > 0 ? (
              <div className="gallery-view-section">
                <div className="gallery-grid">
                  {posts
                    .filter(post => post.boardType === 'daily')
                    .map((post) => (
                      <div
                        key={post.boardNo}
                        className="gallery-item"
                        onClick={() => openPostModal(post)} // 클릭 시 모달 열기
                      >
                        <div className="gallery-image">
                          <img
                            src={APIService.getProcessedImageUrl(post.thumbnailImage) || '/icon/image.png'}
                            alt={post.boardTitle || '게시물'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/icon/image.png';
                            }}
                          />

                          {/* 호버 시 나타나는 오버레이 */}
                          <div className="gallery-overlay">
                            <div className="gallery-stats">
                              <span><i className="fas fa-heart"></i> {post.boardLike || 0}</span>
                              <span><i className="fas fa-comment"></i> {post.replyCount || post.boardReplies || 0}</span>
                            </div>
                          </div>
                        </div>

                        {/* 하단 프로필 정보 */}
                        <div className="gallery-profile">
                          <img
                            src={post.memberPhoto || '/icon/profileimage.png'}
                            alt={post.memberNickname || '사용자'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/icon/profileimage.png';
                            }}
                          />
                          <span>{post.memberNickname || '사용자'}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              // Daily 게시물이 없을 때 메시지 표시
              <div className="no-posts">
                <i className="fas fa-images"></i>
                <p>#{tagName} 태그가 포함된 일상 게시물이 없습니다.</p>
              </div>
            )
          ) : null}
        </div>
      )}

      {/* 모달 표시 */}
      {selectedPost && (
        <PostModal
          id={selectedPost.boardNo}
          username={selectedPost.memberNickname || '사용자'}
          profileImage={selectedPost.memberPhoto || '/icon/profileimage.png'}
          image={selectedPost.thumbnailImage || '/icon/image.png'}
          content={selectedPost.boardContent || ''}
          likes={selectedPost.boardLike || 0}
          comments={selectedPost.boardReplies || 0}
          commentsList={commentsList}
          setCommentsList={setCommentsList}
          timestamp={selectedPost.boardInputdate}
          tags={selectedPost.tags || []}
          isLiked={isLiked[selectedPost.boardNo] || false}
          isSaved={isSaved[selectedPost.boardNo] || false}
          onLike={() => handleLike(selectedPost.boardNo)}
          onSave={() => handleSave(selectedPost.boardNo)}
          onClose={closePostModal}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          fetchComments={() => fetchComments(selectedPost.boardNo)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

export default TagPosts;