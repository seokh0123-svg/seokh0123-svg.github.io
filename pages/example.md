---
title: 'GitHub Pages 정적 블로그 구축하기'
date: 2025-01-26
tags: ['JavaScript', 'Web', 'GitHub', 'Blog']
category: 'Development'
description: 'GitHub Pages를 활용하여 마크다운 기반의 정적 블로그를 구축하는 방법을 알아봅니다.'
---

# GitHub Pages 정적 블로그 구축하기

안녕하세요! 이번 포스트에서는 GitHub Pages를 활용하여 마크다운 기반의 정적 블로그를 구축하는 방법에 대해 알아보겠습니다.

## 🎯 왜 정적 블로그인가?

정적 블로그의 장점은 다음과 같습니다:

- **빠른 로딩 속도**: 서버 사이드 렌더링이 없어 매우 빠릅니다
- **비용 효율적**: GitHub Pages는 무료로 제공됩니다
- **보안**: 서버가 없어 해킹 위험이 적습니다
- **버전 관리**: Git을 통한 완벽한 버전 관리가 가능합니다

## 🛠️ 사용된 기술 스택

이 블로그는 다음과 같은 기술들을 사용합니다:

- **HTML5 & CSS3**: 기본 웹 표준
- **Vanilla JavaScript**: 프레임워크 없이 순수 JavaScript
- **Marked.js**: 마크다운을 HTML로 변환
- **Prism.js**: 코드 하이라이팅
- **Giscus**: GitHub Discussions 기반 댓글 시스템

## 📁 프로젝트 구조

```
/
├── .nojekyll              # Jekyll 비활성화
├── index.html             # 메인 페이지
├── post.html              # 게시글 상세 페이지
├── css/
│   ├── style.css          # 메인 스타일
│   └── prism.css          # 코드 하이라이팅
├── js/
│   ├── app.js             # 메인 애플리케이션
│   ├── post-loader.js     # 게시글 로더
│   ├── search.js          # 검색 기능
│   └── theme.js           # 다크/라이트 모드
├── pages/                 # 마크다운 게시글
└── .github/
    └── workflows/
        └── deploy.yml     # 자동 배포
```

## 🚀 주요 기능

### 1. 다크/라이트 모드

사용자의 시스템 설정을 자동으로 감지하고, 수동으로도 테마를 변경할 수 있습니다.

```javascript
// 테마 토글 예시
const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('blog-theme', newTheme);
};
```

### 2. 실시간 검색

제목, 내용, 태그, 카테고리를 대상으로 실시간 검색이 가능합니다.

### 3. 태그 및 카테고리 필터링

게시글을 태그나 카테고리별로 필터링할 수 있습니다.

### 4. 반응형 디자인

모바일, 태블릿, 데스크톱 모든 환경에서 최적화된 사용자 경험을 제공합니다.

## 📝 마크다운 작성법

게시글은 다음과 같은 형식으로 작성합니다:

```markdown
---
title: '게시글 제목'
date: 2025-01-26
tags: ['태그1', '태그2']
category: '카테고리'
description: '게시글 설명'
---

# 제목

내용...
```

## 🔧 배포 과정

1. **게시글 작성**: `pages/` 폴더에 마크다운 파일 작성
2. **Git 커밋**: 변경사항을 Git에 커밋
3. **GitHub 푸시**: `main` 브랜치에 푸시
4. **자동 배포**: GitHub Actions가 자동으로 배포 실행

## 💡 팁과 주의사항

### .nojekyll 파일 필수

GitHub Pages는 기본적으로 Jekyll을 사용하므로, 정적 파일로 서빙하려면 루트에 `.nojekyll` 파일을 생성해야 합니다.

```bash
touch .nojekyll
```

### Giscus 댓글 설정

댓글 시스템을 사용하려면 GitHub Discussions를 활성화하고 Giscus 앱을 설치해야 합니다.

## 🎉 마무리

이제 여러분만의 정적 블로그를 구축할 수 있습니다! 

- 빠른 로딩 속도
- 무료 호스팅
- 완벽한 버전 관리
- 커스터마이징 가능

이 모든 장점을 가진 블로그를 만들어보세요!

---

**참고 자료:**
- [GitHub Pages 공식 문서](https://pages.github.com/)
- [Marked.js 문서](https://marked.js.org/)
- [Prism.js 문서](https://prismjs.com/)
- [Giscus 문서](https://giscus.app/)
