import React, { useState, useEffect, useCallback } from 'react';
import Post from './Post';
import APIService from '../services/APIService';
import './Feed.css';

function Feed({ posts = [], setPosts, users = {}, fetchPosts }) {
  const [likedPosts, setLikedPosts] = useState({});
  const [savedPosts, setSavedPosts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    } else {
      // 세션 스토리지에 없으면 API로 가져오기 (선택사항)
      APIService.getCurrentUser()
        .then(userData => {
          setCurrentUser(userData);
        })
        .catch(error => {
          console.error('현재 사용자 정보 로드 중 오류:', error);
        });
    }
  }, []);

  // study 게시물을 제외한 모든 게시물 필터링
  const filteredPosts = Array.isArray(posts)
    ? posts.filter(post => {
      // study 타입 제외
      if (post.boardType === 'study') return false;

      // 접근 권한이 있는 게시물만 표시

      // 1. 본인 게시물은 항상 볼 수 있음
      if (post.memberNo === currentUser?.memberNo) {
        return true;
      }

      // 2. 공개 게시물은 모두 볼 수 있음
      if (post.boardVisible === 'public') {
        return true;
      }

      // 3. 비공개 게시물은 본인만 볼 수 있음 (이미 위에서 확인했으므로 여기선 false)
      if (post.boardVisible === 'private') {
        return false;
      }

      // 4. 팔로워 공개 게시물은 팔로우 상태가 accepted인 경우만 볼 수 있음
      // 백엔드에서 이미 필터링했으므로 여기서는 추가 검증 없이 통과
      // 참고: 필요시 followRepository를 통해 추가 검증 가능
      return true;
    })
    : [];

  // 초기 렌더링 및 posts 변경 시에만 좋아요 및 스크랩 상태 초기화
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    const initializePostStatuses = async () => {
      try {
        // 이미 불러온 경우는 다시 요청하지 않음
        if (postsLoaded && Object.keys(likedPosts).length > 0) {
          return;
        }

        const [likedPostsIds, savedPostsIds] = await Promise.all([
          APIService.getLikedPosts(),
          APIService.getScrappedPosts()
        ]);

        const newLikedState = {};
        const newSavedState = {};

        if (Array.isArray(filteredPosts)) {
          filteredPosts.forEach(post => {
            newLikedState[post.boardNo] = likedPostsIds.includes(post.boardNo);
            newSavedState[post.boardNo] = savedPostsIds.includes(post.boardNo);
          });
        }

        setLikedPosts(newLikedState);
        setSavedPosts(newSavedState);
        setPostsLoaded(true);
      } catch (error) {
        console.error('게시물 상태 초기화 중 오류 발생:', error);
      }
    };

    if (Array.isArray(filteredPosts) && filteredPosts.length > 0) {
      initializePostStatuses();
    }
  }, [filteredPosts, postsLoaded]);

  // 좋아요 또는 저장 상태가 변경된 후에만 해당 함수에서 API 호출
  const handleLike = async (postId) => {
    try {
      setIsLoading(true);

      // 현재 좋아요 상태 저장
      const currentLiked = likedPosts[postId] || false;

      // UI 상태 즉시 업데이트 (낙관적 업데이트)
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !currentLiked
      }));

      // 목록에서 해당 게시물 찾기
      const postIndex = filteredPosts.findIndex(post => post.boardNo === postId);

      if (postIndex !== -1) {
        // 게시물이 존재하는 경우, 좋아요 수 즉시 업데이트
        const updatedPosts = [...filteredPosts];
        const currentPost = updatedPosts[postIndex];

        // 좋아요 수 업데이트
        updatedPosts[postIndex] = {
          ...currentPost,
          boardLike: currentLiked
            ? Math.max(0, (currentPost.boardLike || 0) - 1)
            : (currentPost.boardLike || 0) + 1
        };

        // 게시물 목록 상태 업데이트
        if (setPosts) {
          setPosts(prevPosts =>
            prevPosts.map(post =>
              post.boardNo === postId
                ? updatedPosts[postIndex]
                : post
            )
          );
        }
      }

      // 서버에 요청
      if (currentLiked) {
        // 좋아요 취소
        await APIService.unlikePost(postId);
      } else {
        // 좋아요 등록
        await APIService.likePost(postId);
      }

      // 백그라운드에서 게시물 정보 업데이트 (필요한 경우)
      if (fetchPosts) {
        // 타임스탬프를 추가하여 이미지 캐시 무효화
        const timestamp = Date.now();

        // 새로고침 이벤트 발생
        window.dispatchEvent(new CustomEvent('refreshData', {
          detail: { timestamp: timestamp, type: 'posts', forceRefresh: true }
        }));

        fetchPosts().catch(error => console.error('게시물 새로고침 중 오류:', error));
      }
    } catch (error) {
      // 오류 발생 시 원래 상태로 복구
      setLikedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
      console.error('좋아요 처리 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 스크랩 버튼 클릭 처리
  const handleSave = async (postId) => {
    try {
      setIsLoading(true);

      if (savedPosts[postId]) {
        // 스크랩 취소
        await APIService.unscrapPost(postId);
      } else {
        // 스크랩 등록
        await APIService.scrapPost(postId);
      }

      // UI 상태 업데이트
      setSavedPosts(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
    } catch (error) {
      console.error('스크랩 처리 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 게시물 수정 처리
  const handleEditPost = async (postId, editData) => {
    try {
      setIsLoading(true);

      // FormData 객체 생성
      const formData = new FormData();

      // 게시물 데이터를 JSON으로 변환하여 추가
      const boardData = {
        boardContent: editData.content,
        tags: JSON.stringify(editData.tags)
      };

      formData.append('board', new Blob([JSON.stringify(boardData)], {
        type: 'application/json'
      }));

      // API 호출하여 게시물 수정
      await APIService.updatePost(postId, formData);

      // 게시물 리스트 새로고침
      if (fetchPosts) {
        const updatedPosts = await fetchPosts();

        // posts 상태 업데이트
        if (Array.isArray(updatedPosts) && setPosts) {
          setPosts(updatedPosts);
        }

        // 좋아요 및 스크랩 상태 업데이트
        const newLikedState = { ...likedPosts };
        const newSavedState = { ...savedPosts };

        if (Array.isArray(updatedPosts)) {
          updatedPosts.forEach(post => {
            if (post.boardNo === postId) {
              // 수정된 게시물의 좋아요/저장 상태 유지
              newLikedState[post.boardNo] = likedPosts[post.boardNo] || false;
              newSavedState[post.boardNo] = savedPosts[post.boardNo] || false;
            }
          });
        }

        setLikedPosts(newLikedState);
        setSavedPosts(newSavedState);
      }

      // 성공 메시지
      console.log('게시물이 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('게시물 수정 중 오류:', error);
      alert('게시물 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 게시물 삭제 처리
  const handleDeletePost = async (postId) => {
    // 1) 옵티미스틱 업데이트: 화면에서 즉시 제거
    setPosts(prev => prev.filter(post => post.boardNo !== postId));

    try {
      // 2) 서버에 삭제 요청
      await APIService.deletePost(postId);
      // (선택) 성공 토스트 띄우기
      console.log('게시물이 삭제되었습니다.');
    } catch (error) {
      console.error('게시물 삭제 실패, 복구 시도:', error);
      // 3) 실패 시: 다시 전체 불러와서 복구
      if (fetchPosts) {
        await fetchPosts();
      }
    }
  };

  // 로딩 중이며 게시물이 없을 경우 표시
  if (isLoading && (!Array.isArray(filteredPosts) || filteredPosts.length === 0)) {
    return <div className="feed-loading">게시물을 불러오는 중...</div>;
  }

  return (
    <div className="feed">
      {/* 게시물 리스트 렌더링 - study 타입 제외한 게시물 표시 */}
      {filteredPosts.map(post => (
        <Post
          key={post.boardNo}
          id={post.boardNo}
          username={post.memberNickname}
          profileImage={post.memberPhoto}
          imageUrl={post.boardImage}
          content={post.boardContent}
          likes={post.boardLike || 0}
          comments={post.replyCount || 0}
          timestamp={post.boardInputdate}
          tags={post.tags || []}
          isLiked={likedPosts[post.boardNo] || false}
          isSaved={savedPosts[post.boardNo] || false}
          onLike={() => handleLike(post.boardNo)}
          onSave={() => handleSave(post.boardNo)}
          onDelete={() => handleDeletePost(post.boardNo)}
          onEdit={(editData) => handleEditPost(post.boardNo, editData)}
          users={users}
          fetchPosts={fetchPosts}
        />
      ))}

      {/* 게시물이 하나도 없을 경우 안내 메시지 */}
      {filteredPosts.length === 0 && (
        <div className="empty-feed">
          <div className="empty-feed-message">
            <i className="fas fa-camera-retro"></i>
            <h3>게시물이 없습니다</h3>
            <p>팔로우한 사람들의 게시물이 여기에 표시됩니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feed;