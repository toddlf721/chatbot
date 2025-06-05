import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { formatTimestamp } from '../utils/dateUtils';
import { Editor } from '@tinymce/tinymce-react';
import APIService from '../services/APIService';
import './StudyDetail.css';

function StudyDetail() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [author, setAuthor] = useState(null);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(null);
  const editImageInputRef = useRef(null);
  const editorRef = useRef(null);
  const navigate = useNavigate();


  // 게시물 내용의 이미지 URL을 API 경로로 변환
  const getRelativeContent = (html) => {
    if (!html) return '';

    // 모든 업로드 경로를 API 경로로 변환
    let processed = html.replace(/https?:\/\/localhost:9000\/uploads\//g, 'http://localhost:9000/api/images/content/')
      .replace(/\/uploads\//g, '/api/images/content/');

    // 스터디 이미지 경로 유지 (이미 변환된 경로는 건드리지 않음)
    if (!processed.includes('/api/images/study/')) {
      processed = processed.replace(/\/api\/images\/(\d+)(?!\d*\/)/g, '/api/images/study/$1');
    }

    console.log('처리된 HTML 내용:', processed.substring(0, 100)); // 디버깅용 로그

    return processed;
  };

  // 게시물 데이터 로드
  useEffect(() => {
    const fetchPostData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 게시물 정보 가져오기
        const postData = await APIService.getPostById(postId);

        // 게시물 타입이 'study'가 아니면 에러 표시
        if (postData.boardType !== 'study') {
          setError('해당 게시물은 학습 게시물이 아닙니다.');
          setIsLoading(false);
          return;
        }

        setPost(postData);
        setLikes(postData.boardLike || 0);

        // 작성자 정보 가져오기
        try {
          const authorData = await APIService.getMemberByNickname(postData.memberNickname);
          setAuthor(authorData);
        } catch (err) {
          console.error('작성자 정보 로드 중 오류:', err);
          // 작성자 정보 불러오기 실패해도 게시물은 표시
        }

        // 좋아요 및 스크랩 상태 확인
        const likeStatus = await APIService.checkPostLikeStatus(postId);
        const scrapStatus = await APIService.checkPostScrapStatus(postId);

        setIsLiked(likeStatus.isLiked || false);
        setIsSaved(scrapStatus.isScrapped || false);

        // 댓글 불러오기
        await fetchComments();

        // 연관 게시물 - 같은 태그를 가진 게시물 불러오기
        if (postData.tags && postData.tags.length > 0) {
          // 첫 번째 태그로 관련 게시물 가져오기
          try {
            const relatedPostsData = await APIService.getPostsByTag(postData.tags[0]);
            // 현재 게시물 제외
            setRelatedPosts(relatedPostsData.filter(p => p.boardNo !== parseInt(postId)).slice(0, 3));
          } catch (err) {
            console.error('연관 게시물 로드 중 오류:', err);
            // 연관 게시물 로드 실패해도 진행
          }

          // 인기 태그 가져오기
          try {
            const popularTagsData = await APIService.getPopularTags(10);
            setPopularTags(popularTagsData);
          } catch (err) {
            console.error('인기 태그 로드 중 오류:', err);
            // 인기 태그 로드 실패해도 진행
          }
        }
      } catch (error) {
        console.error('게시물 데이터 로드 중 오류:', error);
        setError('게시물을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [postId]);

  // StudyDetail.js 상단, useState 등 선언 아래에
  const handleCancelEdit = () => {
    // 편집 모드 해제, 기존 내용으로 롤백
    setIsEditing(false);
    setEditContent(post.boardContent);
    setEditTags(post.tags || []);
    setTagInput('');
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      // FormData 객체 생성
      const formData = new FormData();

      // 게시물 데이터를 JSON으로 변환하여 추가
      const boardData = {
        boardTitle: editTitle,
        boardContent: editContent,
        tags: JSON.stringify(editTags)
      };

      formData.append('board', new Blob([JSON.stringify(boardData)], {
        type: 'application/json'
      }));

      // 새 이미지가 있는 경우 추가
      if (editImage) {
        formData.append('images', editImage);
      }

      // API 요청
      await APIService.updatePost(postId, formData);

      // 수정된 내용을 다시 불러오거나 상태 갱신
      const updated = await APIService.getPostById(postId);
      setPost(updated);
      setIsEditing(false);
      setLikes(updated.boardLike || 0);

      // 편집 관련 상태 초기화
      setEditImage(null);
      setEditImagePreview(null);
      if (editImageInputRef.current) {
        editImageInputRef.current.value = '';
      }

      alert('게시물이 성공적으로 수정되었습니다.');
    } catch (err) {
      console.error('수정 저장 중 에러:', err);
      alert('게시물 수정 중 오류가 발생했습니다.');
    }
  };

  // post-action bar 게시물 삭제 버튼
  const handleDeletePost = async () => {
    const confirmDelete = window.confirm("정말 이 게시물을 삭제하시겠습니까?");
    if (!confirmDelete) return;

    try {
      await APIService.deletePost(postId); // postId 사용
      alert("게시물이 삭제되었습니다.");

      // 현재 로그인한 사용자 정보 가져오기
      const storedUser = sessionStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;

      if (currentUser) {
        // 이벤트 발생시켜 데이터 새로고침
        window.dispatchEvent(new CustomEvent('refreshData', {
          detail: { timestamp: Date.now(), type: 'posts', forceRefresh: true }
        }));

        // 자신의 프로필 페이지로 이동
        navigate(`/profile/${currentUser.memberNickname}`);
      } else {
        // 로그인 정보 없을 경우 기본 경로로 이동
        navigate("/home");
      }
    } catch (error) {
    }
  };

  const handleEditPost = () => {
    const confirmEdit = window.confirm("이 게시물을 수정하시겠습니까?");
    if (!confirmEdit) return;

    try {
      setIsEditing(true); // 수정 모드 활성화 (편집 UI가 있다면 표시되도록)
      setEditTitle(post.boardTitle);
      setEditContent(post.boardContent);
      setEditTags(post.tags || []);
    } catch (error) {
      console.error("Error entering edit mode:", error);
      alert("수정 모드로 전환 중 오류가 발생했습니다.");
    }
  };


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

  // 좋아요 기능
  const handleLike = async () => {
    try {
      if (isLiked) {
        await APIService.unlikePost(postId);
        setLikes(likes - 1);
      } else {
        await APIService.likePost(postId);
        setLikes(likes + 1);
      }

      setIsLiked(!isLiked);
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    }
  };

  // 스크랩 기능
  const handleSave = async () => {
    try {
      if (isSaved) {
        await APIService.unscrapPost(postId);
      } else {
        await APIService.scrapPost(postId);
      }

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

  // 수정 모드 시작
  const handleEditStart = () => {
    setEditTitle(post.boardTitle);
    setEditContent(post.boardContent);
    setEditTags(post.tags || []);
    setEditImage(null);
    setEditImagePreview(null);
    setIsEditing(true);
  };

  // 수정 취소
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle(post.boardTitle);
    setEditContent(post.boardContent);
    setEditTags(post.tags || []);
    setTagInput('');
    setEditImage(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = '';
    }
  };

  // 이미지 변경 핸들러
  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setEditImage(file);

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 파일 선택 다이얼로그 열기 함수
  const triggerEditImageInput = () => {
    editImageInputRef.current.click();
  };

  // 이미지 미리보기 제거 함수
  const removeEditImagePreview = () => {
    setEditImage(null);
    setEditImagePreview(null);
    if (editImageInputRef.current) {
      editImageInputRef.current.value = '';
    }
  };

  // 수정 저장
  const handleEditSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('boardTitle', editTitle);
      formData.append('boardContent', editContent);
      formData.append('tags', JSON.stringify(editTags));
      formData.append('boardType', 'study');

      await APIService.updatePost(postId, formData);

      // 게시물 데이터 새로고침
      const updatedPost = await APIService.getPostById(postId);
      setPost(updatedPost);
      setIsEditing(false);
      alert('게시물이 수정되었습니다.');
    } catch (error) {
      console.error('게시물 수정 중 오류:', error);
      alert('게시물 수정 중 오류가 발생했습니다.');
    }
  };

  // 태그 관련 함수들
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '');
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag]);
      setTagInput('');
    }
  };

  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag();
    }
  };

  const removeTag = (indexToRemove) => {
    setEditTags(editTags.filter((_, index) => index !== indexToRemove));
  };

  // 이미지 업로드 핸들러 (TinyMCE용)
  const handleEditorImageUpload = async (blobInfo) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('TinyMCE 이미지 업로드 시작:', blobInfo.filename());

        const formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());

        const response = await APIService.uploadImage(formData);
        console.log('업로드 응답:', response);

        if (!response.imageUrl) {
          throw new Error('서버에서 이미지 URL을 받지 못했습니다.');
        }

        const processedUrl = APIService.getProcessedImageUrl(response.imageUrl);
        console.log('처리된 이미지 URL:', processedUrl);

        resolve(processedUrl);
      } catch (error) {
        console.error('TinyMCE 이미지 업로드 실패:', error);
        reject(error.message || '이미지 업로드에 실패했습니다.');
      }
    });
  };

  if (isLoading) {
    return <div className="study-detail-loading">게시물을 불러오는 중...</div>;
  }

  if (error) {
    return <div className="study-detail-error">{error}</div>;
  }

  if (!post) {
    return <div className="study-detail-error">게시물을 찾을 수 없습니다.</div>;
  }

  return (
    <div className="study-detail">
      <div className="study-detail-container">
        <div className="study-detail-header">
          <div className="header-image" style={{ backgroundImage: `url(${isEditing && editImagePreview ? editImagePreview : APIService.getProcessedImageUrl(post.boardImage)})` }}>
            <div className="header-overlay">
              <div className="header-content">
                {!isEditing && (
                  <div className="post-tags">
                    {post.tags && post.tags.map((tag, index) => (
                      <Link key={index} to={`/tags/${tag}`} className="post-tag">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="edit-title-input"
                      placeholder="제목을 입력하세요"
                    />
                    <div className="edit-image-controls">
                      <input
                        type="file"
                        ref={editImageInputRef}
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleEditImageChange}
                      />
                      <button
                        type="button"
                        className="edit-image-btn"
                        onClick={triggerEditImageInput}
                      >
                        <i className="fas fa-camera"></i> 배경 이미지 변경
                      </button>
                      {editImagePreview && (
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={removeEditImagePreview}
                        >
                          <i className="fas fa-times"></i> 이미지 변경 취소
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <h1 className="post-title">{post.boardTitle}</h1>
                )}
                <div className="post-meta">
                  <div className="post-author">
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
                  <div className="post-info">
                    <span className="post-date">{formatTimestamp(post.boardInputdate)}</span>
                    <span className="post-views">조회수 {post.boardReadhit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="study-detail-content">
          <div className="study-detail-main">
            <article className="post-content">
              {isEditing ? (
                <>
                  <Editor
                    apiKey="mm2znjkik4v21pn6r4mgjq9b21xo8sa2l3cmwdnphoj0rr79"
                    value={editContent}
                    onInit={(evt, editor) => editorRef.current = editor}
                    init={{
                      height: 500,
                      menubar: true,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'image media | alignright alignjustify | bullist numlist outdent indent | ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | image | help',
                      images_upload_handler: handleEditorImageUpload,
                      automatic_uploads: true,
                      file_picker_types: 'image',
                      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px } img { max-width: 100%; height: auto; display: block; margin: 0 auto; }'
                    }}
                    onEditorChange={(newContent) => setEditContent(newContent)}
                  />
                  <div className="tags-input">
                    {editTags.map((tag, index) => (
                      <div key={index} className="tag">
                        <span className="tag-text">#{tag}</span>
                        <button
                          type="button"
                          className="tag-remove"
                          onClick={() => removeTag(index)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      placeholder="태그 입력 후 Enter (쉼표로 구분)"
                      value={tagInput}
                      onChange={handleTagInputChange}
                      onKeyDown={handleTagInputKeyDown}
                      onBlur={handleTagInputBlur}
                    />
                  </div>

                  <div className="post-edit-actions">
                    <button className="post-edit-cancel" onClick={handleCancelEdit}>취소</button>
                    <button className="post-edit-save" onClick={handleSaveEdit}>저장</button>
                  </div>
                </>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: getRelativeContent(post.boardContent) }} />
              )}
            </article>

            <div className="post-actions">
              <button className={`like-button ${isLiked ? 'liked' : ''}`} onClick={handleLike}>
                <i className={isLiked ? 'fas fa-heart' : 'far fa-heart'}></i>
                <span>{likes}</span>
              </button>
              <div className="share-buttons">
                <button className="share-button">
                  <i className="fas fa-share-alt"></i>
                </button>
                <button className={`share-button ${isSaved ? 'saved' : ''}`} onClick={handleSave}>
                  <i className={isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'}></i>
                </button>
                <button className="edit-button" onClick={handleEditPost}>
                  <i className="fas fa-edit"></i>
                </button>
                <button className="delete-button" onClick={handleDeletePost}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div className="author-bio">
              <div className="author-avatar">
                <img
                  src={author ? APIService.getProfileImageUrl(author.memberPhoto) : '/icon/profileimage.png'}
                  alt={post.memberNickname}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/icon/profileimage.png';
                  }}
                />
              </div>
              <div className="author-info">
                <h3 className="author-name">{author ? author.memberName : post.memberNickname}</h3>
                <p className="author-description">{author ? author.memberIntroduce || '작성자 소개가 없습니다.' : '작성자 소개가 없습니다.'}</p>
                <div className="author-social">
                  <Link to={`/profile/${post.memberNickname}`} className="btn-follow">
                    <i className="fas fa-user"></i> 프로필
                  </Link>
                </div>
              </div>
            </div>

            <div className="post-comments-section">
              <h3 className="comments-title">댓글 {comments.length}개</h3>

              <form className="comment-form" onSubmit={handleCommentSubmit}>
                <div className="comment-input-container">
                  <img
                    src="/icon/profileimage.png"
                    alt="프로필"
                    className="comment-avatar"
                  />
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
                      <div className="comment-actions">
                        <button className="comment-action">
                          <i className="far fa-heart"></i> 좋아요
                        </button>
                        <button className="comment-action">
                          <i className="far fa-comment"></i> 답글
                        </button>
                      </div>
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

          <div className="study-detail-sidebar">
            {relatedPosts.length > 0 && (
              <div className="sidebar-section">
                <h3 className="sidebar-title">관련 게시물</h3>
                <div className="sidebar-content">
                  <div className="related-posts">
                    {relatedPosts.map(relatedPost => (
                      <Link
                        to={`/study/${relatedPost.boardNo}`}
                        key={relatedPost.boardNo}
                        className="related-post"
                      >
                        <div className="related-post-img">
                          <img
                            src={APIService.getProcessedImageUrl(relatedPost.boardImage)}
                            alt={relatedPost.boardTitle}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/icon/image.png';
                            }}
                          />
                        </div>
                        <div className="related-post-info">
                          <h4 className="related-post-title">{relatedPost.boardTitle}</h4>
                          <div className="related-post-date">
                            {formatTimestamp(relatedPost.boardInputdate)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {popularTags.length > 0 && (
              <div className="sidebar-section">
                <h3 className="sidebar-title">인기 태그</h3>
                <div className="sidebar-content">
                  <div className="tag-cloud">
                    {popularTags.map((tag, index) => (
                      <Link key={index} to={`/tags/${tag}`} className="tag-item">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudyDetail;