import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import APIService from '../services/APIService';
import './PostDetail.css';

function PostDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 게시물 데이터 로드
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setIsLoading(true);
        
        // 게시물 정보 가져오기
        const postData = await APIService.getPostById(postId);
        setPost(postData);
        
        // 좋아요 및 스크랩 상태 확인
        const likeStatus = await APIService.checkPostLikeStatus(postId);
        const scrapStatus = await APIService.checkPostScrapStatus(postId);
        
        setIsLiked(likeStatus.isLiked || false);
        setIsSaved(scrapStatus.isScrapped || false);
        
        // 댓글 불러오기
        await fetchComments();
      } catch (error) {
        console.error('게시물 데이터 로드 중 오류:', error);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPostData();
  }, [postId]);
  
  // 댓글 불러오기 함수
  const fetchComments = async () => {
    try {
      const commentsData = await APIService.getPostComments(postId);
      
      // 댓글 포맷팅
      const formattedComments = commentsData.map(comment => ({
        id: comment.replyNo,
        username: comment.memberNickname,
        text: comment.replyContent,
        timestamp: formatTimestamp(comment.replyInputdate),
        profileImage: APIService.getProfileImageUrl(comment.memberPhoto)
      }));
      
      setComments(formattedComments);
    } catch (error) {
      console.error('댓글 로드 중 오류:', error);
    }
  };
  
  // 타임스탬프 포맷 함수
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}분 전`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}일 전`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // 좋아요 기능
  const handleLike = async () => {
    try {
      if (isLiked) {
        await APIService.unlikePost(postId);
      } else {
        await APIService.likePost(postId);
      }
      
      // 상태 업데이트
      setIsLiked(!isLiked);
      
      // 게시물 데이터 새로고침 (좋아요 수 업데이트를 위해)
      const updatedPost = await APIService.getPostById(postId);
      setPost(updatedPost);
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    }
  };
  
  // 저장 기능
  const handleSave = async () => {
    try {
      if (isSaved) {
        await APIService.unscrapPost(postId);
      } else {
        await APIService.scrapPost(postId);
      }
      
      // 상태 업데이트
      setIsSaved(!isSaved);
      
      // 게시물 데이터 새로고침 (스크랩 수 업데이트를 위해)
      const updatedPost = await APIService.getPostById(postId);
      setPost(updatedPost);
    } catch (error) {
      console.error('스크랩 처리 중 오류:', error);
    }
  };
  
  // 댓글 작성 기능
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    try {
      await APIService.createComment({
        boardNo: postId,
        replyContent: commentText
      });
      
      // 댓글 입력창 초기화
      setCommentText('');
      
      // 댓글 목록 새로고침
      await fetchComments();
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
    }
  };
  
  const handleCommentChange = (e) => {
    setCommentText(e.target.value);
  };
  
  // 뒤로 가기 기능
  const handleBack = () => {
    navigate(-1); // 이전 페이지로 이동
  };
  
  if (isLoading) {
    return <div className="loading">게시물을 불러오는 중...</div>;
  }
  
  if (error) {
    return <div className="error">{error}</div>;
  }
  
  if (!post) {
    return <div className="error">게시물을 찾을 수 없습니다.</div>;
  }
  
  return (
    <div className="post-detail">
      <div className="post-detail-container">
        <button className="back-button" onClick={handleBack}>
          <i className="fas fa-arrow-left"></i> 뒤로 가기
        </button>
        
        <div className="post-header">
          <div className="post-user">
            <div className="post-user-avatar">
              <img 
                src={APIService.getProfileImageUrl(post.memberPhoto)}
                alt={post.memberNickname}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/icon/profileimage.png';
                }}
              />
            </div>
            <Link to={`/profile/${post.memberNickname}`} className="post-username">
              {post.memberNickname}
            </Link>
          </div>
          
          <h1>{post.boardTitle}</h1>
          
          <div className="post-meta">
            <span className="author">{post.memberName}</span>
            <span className="date">{new Date(post.boardInputdate).toLocaleDateString()}</span>
            <span className="views">조회수 {post.boardReadhit}</span>
          </div>
        </div>
        
        <div className="post-image">
          {post.boardImage && (
            <img 
              src={APIService.getProcessedImageUrl(post.boardImage)}
              alt="게시물 이미지"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/icon/image.png';
              }}
            />
          )}
        </div>
        
        <div className="post-content">
          <p>{post.boardContent}</p>
          
          {post.tags && post.tags.length > 0 && (
            <div className="hashtags-container">
              {post.tags.map((tag, index) => (
                <Link key={index} to={`/tags/${tag}`} className="hashtag">
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
        
        <div className="post-actions">
          <button className={`like-button ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
            <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
            <span>{post.boardLike}</span>
          </button>
          <button className={`save-button ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
            <i className={isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
            <span>{post.boardScrap}</span>
          </button>
        </div>
        
        <div className="post-comments-section">
          <h3 className="comments-title">댓글 {comments.length}개</h3>
          
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <div className="comment-input-container">
              <textarea 
                placeholder="댓글을 남겨보세요..." 
                value={commentText}
                onChange={handleCommentChange}
                className="comment-input"
                rows="3"
              ></textarea>
            </div>
            <button 
              type="submit" 
              className={`comment-submit ${!commentText.trim() ? 'disabled' : ''}`}
              disabled={!commentText.trim()}
            >
              댓글 작성
            </button>
          </form>
          
          <div className="comments-list">
            {comments.map(comment => (
              <div key={comment.id} className="comment-item">
                <div className="comment-avatar">
                  <img 
                    src={comment.profileImage} 
                    alt={comment.username}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/icon/profileimage.png';
                    }}
                  />
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <Link to={`/profile/${comment.username}`} className="comment-author">
                      {comment.username}
                    </Link>
                    <span className="comment-date">{comment.timestamp}</span>
                  </div>
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            ))}
            
            {comments.length === 0 && (
              <div className="empty-comments">
                <p>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PostDetail;