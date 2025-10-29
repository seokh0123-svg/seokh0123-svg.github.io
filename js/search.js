/**
 * 고급 검색 기능
 */

class SearchManager {
  constructor() {
    this.searchIndex = [];
    this.isInitialized = false;
    this.init();
  }

  /**
   * 초기화
   */
  async init() {
    try {
      await this.buildSearchIndex();
      this.setupSearchUI();
      this.isInitialized = true;
    } catch (error) {
      console.error('검색 초기화 실패:', error);
    }
  }

  /**
   * 검색 인덱스 구축
   */
  async buildSearchIndex() {
    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();
      
      this.searchIndex = posts.map(post => ({
        ...post,
        searchableText: this.createSearchableText(post)
      }));
    } catch (error) {
      console.error('검색 인덱스 구축 실패:', error);
      this.searchIndex = [];
    }
  }

  /**
   * 검색 가능한 텍스트 생성
   */
  createSearchableText(post) {
    const parts = [
      post.title || '',
      post.excerpt || '',
      post.description || '',
      post.category || '',
      ...(post.tags || [])
    ];
    
    return parts.join(' ').toLowerCase();
  }

  /**
   * 검색 UI 설정
   */
  setupSearchUI() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (searchInput) {
      // 실시간 검색 (디바운싱)
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.performSearch(e.target.value);
        }, 300);
      });

      // 엔터키 검색
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(e.target.value);
        }
      });

      // 포커스 시 검색 힌트 표시
      searchInput.addEventListener('focus', () => {
        this.showSearchSuggestions();
      });

      // 포커스 아웃 시 힌트 숨기기
      searchInput.addEventListener('blur', () => {
        setTimeout(() => this.hideSearchSuggestions(), 200);
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = searchInput ? searchInput.value : '';
        this.performSearch(query);
      });
    }
  }

  /**
   * 검색 실행
   */
  performSearch(query) {
    if (!this.isInitialized) {
      console.warn('검색이 아직 초기화되지 않았습니다.');
      return;
    }

    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      this.clearSearch();
      return;
    }

    const results = this.search(trimmedQuery);
    this.displaySearchResults(results, trimmedQuery);
  }

  /**
   * 검색 알고리즘
   */
  search(query) {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    
    return this.searchIndex
      .map(post => {
        const score = this.calculateRelevanceScore(post, searchTerms);
        return { ...post, score };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }

  /**
   * 관련도 점수 계산
   */
  calculateRelevanceScore(post, searchTerms) {
    let score = 0;
    const searchableText = post.searchableText;
    
    searchTerms.forEach(term => {
      // 제목에서 정확히 일치하는 경우 높은 점수
      if (post.title && post.title.toLowerCase().includes(term)) {
        score += 10;
      }
      
      // 제목에서 시작하는 경우 더 높은 점수
      if (post.title && post.title.toLowerCase().startsWith(term)) {
        score += 5;
      }
      
      // 태그에서 일치하는 경우 높은 점수
      if (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term))) {
        score += 8;
      }
      
      // 카테고리에서 일치하는 경우
      if (post.category && post.category.toLowerCase().includes(term)) {
        score += 6;
      }
      
      // 설명에서 일치하는 경우
      if (post.description && post.description.toLowerCase().includes(term)) {
        score += 4;
      }
      
      // 전체 텍스트에서 일치하는 경우
      if (searchableText.includes(term)) {
        score += 2;
      }
      
      // 부분 일치 점수
      const partialMatches = (searchableText.match(new RegExp(term, 'g')) || []).length;
      score += partialMatches;
    });
    
    return score;
  }

  /**
   * 검색 결과 표시
   */
  displaySearchResults(results, query) {
    // 검색 결과를 전역 앱에 전달
    if (window.blogApp && typeof window.blogApp.handleSearchResults === 'function') {
      window.blogApp.handleSearchResults(results, query);
    } else {
      // 대체 방법: 직접 DOM 업데이트
      this.updatePostsDisplay(results);
    }
    
    this.updateSearchUI(query, results.length);
  }

  /**
   * 게시글 표시 업데이트
   */
  updatePostsDisplay(results) {
    const postsGrid = document.getElementById('postsGrid');
    if (!postsGrid) return;

    if (results.length === 0) {
      postsGrid.innerHTML = `
        <div class="no-posts">
          <p>검색 결과가 없습니다.</p>
        </div>
      `;
      return;
    }

    postsGrid.innerHTML = '';
    results.forEach(post => {
      const postCard = this.createPostCard(post);
      postsGrid.appendChild(postCard);
    });
  }

  /**
   * 게시글 카드 생성
   */
  createPostCard(post) {
    const card = document.createElement('a');
    card.href = `post.html?file=${encodeURIComponent(post.file)}`;
    card.className = 'post-card';
    
    const tagsHtml = post.tags && post.tags.length > 0 
      ? post.tags.map(tag => `<span class="post-card-tag">${this.escapeHtml(tag)}</span>`).join('')
      : '';

    card.innerHTML = `
      <h3 class="post-card-title">${this.escapeHtml(post.title)}</h3>
      <div class="post-card-meta">
        <time class="post-card-date">${this.formatDate(post.date)}</time>
        ${post.category ? `<span class="post-card-category">${this.escapeHtml(post.category)}</span>` : ''}
      </div>
      <p class="post-card-excerpt">${this.escapeHtml(post.excerpt)}</p>
      ${tagsHtml ? `<div class="post-card-tags">${tagsHtml}</div>` : ''}
    `;

    return card;
  }

  /**
   * 검색 UI 업데이트
   */
  updateSearchUI(query, resultCount) {
    const postsCount = document.getElementById('postsCount');
    if (postsCount) {
      postsCount.textContent = `"${query}"에 대한 ${resultCount}개의 결과`;
    }
  }

  /**
   * 검색 초기화
   */
  clearSearch() {
    if (window.blogApp && typeof window.blogApp.clearSearch === 'function') {
      window.blogApp.clearSearch();
    }
    
    const postsCount = document.getElementById('postsCount');
    if (postsCount) {
      postsCount.textContent = '게시글 목록';
    }
  }

  /**
   * 검색 제안 표시
   */
  showSearchSuggestions() {
    // 향후 구현: 인기 검색어나 자동완성 제안
  }

  /**
   * 검색 제안 숨기기
   */
  hideSearchSuggestions() {
    // 향후 구현: 제안 목록 숨기기
  }

  /**
   * HTML 이스케이프
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 날짜 포맷팅
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }
}

// DOM이 로드되면 검색 매니저 초기화
document.addEventListener('DOMContentLoaded', () => {
  new SearchManager();
});

// 전역에서 접근 가능하도록 export
window.SearchManager = SearchManager;
