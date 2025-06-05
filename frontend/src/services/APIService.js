import axios from 'axios';
import axiosInstance from './axiosInstance';

axios.defaults.withCredentials = true;

const API_BASE_URL = 'http://localhost:9000/api';


/**
 * APIService - Spring Boot 백엔드와 통신하는 서비스 클래스
 * 모든 API 호출을 중앙에서 관리하여 유지보수 용이
 * 
 * MySQL DB 저장 이미지 대응을 위해 이미지 URL 처리 로직 업데이트
 */
class APIService {
  // 이미지 URL 처리 함수
  getProcessedImageUrl(imagePath) {
    // 이미지 경로가 없는 경우 기본 이미지 반환
    if (!imagePath) return '/icon/image.png';

    // /api/images/content/ 경로인 경우 그대로 사용
    if (imagePath.startsWith('/api/images/content/')) {
      return `http://localhost:9000${imagePath}`;
    }

    // 현재 시간을 쿼리 파라미터로 사용하여 캐시 방지
    const timestamp = Date.now();

    // 이미 완전한 URL인 경우
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      // URL에 이미 쿼리 파라미터가 있는지 확인
      return imagePath.includes('?') ?
        `${imagePath}&t=${timestamp}` :
        `${imagePath}?t=${timestamp}`;
    }

    // API 경로인 경우 (/api/images/숫자 또는 /api/images/profile/숫자)
    if (imagePath.startsWith('/api/images/')) {
      return `http://localhost:9000${imagePath}?t=${timestamp}`;
    }

    // 업로드 경로인 경우 API 경로로 변환
    if (imagePath.startsWith('/uploads/')) {
      const filename = imagePath.split('/uploads/').pop();
      return `http://localhost:9000/api/images/content/${filename}?t=${timestamp}`;
    }

    // 게시물 번호만 있는 경우 (숫자)
    if (/^\d+$/.test(imagePath)) {
      return `http://localhost:9000/api/images/${imagePath}?t=${timestamp}`;
    }

    // 정적 리소스는 그대로 반환 (아이콘 등)
    if (imagePath.startsWith('/icon/')) {
      return imagePath;
    }

    // 그 외 경우는 API 경로로 간주
    return `http://localhost:9000${imagePath}?t=${timestamp}`;
  }

  // 프로필 이미지 URL 처리 함수
  getProfileImageUrl(imagePath) {
    // 이미지 경로가 없는 경우 기본 프로필 이미지 반환
    if (!imagePath) return '/icon/profileimage.png';

    // 아이콘 폴더에 있는 기본 이미지인 경우
    if (imagePath === '/icon/profileimage.png') {
      return imagePath;
    }

    // 새로운 프로필 이미지 API 경로인 경우 (/api/images/profile/숫자)
    if (imagePath.startsWith('/api/images/profile/')) {
      // 캐시 무효화를 위해 타임스탬프 쿼리 파라미터 추가
      return `http://localhost:9000${imagePath}?t=${Date.now()}`;
    }

    // 이미지 처리 로직은 공통 함수 재사용
    return this.getProcessedImageUrl(imagePath);
  }

  // 인증 관련 엔드포인트
  async login(credentials) {
    const userData = await this.sendRequest('/members/login', 'POST', credentials);

    // 프로필 이미지가 없으면 기본 이미지로 설정
    if (!userData.memberPhoto) {
      userData.memberPhoto = '/icon/profileimage.png';
    } else {
      userData.memberPhoto = this.getProfileImageUrl(userData.memberPhoto);
    }

    // 세션 스토리지에 저장 (앱 새로고침 시에도 정보 유지)
    sessionStorage.setItem('currentUser', JSON.stringify(userData));

    return userData;
  }

  async signup(userData) {
    return this.sendRequest('/members/join', 'POST', userData);
  }

  async logout() {
    // 로그아웃 시 세션 스토리지도 정리
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('savedEmail');
    return this.sendRequest('/members/logout', 'POST');
  }

  async getCurrentUser() {
    try {
      const userData = await this.sendRequest('/members/me', 'GET');

      // 프로필 이미지가 없으면 기본 이미지로 설정
      if (!userData.memberPhoto) {
        userData.memberPhoto = '/icon/profileimage.png';
      } else {
        userData.memberPhoto = this.getProfileImageUrl(userData.memberPhoto);
      }

      // 세션 스토리지에 저장 (앱 새로고침 시에도 정보 유지)
      sessionStorage.setItem('currentUser', JSON.stringify(userData));

      return userData;
    } catch (error) {
      // 서버 요청 실패 시 세션 스토리지에 저장된 정보 확인
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw error;
    }
  }

  // 게시물 카테고리 변경
  async updateBoardCategory(postId, category) {
    return this.sendRequest(`/boards/${postId}/category?category=${category}`, 'PUT');
  }

  async updateProfile(formData) {
    // FormData의 경우 Content-Type을 설정하지 않아야 함
    const response = await fetch(`${API_BASE_URL}/members/update`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: '회원 정보 수정 중 오류가 발생했습니다.'
      }));
      throw new Error(errorData.error || '회원 정보 수정 중 오류가 발생했습니다.');
    }

    const userData = await response.json();

    // 프로필 이미지 URL 처리
    if (!userData.memberPhoto) {
      userData.memberPhoto = '/icon/profileimage.png';
    } else {
      userData.memberPhoto = this.getProfileImageUrl(userData.memberPhoto);
    }

    // 세션 스토리지에도 최신 사용자 정보 저장
    sessionStorage.setItem('currentUser', JSON.stringify(userData));

    // 로컬 스토리지에 변경 이벤트를 발생시켜 다른 컴포넌트에 알림
    localStorage.setItem('profileUpdated', Date.now().toString());
    // 바로 삭제하여 향후 업데이트 시에도 이벤트가 발생하도록 함
    localStorage.removeItem('profileUpdated');

    // 스토리지 이벤트를 수동으로 발생시켜 같은 탭에서도 감지할 수 있게 함
    window.dispatchEvent(new Event('storage'));

    return userData;
  }

  async withdrawMember() {
    await this.sendRequest('/members/withdraw', 'DELETE');
    // 세션 스토리지도 정리
    sessionStorage.removeItem('currentUser');
  }

  async getMemberByNickname(nickname) {
    try {
      const userData = await this.sendRequest(`/members/profile/${nickname}`, 'GET');

      // 프로필 이미지가 없으면 기본 이미지로 설정
      if (!userData.memberPhoto) {
        userData.memberPhoto = '/icon/profileimage.png';
      } else {
        userData.memberPhoto = this.getProfileImageUrl(userData.memberPhoto);
      }

      return userData;
    } catch (error) {
      console.error(`${nickname} 사용자 정보 조회 중 오류:`, error);
      throw error;
    }
  }

  // 게시판 관련 엔드포인트
  async getAllPosts() {
    try {
      const posts = await this.sendRequest('/boards', 'GET');

      // 각 게시물에 대해 이미지 URL 처리 및 액세스 권한 필터링
      return posts
        .filter(post => {
          // 서버에서 이미 권한 체크를 했지만 클라이언트 측에서도 한번 더 확인
          // 현재 로그인한 사용자 정보 가져오기
          const storedUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
          const currentUserId = storedUser?.memberNo;

          // 접근 권한 추가 검증
          // 1. 공개 게시물은 모두 볼 수 있음
          if (post.boardVisible === 'public') {
            return true;
          }

          // 2. 본인 게시물은 항상 볼 수 있음
          if (post.memberNo === currentUserId) {
            return true;
          }

          // 3. 비공개 게시물은 작성자만 볼 수 있음
          if (post.boardVisible === 'private' && post.memberNo !== currentUserId) {
            return false;
          }

          // 4. 팔로우 게시물은 팔로우 관계가 있어야 볼 수 있음
          // 참고: 서버에서 이미 필터링했기 때문에 여기서는 추가 검증을 하지 않고 통과시킴
          // 필요시 추가 API 호출로 팔로우 관계 확인 가능

          return true;
        })
        .map(post => {
          // 이미지 URL 처리
          if (post.boardImage) {
            post.boardImage = this.getProcessedImageUrl(post.boardImage);
          } else {
            post.boardImage = '/icon/image.png';
          }

          // 프로필 이미지 처리
          if (!post.memberPhoto) {
            post.memberPhoto = '/icon/profileimage.png';
          } else {
            post.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
          }

          return post;
        });
    } catch (error) {
      console.error('게시물 목록 조회 중 오류:', error);

      // 접근 권한 관련 오류 메시지 설정
      if (error.response && error.response.status === 403) {
        throw new Error('접근 권한이 없는 게시물입니다.');
      }

      throw error;
    }
  }

  async getPostById(postId) {
    const post = await this.sendRequest(`/boards/${postId}`, 'GET');

    // 이미지 URL 처리
    if (post.boardImage) {
      post.boardImage = this.getProcessedImageUrl(post.boardImage);
    } else {
      post.boardImage = '/icon/image.png';
    }

    // 프로필 이미지 처리
    if (!post.memberPhoto) {
      post.memberPhoto = '/icon/profileimage.png';
    } else {
      post.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
    }

    return post;
  }

  async createPost(formData) {
    // FormData의 경우 Content-Type을 설정하지 않아야 함
    const response = await fetch(`${API_BASE_URL}/boards`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: '게시물 작성 중 오류가 발생했습니다.'
      }));
      throw new Error(errorData.error || '게시물 작성 중 오류가 발생했습니다.');
    }

    // 응답 데이터 처리
    const responseData = await response.json();

    // 이미지 URL 처리
    if (responseData.boardImage) {
      responseData.boardImage = this.getProcessedImageUrl(responseData.boardImage);
    }

    return responseData;
  }

  async updatePost(postId, postData) {
    // FormData인 경우 직접 전송
    if (postData instanceof FormData) {
      console.log(`게시물 ID ${postId} 수정 요청`);

      try {
        const response = await fetch(`${API_BASE_URL}/boards/${postId}`, {
          method: 'PUT',
          credentials: 'include',
          body: postData
        });

        console.log('서버 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
          // 오류 응답 처리 개선
          let errorMessage = '게시물 수정 중 오류가 발생했습니다.';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // JSON 파싱 오류가 발생하면 기본 메시지 사용
            console.error('응답 파싱 오류:', e);
          }

          throw new Error(errorMessage);
        }

        // 응답 데이터 처리
        try {
          return await response.json();
        } catch (e) {
          // 응답 본문이 JSON이 아니면 기본 성공 객체 반환
          console.log('응답이 JSON이 아닙니다:', e);
          return { success: true, message: '게시물이 수정되었습니다.' };
        }
      } catch (error) {
        console.error('게시물 수정 중 오류:', error);
        throw error;
      }
    }

    // 일반 객체인 경우 기존 로직 사용
    try {
      if (postData.tags && Array.isArray(postData.tags)) {
        postData.tags = JSON.stringify(postData.tags);
      }
      return this.sendRequest(`/boards/${postId}`, 'PUT', postData);
    } catch (error) {
      console.error('게시물 수정 중 오류 (JSON 방식):', error);
      throw error;
    }
  }

  async deletePost(postId) {
    return this.sendRequest(`/boards/${postId}`, 'DELETE');
  }

  async getStudyPosts() {
    const posts = await this.sendRequest('/boards/study', 'GET');

    // 각 스터디 게시물에 대해 이미지 URL 처리
    return posts.map(post => {
      // 이미지 URL 처리
      if (post.boardImage) {
        post.boardImage = this.getProcessedImageUrl(post.boardImage);
      } else {
        post.boardImage = '/icon/image.png';
      }

      // 프로필 이미지 처리
      if (!post.memberPhoto) {
        post.memberPhoto = '/icon/profileimage.png';
      } else {
        post.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
      }

      return post;
    });
  }

  async getUserPosts(userId) {
    const posts = await this.sendRequest(`/boards/member/${userId}`, 'GET');

    // 각 사용자 게시물에 대해 이미지 URL 처리
    return posts.map(post => {
      // 이미지 URL 처리
      if (post.boardImage) {
        post.boardImage = this.getProcessedImageUrl(post.boardImage);
      } else {
        post.boardImage = '/icon/image.png';
      }

      // 프로필 이미지 처리
      if (!post.memberPhoto) {
        post.memberPhoto = '/icon/profileimage.png';
      } else {
        post.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
      }

      return post;
    });
  }

  // 태그 관련 엔드포인트
  async getPostsByTag(tagName) {
    try {
      const posts = await this.sendRequest(`/tags/${tagName}/boards`, 'GET');

      // 각 게시물에 대해 이미지 URL 처리 (모든 이미지 필드 처리)
      return posts.map(post => {
        // 이미지 URL 처리
        if (post.boardImage) {
          post.boardImage = this.getProcessedImageUrl(post.boardImage);
        } else {
          post.boardImage = '/icon/image.png';
        }

        // 썸네일 이미지 처리 (있을 경우)
        if (post.thumbnailImage) {
          post.thumbnailImage = this.getProcessedImageUrl(post.thumbnailImage);
        } else if (post.boardImage) {
          post.thumbnailImage = post.boardImage; // boardImage가 있으면 이를 썸네일로 사용
        } else {
          post.thumbnailImage = '/icon/image.png';
        }

        // 프로필 이미지 처리
        if (!post.memberPhoto) {
          post.memberPhoto = '/icon/profileimage.png';
        } else {
          post.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
        }

        return post;
      });
    } catch (error) {
      console.error(`태그 "${tagName}" 게시물 조회 중 오류 발생:`, error);
      throw error;
    }
  }

  async getPopularTags(limit = 10) {
    return this.sendRequest(`/tags/popular?limit=${limit}`, 'GET');
  }

  // 댓글 관련 엔드포인트
  async getPostComments(postId) {
    const comments = await this.sendRequest(`/replies/board/${postId}`, 'GET');

    // 댓글 작성자 프로필 이미지 처리
    return comments.map(comment => {
      if (!comment.memberPhoto) {
        comment.memberPhoto = '/icon/profileimage.png';
      } else {
        comment.memberPhoto = this.getProfileImageUrl(comment.memberPhoto);
      }

      return comment;
    });
  }

  async createComment(commentData) {
    return this.sendRequest('/replies', 'POST', commentData);
  }

  async updateComment(commentId, commentData) {
    return this.sendRequest(`/replies/${commentData.boardNo}/${commentId}`, 'PUT', {
      replyContent: commentData.replyContent
    });
  }

  async deleteComment(commentId) {
    return this.sendRequest(`/replies/${commentId}`, 'DELETE');
  }

  // 신고 관련 엔드포인트
  async reportPost(reportedBoardNo, reason) {
    return this.sendRequest('/reports', 'POST', { reportedBoardNo, reason });
  }

  // 스터디 이미지 업로드 메서드 추가
  async uploadStudyImage(formData) {
    try {
      console.log('스터디 이미지 업로드 요청:', formData.get('file'));

      const response = await fetch(`${API_BASE_URL}/images/study/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 응답:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(errorText || '스터디 이미지 업로드에 실패했습니다.');
      }

      const responseText = await response.text();
      console.log('업로드 성공 응답:', responseText);

      // 응답이 JSON인지 먼저 확인
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // JSON이 아닌 경우, 텍스트 응답을 그대로 URL로 사용
        return { imageUrl: responseText };
      }

      // JSON 응답인 경우, 적절한 필드에서 URL 추출
      const imageUrl = data.location || data.imageUrl || data.url || responseText;
      return { imageUrl };
    } catch (error) {
      console.error('스터디 이미지 업로드 처리 중 오류:', error);
      throw error;
    }
  }


  // 좋아요 관련 엔드포인트
  async likePost(postId) {
    return this.sendRequest(`/likes/boards/${postId}`, 'POST');
  }

  async unlikePost(postId) {
    return this.sendRequest(`/likes/boards/${postId}`, 'DELETE');
  }

  async getLikedPosts() {
    return this.sendRequest('/likes/boards', 'GET');
  }

  async checkPostLikeStatus(postId) {
    return this.sendRequest(`/likes/boards/${postId}/status`, 'GET');
  }

  // 스크랩(북마크) 관련 엔드포인트
  async scrapPost(postId) {
    return this.sendRequest(`/scraps/${postId}`, 'POST');
  }

  async unscrapPost(postId) {
    return this.sendRequest(`/scraps/${postId}`, 'DELETE');
  }

  async getScrappedPosts() {
    return this.sendRequest('/scraps', 'GET');
  }

  async checkPostScrapStatus(postId) {
    return this.sendRequest(`/scraps/${postId}/status`, 'GET');
  }

  // 팔로우 관련 엔드포인트
  async followUser(username) {
    return this.sendRequest(`/follows/${username}`, 'POST');
  }

  async unfollowUser(username) {
    return this.sendRequest(`/follows/${username}`, 'DELETE');
  }

  async getAllReports() {
    const res = await axiosInstance.get('/api/admin/reports');
    return res.data;
  }

  async getFollowers(username) {
    try {
      const response = await this.sendRequest(`/follows/${username}/followers`, 'GET');

      // 프로필 이미지 URL 처리
      if (Array.isArray(response)) {
        return response.map(follower => {
          // 문자열인 경우 기본 데이터 반환
          if (typeof follower === 'string') {
            return follower;
          }

          // 객체인 경우 프로필 이미지 URL 처리
          if (follower.memberPhoto) {
            follower.memberPhoto = this.getProfileImageUrl(follower.memberPhoto);
          }
          return follower;
        });
      }

      return response || [];
    } catch (error) {
      console.error('팔로워 목록 불러오기 오류:', error);
      return [];
    }
  }

  async getFollowing(username) {
    try {
      const response = await this.sendRequest(`/follows/${username}/following`, 'GET');

      // 프로필 이미지 URL 처리 - 응답이 배열인지 확인
      if (Array.isArray(response)) {
        return response.map(follow => {
          // 응답이 문자열 배열인 경우와 객체 배열인 경우 모두 처리
          if (typeof follow === 'string') {
            return {
              memberNickname: follow,
              memberName: follow,
              memberPhoto: '/icon/profileimage.png'
            };
          }

          // 객체인 경우 - 프로필 이미지 URL 처리
          if (follow.memberPhoto) {
            follow.memberPhoto = this.getProfileImageUrl(follow.memberPhoto);
          } else {
            follow.memberPhoto = '/icon/profileimage.png';
          }
          return follow;
        });
      }

      return response || [];
    } catch (error) {
      console.error('팔로잉 목록 불러오기 오류:', error);
      return [];
    }
  }

  async checkFollowStatus(username) {
    return this.sendRequest(`/follows/${username}/status`, 'GET');
  }

  async getSuggestedUsers() {
    const users = await this.sendRequest('/follows/suggested', 'GET');

    // 각 추천 사용자에 대해 이미지 처리
    return users.map(user => {
      if (!user.memberPhoto) {
        user.memberPhoto = '/icon/profileimage.png';
      } else {
        user.memberPhoto = this.getProfileImageUrl(user.memberPhoto);
      }
      return user;
    });
  }

  // 카테고리 이름 업데이트
  async updateCategoryName(categoryCode, categoryName) {
    return this.sendRequest('/categories', 'PUT', {
      categoryCode,
      categoryName
    });
  }

  // 특정 회원의 카테고리 이름 조회
  async getCategoryNames(memberNo) {
    return this.sendRequest(`/categories/${memberNo}`, 'GET');
  }

  // 알림 관련 엔드포인트
  async getNotifications() {
    try {
      const noticelist = await this.sendRequest('/notifications', 'GET');
      console.log(noticelist);

      return noticelist;
    } catch (error) {
      console.error('알림을 가져오는중 오류 발생', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId) {
    return this.sendRequest(`/notifications/${notificationId}/read`, 'PUT');
  }

  async deleteNotification(notificationId) {
    return this.sendRequest(`/notifications/${notificationId}`, 'DELETE');
  }

  async markAllNotificationsAsRead() {
    return this.sendRequest('/notifications/read-all', 'PUT');
  }

  async getUnreadNotificationCount() {
    return this.sendRequest('/notifications/unread-count', 'GET');
  }

  /**
 * 전체 회원 수를 가져오는 API
 */
  async getTotalUsers() {
    const res = await axiosInstance.get(`/api/admin/stats/users`);
    return res.data;
  }

  /**
   * 월별 게시글 수 통계를 가져오는 API
   */
  async getMonthlyPostStats() {
    const res = await axiosInstance.get(`/api/admin/stats/posts/monthly`);
    return res.data;
  }

  /**
   * 최근 가입한 회원 정보를 가져오는 API
   */
  async getRecentMembers() {
    const res = await axiosInstance.get(`/api/admin/stats/users/recent`);
    return res.data;
  }

  /**
   * 일별 게시글 수 통계를 가져오는 API
   */
  async getDailyPostStats() {
    const res = await axiosInstance.get(`/api/admin/stats/posts/daily`);
    return res.data;
  }

  /**
   * 최근 로그인한 사용자 수를 가져오는 API
   */
  async getRecentlyLoggedInUserCount() {
    const res = await axiosInstance.get(`/api/admin/stats/users/logged-in-recently`);
    return res.data;
  }

  /**
   * 전체 게시글 수를 가져오는 API
   */
  async getTotalPostCount() {
    const res = await axiosInstance.get(`/api/admin/stats/posts/count`);
    return res.data;
  }

  /**
   * 전체 회원 목록을 가져오는 API
   */
  async getAllMembers() {
    const res = await axiosInstance.get(`/api/admin/members`);
    return res.data;
  }


  // 이미지 경로가 처리된 스터디 게시물 조회
  async getStudyBoardsWithProcessedContent() {
    try {
      const posts = await this.sendRequest('/boards/study-board', 'GET');

      // 각 스터디 게시물에 대해 이미지 URL 처리
      return posts.map(post => {
        // 이미지 URL 처리
        if (post.boardImage) {
          post.boardImage = this.getProcessedImageUrl(post.boardImage);
        } else {
          post.boardImage = '/icon/image.png';
        }

        // 프로필 이미지 처리
        if (!post.memberPhoto) {
          post.memberPhoto = '/icon/profileimage.png';
        } else {
          post.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
        }

        return post;
      });
    } catch (error) {
      console.error('스터디 게시물 조회 중 오류:', error);
      throw error;
    }
  }

  // 정지 상태 토글
  async updateBanStatus(memberNo, isBanned) {
    await axios.post(`${API_BASE_URL}/admin/members/${memberNo}/ban-toggle`);
  }

  async suspendMember(memberNo, suspendUntil, reason) {
    await axios.post(`${API_BASE_URL}/admin/members/${memberNo}/suspend`, {
      suspendUntil,
      reason,

    });
  }

  // API 요청을 보내는 공통 메서드
  async sendRequest(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    };

    if (data && !(data instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    } else if (data) {
      options.body = data;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

      // 204 No Content와 같은 응답 처리
      if (response.status === 204) {
        return { success: true };
      }

      // DELETE 요청은 응답 본문이 없는 경우가 많음
      if (method === 'DELETE' && response.ok) {
        return { success: true };
      }

      // 일반적인 JSON 응답 처리
      if (response.ok) {
        try {
          const jsonData = await response.json();
          return jsonData;
        } catch (e) {
          // JSON 파싱이 불가능한 경우
          return { success: true };
        }
      }

      // 에러 응답 처리
      const errorData = await response.json().catch(() => ({
        error: '요청 처리 중 오류가 발생했습니다.'
      }));

      // 사용자 관련 에러인 경우 특별 처리
      if (endpoint.includes('/members/profile/') && response.status === 404) {
        throw new Error('해당 사용자를 찾을 수 없거나 탈퇴한 회원입니다.');
      }

      throw new Error(errorData.error || '문제가 발생했습니다.');
    } catch (error) {
      console.error(`API 오류 (${endpoint}):`, error);

      // 연결 거부 오류인 경우 더 명확한 메시지 제공
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        throw new Error('서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      }

      throw error;
    }
  }

  // 이미지 업로드
  async uploadImage(formData) {
    try {
      console.log('이미지 업로드 요청:', formData.get('file'));

      const response = await fetch(`${API_BASE_URL}/images/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('서버 응답:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(errorText || '이미지 업로드에 실패했습니다.');
      }

      const responseText = await response.text();
      console.log('업로드 성공 응답:', responseText);

      // 응답이 JSON인지 먼저 확인
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // JSON이 아닌 경우, 텍스트 응답을 그대로 URL로 사용
        return { imageUrl: responseText };
      }

      // JSON 응답인 경우, 적절한 필드에서 URL 추출
      const imageUrl = data.boardImage || data.imageUrl || data.url || responseText;
      return { imageUrl };
    } catch (error) {
      console.error('이미지 업로드 처리 중 오류:', error);
      throw error;
    }
  }


  //검색영역
  /**
   * 사용자 검색 API
   * @param {string} query - 검색어
   * @returns {Promise<Array>} - 검색된 사용자 목록
   */

  async searchUsers(query) {
    try {
      const users = await this.sendRequest(`/members/search?query=${encodeURIComponent(query)}`, 'GET');

      // // users 에 담긴정보
      // memberNo;
      // memberNickname;
      // memberName;
      // memberEmail;
      // memberPhoto;
      // memberPhotoType;


      // 각 사용자에 대해 프로필 이미지 URL 처리
      return users.map(user => {
        // 프로필 이미지 URL 처리
        if (!user.memberPhoto) {
          user.memberPhoto = '/icon/profileimage.png';
        } else {
          user.memberPhoto = this.getProfileImageUrl(user.memberPhoto);
        }


        return {
          id: user.memberNo,
          username: user.memberNickname,
          fullName: user.memberName || user.memberNickname,
          profileImage: user.memberPhoto
        };
      });
    } catch (error) {
      console.error('사용자 검색 중 오류 발생:', error);
      // 오류 발생 시 빈 배열 반환
      return [];
    }
  }


  // APIService.js에 추가할 수정된 태그 검색 함수
  async searchTags(query) {
    try {
      // '#' 문자 제거하고 API 호출
      const tagQuery = query.startsWith('#') ? query.substring(1) : query;

      // 태그 검색 API 호출
      const tags = await this.sendRequest(`/tags/searchtag?query=${encodeURIComponent(tagQuery)}`, 'GET');


      // 고유 ID를 보장하기 위한 카운터
      let counter = 0;

      // 태그 검색 결과 가공
      // 백엔드에서 tagName과 boardCount만 전달됨
      return tags.map(tag => {
        // 인덱스 기반 고유 ID 생성
        const uniqueId = `tag_index_${counter++}`;

        return {
          id: uniqueId,
          tagName: tag.tagName || '',
          postCount: tag.boardCount || 0,
          type: 'tag'
        };
      });
    } catch (error) {
      console.error('태그 검색 중 오류 발생:', error);
      return [];
    }
  }

  // APIService.js에서 완전히 최적화된 getPostsByTag 함수
  async getPostsByTag2(tagName) {
    try {
      // URL 경로를 PathVariable 방식의 백엔드 컨트롤러 매핑에 맞게 수정
      const response = await this.sendRequest(`/tags/boardlist/${encodeURIComponent(tagName)}`, 'GET');
      console.log('원본 태그 게시물 응답:', response); // 디버깅용

      // 데이터 추출 (다양한 응답 구조 처리)
      let postsData = [];

      // 1. 응답이 직접 배열인 경우 (예: [{ boardNo: 1, ... }])
      if (Array.isArray(response)) {
        postsData = response;
      }
      // 2. 응답이 { results: [...] } 형식인 경우
      else if (response && Array.isArray(response.results)) {
        postsData = response.results;
      }
      // 3. 응답이 { boards: [...], count: 5 } 형식인 경우
      else if (response && Array.isArray(response.boards)) {
        postsData = response.boards;
      }
      // 4. 기타 응답 형식인 경우 빈 배열 반환
      else {
        console.warn('알 수 없는 응답 형식:', response);
        return [];
      }

      console.log('추출된 게시물 데이터:', postsData); // 디버깅용

      // 게시물 데이터 처리
      const processedPosts = postsData.map(post => {
        // null 또는 undefined 체크
        if (!post) return null;

        // 게시물 객체 복사 (원본 수정 방지)
        const processedPost = { ...post };

        // 썸네일 이미지 처리
        if (post.thumbnailImage) {
          processedPost.thumbnailImage = this.getProcessedImageUrl(post.thumbnailImage);
        } else if (post.boardImage) {
          processedPost.thumbnailImage = this.getProcessedImageUrl(post.boardImage);
        } else {
          processedPost.thumbnailImage = '/icon/image.png';
        }

        // 게시물 제목 처리
        processedPost.boardTitle = post.boardTitle || '제목 없음';

        // 작성자 프로필 이미지 처리
        if (post.memberPhoto) {
          processedPost.memberPhoto = this.getProfileImageUrl(post.memberPhoto);
        } else {
          processedPost.memberPhoto = '/icon/profileimage.png';
        }

        // 작성자 닉네임 처리
        processedPost.memberNickname = post.memberNickname || '사용자';

        // 좋아요 수 처리
        processedPost.boardLike = post.boardLike || post.boardCnt || 0;

        // 댓글 수 처리
        processedPost.boardReplies = post.boardReplies || 0;

        return processedPost;
      }).filter(post => post !== null); // null 항목 제거

      console.log('처리된 게시물 데이터:', processedPosts); // 디버깅용
      return processedPosts;

    } catch (error) {
      console.error(`태그 "${tagName}" 게시물 조회 중 오류 발생:`, error);
      return []; // 에러 발생 시 빈 배열 반환 (throw 대신)
    }
  }




  //팔로우 관련
  // 사용자의 팔로워 목록 조회 (GET 방식)
  async getUserFollowers(username) {
    try {
      // GET 요청: 리소스 조회
      const response = await this.sendRequest(`/follow/${username}/followers`, 'GET');

      // 프로필 이미지 URL 처리
      if (response && Array.isArray(response)) {
        return response.map(follower => {
          // 프로필 이미지 URL 설정
          if (follower.memberPhoto) {
            follower.memberPhoto = this.getProfileImageUrl(follower.memberPhoto);
          } else {
            follower.memberPhoto = '/icon/profileimage.png';
          }
          return follower;
        });
      }
      return [];
    } catch (error) {
      console.error('팔로워 목록 조회 오류:', error);
      return [];
    }
  }

  // 사용자의 팔로잉 목록 조회 (GET 방식)
  async getUserFollowing(username) {
    try {
      // GET 요청: 리소스 조회
      const response = await this.sendRequest(`/follow/${username}/following`, 'GET');

      // 프로필 이미지 URL 처리
      if (response && Array.isArray(response)) {
        return response.map(following => {
          // 프로필 이미지 URL 설정
          if (following.memberPhoto) {
            following.memberPhoto = this.getProfileImageUrl(following.memberPhoto);
          } else {
            following.memberPhoto = '/icon/profileimage.png';
          }
          return following;
        });
      }
      return [];
    } catch (error) {
      console.error('팔로잉 목록 조회 오류:', error);
      return [];
    }
  }
  // 공지사항 조회 
  async getNotice() {
    try {
      const response = await axiosInstance.get('/api/admin/notice');
      return response.data;
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      return null;
    }
  }

  // 공지사항 등록 조회
  async saveNotice(noticeData) {
    try {
      const response = await axiosInstance.post('/api/notice/register', noticeData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      throw error;
    }
  }
  async getLatestNotice() {
    try {
      const { data } = await axiosInstance.get('/api/notice/latest');
      return data;    // { id, content, startDate, endDate, createdAt }
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      return null;
    }
  }

  async unsuspendMember(memberNo) {
    await axios.post(`${API_BASE_URL}/admin/members/${memberNo}/unsuspend`);
  }
  //전체신고
  async getTotalReportCount() {
    const res = await axiosInstance.get("/api/admin/reports/count");
    return res.data;
  }


  //공지사항
  async registerNotice(data) {
    const response = await axiosInstance.post("/api/notice/register", data);
    return response.data;
  }

  async getRecentReports() {
    const res = await axiosInstance.get("/api/reports/recent");
    return res.data;
  }



}

export default new APIService();