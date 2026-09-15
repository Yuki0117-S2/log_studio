// 전역 상태
let pages = [];
let tags = [];
let replacements = []; // 단어 치환 목록
let customThemes = [];
let profiles = []; // 프로필 목록 (최대 6개)
let currentEditingIndex = null;
let tempPageTags = [];
let globalTheme = 'basic'; // 전역 테마 설정
let hidePageNumbers = false; // 페이지 헤더 번호 숨김 여부
let enablePageFold = true; // 페이지 접기 활성화 여부 (기본값: 켜짐)
let showHeaderWhenFoldOff = false; // 접기 OFF일 때도 헤더 표시 여부
let dividerStyle = 'line'; // 구분선 디자인
let dividerCustomText = ''; // 직접 입력 구분선

// 텍스트 간격 설정
let textSpacing = {
    fontSize: 14.2,
    lineHeight: 1.7,
    letterSpacing: -0.5,
    paragraphSpacing: 10,
    textIndent: 0
};

// 제목/헤더 폰트 크기 설정
let headingFontSizes = {
    coverArchiveNo: 11,   // 표지 아카이브 번호
    coverTitle: 42,       // 표지 메인 제목
    coverSubtitle: 14,    // 표지 부제
    coverTag: 11,         // 표지 태그
    sectionTitle: 20,     // 섹션 제목 (배경 없음)
    sectionSubtitle: 11,  // 섹션 부제
    pageHeaderNum: 40,    // 페이지 헤더 번호
    pageHeaderTitle: 15,  // 페이지 헤더 제목/부제
};

// 폰트 설정
let fontFamily = 'Pretendard';

// 폰트 크기를 clamp() 단위로 변환 (모바일 대응)
// maxPx: 사용자가 설정한 최대 크기(px), minRatio: min/max 비율(기본 0.6)
// 컨테이너 기준 900px 기준으로 vw 계산
function pxToClamp(maxPx, minRatio) {
    minRatio = minRatio || 0.75;
    const min = Math.round(maxPx * minRatio);
    const vw = (maxPx / 900 * 100).toFixed(2);
    return 'clamp(' + min + 'px, ' + vw + 'vw, ' + maxPx + 'px)';
}

// 폰트에 맞는 fallback 반환
function getFontFallback(font) {
    const sansSerifFonts = ['Pretendard', 'Noto Sans KR', 'Nanum Gothic', 'Gothic A1', 'Gowun Dodum', 'IBM Plex Sans KR'];
    return sansSerifFonts.includes(font) ? 'sans-serif' : 'serif';
}

// 이미지 URL 정규화 (프로토콜 상대 URL을 https로 변환)
function normalizeImageUrl(url) {
    if (!url) return '';
    
    // //로 시작하는 URL을 https://로 변환
    if (url.startsWith('//')) {
        url = 'https:' + url;
    }
    
    // 나무위키나 특정 사이트의 이미지인 경우
    // 직접 URL 반환 (프록시 없이) - onerror에서 폴백 처리
    // CORS 문제가 있어도 일단 시도하고, 실패하면 폴백
    return url;
}

// LocalStorage 키
const STORAGE_KEY = 'rpLogEditorData';
const PRESET_STORAGE_KEY = 'rpLogEditorPresets';

// 스타일 상수
const STYLES = {
    light: {
        bg: '#ececed',
        text: '#555555',
        em: '#666666',
        header: '#333333',
        headerText: '#333333',
        line: '#333333',
        quote1Bg: '#e0e0e0',
        quote1Text: '#444444',
        quote2Bg: '#dcdcdc',
        quote2Text: '#222222',
        tagText: '#808080',
        divider: '#d0d0d0'
    },
    dark: {
        bg: '#252525',
        text: '#aaaaaa',
        em: '#999999',
        header: '#f3f3f3',
        headerText: '#f3f3f3',
        line: '#f3f3f3',
        quote1Bg: '#333333',
        quote1Text: '#cccccc',
        quote2Bg: '#3a3a3a',
        quote2Text: '#ffffff',
        tagText: '#999999',
        divider: '#4a4a4a'
    },
    oldMoneyLight: {
        bg: '#efe9da',
        text: '#574d34',
        em: '#923838',
        header: '#56412b',
        headerText: '#56412b',
        line: '#56412b',
        quote1Bg: '#f7f3e8',
        quote1Text: '#184f66',
        quote2Bg: '#f7f3e8',
        quote2Text: '#634121',
        tagText: '#8b7355',
        divider: '#d4c9b0'
    },
    oldMoneyDark: {
        bg: '#141e23',
        text: '#a08e6c',
        em: '#aa7b5c',
        header: '#bf9f6f',
        headerText: '#bf9f6f',
        line: '#bf9f6f',
        quote1Bg: '#192228',
        quote1Text: '#3092ab',
        quote2Bg: '#192228',
        quote2Text: '#d0a053',
        tagText: '#a89070',
        divider: '#2a3540'
    },
    basic: {
        bg: '#ffffff',
        text: '#2c3e50',
        em: '#2d5af0',
        header: '#162a3e',
        headerText: '#162a3e',
        line: '#162a3e',
        quote1Bg: '#f0f2f5',
        quote1Text: '#2c3e50',
        quote2Bg: '#f0f2f5',
        quote2Text: '#162a3e',
        tagText: '#6c8da8',
        divider: '#c8d6e0'
    },
    // 로즈 테마 (배경 #FEFBFD) - 부드러운 핑크 톤
    rose: {
        bg: '#fefbfd',
        text: '#5c4a5a',
        em: '#c77d8e',
        header: '#8b5a6a',
        headerText: '#8b5a6a',
        line: '#8b5a6a',
        quote1Bg: '#faf5f7',
        quote1Text: '#6b4a5a',
        quote2Bg: '#f8f0f3',
        quote2Text: '#7d5a6a',
        tagText: '#b08090',
        divider: '#e8d5db'
    },
    // 오션 테마 - 차분한 블루 톤
    ocean: {
        bg: '#f5f9fc',
        text: '#3d5a6f',
        em: '#2980b9',
        header: '#1a4a66',
        headerText: '#1a4a66',
        line: '#1a4a66',
        quote1Bg: '#e8f4fa',
        quote1Text: '#2c5d7a',
        quote2Bg: '#dceef7',
        quote2Text: '#1e5a78',
        tagText: '#5a8aa8',
        divider: '#c8dce8'
    },
    // 포레스트 테마 - 자연스러운 그린 톤
    forest: {
        bg: '#f7faf5',
        text: '#3d4f3a',
        em: '#5a8a50',
        header: '#2d5a28',
        headerText: '#2d5a28',
        line: '#2d5a28',
        quote1Bg: '#eef5ec',
        quote1Text: '#3d5a38',
        quote2Bg: '#e5f0e3',
        quote2Text: '#2a5025',
        tagText: '#6a9a60',
        divider: '#d0e0cc'
    },
    // 라벤더 테마 - 은은한 퍼플 톤
    lavender: {
        bg: '#faf8fc',
        text: '#4a4560',
        em: '#7b68a8',
        header: '#5a4a7a',
        headerText: '#5a4a7a',
        line: '#5a4a7a',
        quote1Bg: '#f3f0f8',
        quote1Text: '#5a5070',
        quote2Bg: '#ece8f5',
        quote2Text: '#4a4068',
        tagText: '#8a7aaa',
        divider: '#dcd5e8'
    },
    // 따뜻한 톤 테마 - 웜 베이지 톤
    warm: {
        bg: '#fdfbf8',
        text: '#5a4a3d',
        em: '#c08860',
        header: '#6a5040',
        headerText: '#6a5040',
        line: '#6a5040',
        quote1Bg: '#f8f4f0',
        quote1Text: '#5a4a40',
        quote2Bg: '#f5efe8',
        quote2Text: '#6a5545',
        tagText: '#a08a70',
        divider: '#e0d5c8'
    },
    // 세이지 테마 - 차분한 올리브그린 톤
    sage: {
        bg: '#f8faf7',
        text: '#4a5547',
        em: '#6b8e65',
        header: '#3a4f35',
        headerText: '#3a4f35',
        line: '#3a4f35',
        quote1Bg: '#f0f4ee',
        quote1Text: '#4a5a45',
        quote2Bg: '#e8f0e5',
        quote2Text: '#3a4f38',
        tagText: '#7a9a70',
        divider: '#d5e0d0'
    },
    // 코랄 테마 - 생동감 있는 코랄 톤
    coral: {
        bg: '#fefaf9',
        text: '#5a4845',
        em: '#e07a5f',
        header: '#8a5545',
        headerText: '#8a5545',
        line: '#8a5545',
        quote1Bg: '#faf3f1',
        quote1Text: '#6a5048',
        quote2Bg: '#f7ebe8',
        quote2Text: '#7a5848',
        tagText: '#c08a75',
        divider: '#e8d5d0'
    },
    // 민트 테마 - 상쾌한 민트그린 톤
    mint: {
        bg: '#f7fcfa',
        text: '#3d5a54',
        em: '#4a9d88',
        header: '#2a5048',
        headerText: '#2a5048',
        line: '#2a5048',
        quote1Bg: '#eef7f4',
        quote1Text: '#3d5a50',
        quote2Bg: '#e5f3ee',
        quote2Text: '#2d5545',
        tagText: '#6aaa95',
        divider: '#d0e8dd'
    },
    // 머스타드 테마 - 따뜻한 머스타드 옐로우 톤
    mustard: {
        bg: '#fdfbf5',
        text: '#5a5540',
        em: '#d4a841',
        header: '#6a5a35',
        headerText: '#6a5a35',
        line: '#6a5a35',
        quote1Bg: '#f9f6ec',
        quote1Text: '#5a5545',
        quote2Bg: '#f5f0e0',
        quote2Text: '#6a5a40',
        tagText: '#b09860',
        divider: '#e5ddc8'
    },
    // 플럼 테마 - 깊은 자두색 톤
    plum: {
        bg: '#faf8fb',
        text: '#523f52',
        em: '#9d5f8f',
        header: '#6a4a65',
        headerText: '#6a4a65',
        line: '#6a4a65',
        quote1Bg: '#f5f0f6',
        quote1Text: '#5a4555',
        quote2Bg: '#f0e8f2',
        quote2Text: '#6a4a60',
        tagText: '#aa7a9a',
        divider: '#e0d0dc'
    },
    // 스카이 테마 - 밝은 하늘색 톤
    sky: {
        bg: '#f8fbfd',
        text: '#3d5565',
        em: '#5a9ace',
        header: '#2a4a5a',
        headerText: '#2a4a5a',
        line: '#2a4a5a',
        quote1Bg: '#f0f6fa',
        quote1Text: '#3d5560',
        quote2Bg: '#e8f2f8',
        quote2Text: '#2d4f5a',
        tagText: '#7aabce',
        divider: '#d5e5ed'
    },
    // 테라코타 테마 - 따뜻한 적토색 톤
    terracotta: {
        bg: '#fdfaf8',
        text: '#5a4840',
        em: '#c87055',
        header: '#7a5045',
        headerText: '#7a5045',
        line: '#7a5045',
        quote1Bg: '#f9f3f0',
        quote1Text: '#5a4a42',
        quote2Bg: '#f5ebe5',
        quote2Text: '#6a5040',
        tagText: '#b08570',
        divider: '#e5d5cc'
    },
    // 티크 테마 - 고급스러운 청록색 톤
    teal: {
        bg: '#f7fafb',
        text: '#3d5558',
        em: '#4a8a88',
        header: '#2a5053',
        headerText: '#2a5053',
        line: '#2a5053',
        quote1Bg: '#eff6f7',
        quote1Text: '#3d5555',
        quote2Bg: '#e7f2f3',
        quote2Text: '#2d5250',
        tagText: '#6a9d9a',
        divider: '#d5e5e5'
    },
    // 피치 테마 - 부드러운 복숭아색 톤
    peach: {
        bg: '#fefbf9',
        text: '#5a4d45',
        em: '#e8a087',
        header: '#8a5f4a',
        headerText: '#8a5f4a',
        line: '#8a5f4a',
        quote1Bg: '#faf5f2',
        quote1Text: '#5a4f48',
        quote2Bg: '#f7efe9',
        quote2Text: '#6a5545',
        tagText: '#c09080',
        divider: '#e8ddd5'
    },
    // 슬레이트 테마 - 세련된 청회색 톤
    slate: {
        bg: '#f8f9fa',
        text: '#475259',
        em: '#5a7a88',
        header: '#354550',
        headerText: '#354550',
        line: '#354550',
        quote1Bg: '#f2f4f5',
        quote1Text: '#475560',
        quote2Bg: '#eceff1',
        quote2Text: '#3a4f58',
        tagText: '#708a95',
        divider: '#d8dfe3'
    },
    // 에스프레소 테마 - 깊은 브라운 톤
    espresso: {
        bg: '#faf8f6',
        text: '#4a3d35',
        em: '#8b6f47',
        header: '#3a2920',
        headerText: '#3a2920',
        line: '#3a2920',
        quote1Bg: '#f5f2ee',
        quote1Text: '#503f35',
        quote2Bg: '#efe8e0',
        quote2Text: '#5a4535',
        tagText: '#9a7f60',
        divider: '#ddd0c0'
    },
    // 버건디 테마 - 우아한 와인 톤
    burgundy: {
        bg: '#fefbfc',
        text: '#5a3d45',
        em: '#a84860',
        header: '#6a2d3f',
        headerText: '#6a2d3f',
        line: '#6a2d3f',
        quote1Bg: '#faf5f7',
        quote1Text: '#604048',
        quote2Bg: '#f5eaed',
        quote2Text: '#7a3d4a',
        tagText: '#b86878',
        divider: '#e8d0d8'
    },
    // 인디고 테마 - 차분한 남색 톤
    indigo: {
        bg: '#f8f9fc',
        text: '#3d4560',
        em: '#5a68a8',
        header: '#2d355a',
        headerText: '#2d355a',
        line: '#2d355a',
        quote1Bg: '#f0f2f8',
        quote1Text: '#404a65',
        quote2Bg: '#e8ebf5',
        quote2Text: '#354060',
        tagText: '#6a78b8',
        divider: '#d0d8e8'
    },
    // 올리브 테마 - 고급스러운 카키 톤
    olive: {
        bg: '#fafaf5',
        text: '#4a4d3d',
        em: '#7a8050',
        header: '#3a4030',
        headerText: '#3a4030',
        line: '#3a4030',
        quote1Bg: '#f5f5ee',
        quote1Text: '#4f5240',
        quote2Bg: '#eff0e5',
        quote2Text: '#45483a',
        tagText: '#8a9060',
        divider: '#dde0d0'
    },
    // 애쉬 테마 - 세련된 재 회색 톤
    ash: {
        bg: '#fafafa',
        text: '#4a4a4a',
        em: '#707070',
        header: '#2a2a2a',
        headerText: '#2a2a2a',
        line: '#2a2a2a',
        quote1Bg: '#f2f2f2',
        quote1Text: '#505050',
        quote2Bg: '#ebebeb',
        quote2Text: '#3a3a3a',
        tagText: '#8a8a8a',
        divider: '#d5d5d5'
    },
    // 아쿠아 테마 - 맑은 청록 톤
    aqua: {
        bg: '#f7fbfc',
        text: '#3d5558',
        em: '#4a9a9a',
        header: '#2a4a4d',
        headerText: '#2a4a4d',
        line: '#2a4a4d',
        quote1Bg: '#eff6f7',
        quote1Text: '#405a5a',
        quote2Bg: '#e7f2f3',
        quote2Text: '#355050',
        tagText: '#6aaaaa',
        divider: '#d0e5e7'
    },
    // 초콜릿 테마 - 진한 초콜릿 브라운 톤
    chocolate: {
        bg: '#fcfaf8',
        text: '#4d3a2a',
        em: '#9a6040',
        header: '#3d2515',
        headerText: '#3d2515',
        line: '#3d2515',
        quote1Bg: '#f7f4f0',
        quote1Text: '#5a402a',
        quote2Bg: '#f2ebe3',
        quote2Text: '#6a4530',
        tagText: '#aa7550',
        divider: '#e0d0c0'
    },
    // 클래렛 테마 - 깊은 적갈색 톤
    claret: {
        bg: '#fdfafa',
        text: '#5a3a3a',
        em: '#b85050',
        header: '#6a2525',
        headerText: '#6a2525',
        line: '#6a2525',
        quote1Bg: '#faf3f3',
        quote1Text: '#603f3f',
        quote2Bg: '#f5e8e8',
        quote2Text: '#7a3535',
        tagText: '#c86868',
        divider: '#e8d0d0'
    },
    // 차콜 테마 - 차분한 목탄 톤
    charcoal: {
        bg: '#f9f9f9',
        text: '#454545',
        em: '#656565',
        header: '#252525',
        headerText: '#252525',
        line: '#252525',
        quote1Bg: '#f1f1f1',
        quote1Text: '#4a4a4a',
        quote2Bg: '#e9e9e9',
        quote2Text: '#353535',
        tagText: '#858585',
        divider: '#d3d3d3'
    },
    // 그레이프 테마 - 은은한 포도 톤
    grape: {
        bg: '#fbf9fc',
        text: '#4a3f52',
        em: '#8a68a0',
        header: '#5a3a68',
        headerText: '#5a3a68',
        line: '#5a3a68',
        quote1Bg: '#f5f0f8',
        quote1Text: '#554560',
        quote2Bg: '#efe8f5',
        quote2Text: '#604a70',
        tagText: '#9a78b0',
        divider: '#dcd0e8'
    }
};

// 기본 태그 (4개) - 영문명으로 변경
const DEFAULT_TAGS = [
    { name: 'Bot', value: 'Bot', link: '' },
    { name: 'Model', value: 'Model', link: '' },
    { name: 'Prompt', value: 'Prompt', link: '' },
    { name: 'Language', value: 'Eng', link: '' }
];

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    try {
        loadFromStorage();
        setupEventListeners();
        setupTabs(); // 탭 설정 추가
        initializePresets(); // 프리셋 초기화 추가
        
        // coverAutoFit 초기 상태 설정 (저장된 데이터가 없을 경우 기본값 true)
        const coverAutoFit = document.getElementById('coverAutoFit');
        const coverManualControls = document.getElementById('coverManualControls');
        if (coverAutoFit && coverManualControls) {
            // localStorage에 저장된 값이 없으면 기본값(checked=true) 유지
            coverManualControls.style.display = coverAutoFit.checked ? 'none' : 'block';
        }
        
        updatePreview();
    } catch (error) {
        console.error('초기화 중 오류 발생:', error);
    }
}

// 탭 네비게이션 설정 함수
function setupTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', function () {
            const targetId = this.getAttribute('data-tab');

            // 1. 모든 탭 버튼 활성화 해제
            navItems.forEach(nav => nav.classList.remove('active'));

            // 2. 클릭한 탭 버튼 활성화
            this.classList.add('active');

            // 3. 모든 컨텐츠 숨김
            tabContents.forEach(content => content.classList.remove('active'));

            // 4. 타겟 컨텐츠 표시
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }

            // 5. 모바일에서 프리뷰가 열려있으면 닫기
            const previewPanel = document.querySelector('.preview-panel');
            if (previewPanel && previewPanel.classList.contains('mobile-visible')) {
                previewPanel.classList.remove('mobile-visible');
                const eyeIcon = document.getElementById('icon-preview-eye');
                const editIcon = document.getElementById('icon-preview-edit');
                if (eyeIcon && editIcon) {
                    eyeIcon.style.display = 'block';
                    editIcon.style.display = 'none';
                }
                const toggleBtn = document.getElementById('togglePreview');
                if (toggleBtn) {
                    toggleBtn.title = '미리보기 보기';
                }
            }
        });
    });
}

// LocalStorage 로드
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);

            // null 체크를 추가한 안전한 요소 설정
            const useRoundedQuotes = document.getElementById('useRoundedQuotes');
            const useTextIndent = document.getElementById('useTextIndent');
            const enableTopSection = document.getElementById('enableTopSection');
            const enableCover = document.getElementById('enableCover');
            const coverImage = document.getElementById('coverImage');
            const coverZoom = document.getElementById('coverZoom');
            const coverFocusX = document.getElementById('coverFocusX');
            const coverFocusY = document.getElementById('coverFocusY');
            const coverAutoFit = document.getElementById('coverAutoFit');
            const coverArchiveNo = document.getElementById('coverArchiveNo');
            const coverTitle = document.getElementById('coverTitle');
            const coverSubtitle = document.getElementById('coverSubtitle');
            const coverContent = document.getElementById('coverContent');

            if (useRoundedQuotes) useRoundedQuotes.checked = data.useRoundedQuotes || false;
            if (useTextIndent) useTextIndent.checked = data.useTextIndent || false;
            const preserveLineBreaks = document.getElementById('preserveLineBreaks');
            if (preserveLineBreaks) preserveLineBreaks.checked = data.preserveLineBreaks || false;
            if (enableTopSection) enableTopSection.checked = data.enableTopSection || false;

            // 표지 관련 설정 로드
            if (enableCover) enableCover.checked = data.enableCover || false;
            if (coverImage) coverImage.value = data.coverImage || '';
            if (coverAutoFit) coverAutoFit.checked = data.coverAutoFit || false;
            if (coverZoom) coverZoom.value = data.coverZoom || 120;
            if (coverFocusX) coverFocusX.value = data.coverFocusX || 50;
            if (coverFocusY) coverFocusY.value = data.coverFocusY || 28;
            if (coverArchiveNo) coverArchiveNo.value = data.coverArchiveNo || 'ARCHIVE NO.001';
            if (coverTitle) coverTitle.value = data.coverTitle || '';
            if (coverSubtitle) coverSubtitle.value = data.coverSubtitle || '';
            if (coverContent) coverContent.style.display = data.enableCover ? 'block' : 'none';

            // 자동 크기 조절 상태에 따라 수동 컨트롤 표시/숨김
            const coverManualControls = document.getElementById('coverManualControls');
            if (coverManualControls) {
                coverManualControls.style.display = (data.coverAutoFit) ? 'none' : 'block';
            }

            // Focus 값 표시 업데이트
            const coverZoomValue = document.getElementById('coverZoomValue');
            const coverFocusXValue = document.getElementById('coverFocusXValue');
            const coverFocusYValue = document.getElementById('coverFocusYValue');
            const topSectionContent = document.getElementById('topSectionContent');
            const enableProfilesEl = document.getElementById('enableProfiles');
            const introText = document.getElementById('introText');
            const summaryText = document.getElementById('summaryText');
            const soundtrackUrl = document.getElementById('soundtrackUrl');
            const soundtrackTitle = document.getElementById('soundtrackTitle');
            const soundtrackArtist = document.getElementById('soundtrackArtist');
            const enableCommentEl = document.getElementById('enableComment');
            const commentText = document.getElementById('commentText');
            const commentNickname = document.getElementById('commentNickname');
            const commentContent = document.getElementById('commentContent');
            const enableTagsEl = document.getElementById('enableTags');

            if (coverZoomValue) coverZoomValue.textContent = (data.coverZoom || 120) + '%';
            if (coverFocusXValue) coverFocusXValue.textContent = (data.coverFocusX || 50) + '%';
            if (coverFocusYValue) coverFocusYValue.textContent = (data.coverFocusY || 28) + '%';

            if (topSectionContent) topSectionContent.style.display = data.enableTopSection ? 'block' : 'none';

            if (enableProfilesEl) enableProfilesEl.checked = data.enableProfiles || false;
            if (introText) introText.value = data.introText || '';
            if (summaryText) summaryText.value = data.summaryText || '';
            if (soundtrackUrl) soundtrackUrl.value = data.soundtrackUrl || '';
            if (soundtrackTitle) soundtrackTitle.value = data.soundtrackTitle || '';
            if (soundtrackArtist) soundtrackArtist.value = data.soundtrackArtist || '';
            if (enableCommentEl) enableCommentEl.checked = data.enableComment || false;
            if (commentText) commentText.value = data.commentText || '';
            if (commentNickname) commentNickname.value = data.commentNickname || '';
            if (commentContent) commentContent.style.display = data.enableComment ? 'block' : 'none';
            if (enableTagsEl) enableTagsEl.checked = data.enableTags !== undefined ? data.enableTags : true;

            if (data.customColors) {
                setColorInputValue('customBg', data.customColors.bg);
                setColorInputValue('customText', data.customColors.text);
                setColorInputValue('customEm', data.customColors.em);
                // 하위 호환성: line과 headerText가 있으면 header로 통합
                setColorInputValue('customHeader', data.customColors.header || data.customColors.line || data.customColors.headerText);
                setColorInputValue('customQuote1Bg', data.customColors.quote1Bg);
                setColorInputValue('customQuote1Text', data.customColors.quote1Text);
                setColorInputValue('customQuote2Bg', data.customColors.quote2Bg);
                setColorInputValue('customQuote2Text', data.customColors.quote2Text);
                setColorInputValue('customTagText', data.customColors.tagText || data.customColors.text);
                setColorInputValue('customDivider', data.customColors.divider || data.customColors.tagText || data.customColors.text);
            }

            pages = data.pages || [];

            // 기존 데이터 마이그레이션: itemType이 없는 항목은 'page'로 설정
            pages = pages.map(function (item) {
                if (!item.itemType) {
                    item.itemType = 'page';
                }
                // imageWidth가 없는 페이지는 기본값 100으로 설정
                if (item.itemType === 'page' && (item.imageWidth === undefined || item.imageWidth === null)) {
                    item.imageWidth = 100;
                }
                return item;
            });

            if (data.tags && data.tags.length > 0) {
                tags = JSON.parse(JSON.stringify(data.tags));
            } else {
                tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
            }

            while (tags.length < 3) {
                tags.push(JSON.parse(JSON.stringify(DEFAULT_TAGS[tags.length])));
            }

            replacements = data.replacements || [];
            customThemes = data.customThemes || [];

            // 텍스트 간격 설정 로드 (요소가 있을 때만)
            if (data.textSpacing) {
                textSpacing = { ...textSpacing, ...data.textSpacing };
                const textSizeInput = document.getElementById('textSizeInput');
                const textSizeSlider = document.getElementById('textSizeSlider');
                const lineHeightInput = document.getElementById('lineHeightInput');
                const lineHeightSlider = document.getElementById('lineHeightSlider');
                const letterSpacingInput = document.getElementById('letterSpacingInput');
                const letterSpacingSlider = document.getElementById('letterSpacingSlider');
                const paragraphSpacingInput = document.getElementById('paragraphSpacingInput');
                const paragraphSpacingSlider = document.getElementById('paragraphSpacingSlider');
                const textIndentInput = document.getElementById('textIndentInput');
                const textIndentSlider = document.getElementById('textIndentSlider');

                if (textSizeInput) textSizeInput.value = textSpacing.fontSize;
                if (textSizeSlider) textSizeSlider.value = textSpacing.fontSize;
                if (lineHeightInput) lineHeightInput.value = textSpacing.lineHeight;
                if (lineHeightSlider) lineHeightSlider.value = textSpacing.lineHeight;
                if (letterSpacingInput) letterSpacingInput.value = textSpacing.letterSpacing;
                if (letterSpacingSlider) letterSpacingSlider.value = textSpacing.letterSpacing;
                if (paragraphSpacingInput) paragraphSpacingInput.value = textSpacing.paragraphSpacing;
                if (paragraphSpacingSlider) paragraphSpacingSlider.value = textSpacing.paragraphSpacing;
                if (textIndentInput) textIndentInput.value = textSpacing.textIndent;
                if (textIndentSlider) textIndentSlider.value = textSpacing.textIndent;
                // display 업데이트
                const _sd = document.getElementById('textSizeDisplay'); if (_sd) _sd.textContent = textSpacing.fontSize.toFixed(1) + 'px';
                const _lhd = document.getElementById('lineHeightDisplay'); if (_lhd) _lhd.textContent = textSpacing.lineHeight.toFixed(2);
                const _lsd = document.getElementById('letterSpacingDisplay'); if (_lsd) _lsd.textContent = textSpacing.letterSpacing.toFixed(1) + 'px';
                const _psd = document.getElementById('paragraphSpacingDisplay'); if (_psd) _psd.textContent = textSpacing.paragraphSpacing + 'px';
                const _tid = document.getElementById('textIndentDisplay'); if (_tid) _tid.textContent = textSpacing.textIndent + 'px';
            } else {
                // 기본값 설정 (요소가 있을 때만)
                const textSizeInput = document.getElementById('textSizeInput');
                const textSizeSlider = document.getElementById('textSizeSlider');
                const lineHeightInput = document.getElementById('lineHeightInput');
                const lineHeightSlider = document.getElementById('lineHeightSlider');
                const letterSpacingInput = document.getElementById('letterSpacingInput');
                const letterSpacingSlider = document.getElementById('letterSpacingSlider');
                const paragraphSpacingInput = document.getElementById('paragraphSpacingInput');
                const paragraphSpacingSlider = document.getElementById('paragraphSpacingSlider');
                const textIndentInput = document.getElementById('textIndentInput');
                const textIndentSlider = document.getElementById('textIndentSlider');

                if (textSizeInput) textSizeInput.value = 14.2;
                if (textSizeSlider) textSizeSlider.value = 14.2;
                if (lineHeightInput) lineHeightInput.value = 1.7;
                if (lineHeightSlider) lineHeightSlider.value = 1.7;
                if (letterSpacingInput) letterSpacingInput.value = -0.5;
                if (letterSpacingSlider) letterSpacingSlider.value = -0.5;
                if (paragraphSpacingInput) paragraphSpacingInput.value = 10;
                if (paragraphSpacingSlider) paragraphSpacingSlider.value = 10;
                if (textIndentInput) textIndentInput.value = 0;
                if (textIndentSlider) textIndentSlider.value = 0;
            }

            // 폰트 설정 로드
            if (data.fontFamily) {
                fontFamily = data.fontFamily;
                const fontFamilyEl = document.getElementById('fontFamily');
                if (fontFamilyEl) fontFamilyEl.value = fontFamily;
            }

            // 제목 크기 설정 로드
            if (data.headingFontSizes) {
                headingFontSizes = { ...headingFontSizes, ...data.headingFontSizes };
                // UI는 setupHeadingControl에서 초기화되므로 여기서는 값만 동기화
                Object.keys(headingFontSizes).forEach(k => {
                    const map = {
                        coverTitle:      { slider: 'coverTitleSizeSlider',      input: 'coverTitleSizeInput',      display: 'coverTitleSizeDisplay' },
                        coverSubtitle:   { slider: 'coverSubtitleSizeSlider',   input: 'coverSubtitleSizeInput',   display: 'coverSubtitleSizeDisplay' },
                        sectionTitle:    { slider: 'sectionTitleSizeSlider',    input: 'sectionTitleSizeInput',    display: 'sectionTitleSizeDisplay' },
                        sectionSubtitle: { slider: 'sectionSubtitleSizeSlider', input: 'sectionSubtitleSizeInput', display: 'sectionSubtitleSizeDisplay' },
                        pageHeaderNum:   { slider: 'pageHeaderNumSizeSlider',   input: 'pageHeaderNumSizeInput',   display: 'pageHeaderNumSizeDisplay' },
                        pageHeaderTitle: { slider: 'pageHeaderTitleSizeSlider', input: 'pageHeaderTitleSizeInput', display: 'pageHeaderTitleSizeDisplay' },
                    };
                    if (!map[k]) return;
                    const sl = document.getElementById(map[k].slider);
                    const inp = document.getElementById(map[k].input);
                    const dsp = document.getElementById(map[k].display);
                    if (sl) sl.value = headingFontSizes[k];
                    if (inp) inp.value = headingFontSizes[k];
                    if (dsp) dsp.textContent = headingFontSizes[k] + 'px';
                });
            }

            // 전역 테마 설정 로드
            if (data.globalTheme) {
                globalTheme = data.globalTheme;
                const globalThemeEl = document.getElementById('globalTheme');
                if (globalThemeEl) globalThemeEl.value = globalTheme;
            }

            // 페이지 번호 숨김 설정 로드
            if (data.hidePageNumbers !== undefined) {
                hidePageNumbers = data.hidePageNumbers;
                const hidePageNumbersEl = document.getElementById('hidePageNumbers');
                if (hidePageNumbersEl) hidePageNumbersEl.checked = hidePageNumbers;
            }

            // 페이지 접기 설정 로드
            if (data.enablePageFold !== undefined) {
                enablePageFold = data.enablePageFold;
            } else {
                enablePageFold = true; // 기본값: 켜짐
            }
            const enablePageFoldEl = document.getElementById('enablePageFold');
            if (enablePageFoldEl) enablePageFoldEl.checked = enablePageFold;

            showHeaderWhenFoldOff = data.showHeaderWhenFoldOff || false;
            const shEl = document.getElementById('showHeaderWhenFoldOff');
            if (shEl) shEl.checked = showHeaderWhenFoldOff;

            dividerStyle = data.dividerStyle || 'line';
            dividerCustomText = data.dividerCustomText || '';
            const dsEl = document.getElementById('dividerStyle');
            const dcEl = document.getElementById('dividerCustomText');
            if (dsEl) { dsEl.value = dividerStyle; }
            if (dcEl) { dcEl.value = dividerCustomText; dcEl.style.display = dividerStyle === 'custom' ? 'block' : 'none'; }

            if (data.profiles && data.profiles.length > 0) {
                profiles = JSON.parse(JSON.stringify(data.profiles));
            } else {
                if (data.userName || data.charName) {
                    profiles = [
                        {
                            name: data.userName || 'User',
                            imageUrl: data.userImageUrl || '',
                            focusX: data.userFocusX !== undefined ? data.userFocusX : 50,
                            focusY: data.userFocusY !== undefined ? data.userFocusY : 30,
                            desc: data.userDesc || '',
                            tag: data.userProfileTag || ''
                        },
                        {
                            name: data.charName || 'Char',
                            imageUrl: data.charImageUrl || '',
                            focusX: data.charFocusX !== undefined ? data.charFocusX : 50,
                            focusY: data.charFocusY !== undefined ? data.charFocusY : 30,
                            desc: data.charDesc || '',
                            tag: data.charProfileTag || ''
                        }
                    ];
                } else {
                    profiles = [];
                }
            }

            const enableProfiles = document.getElementById('enableProfiles');
            const profileInputs = document.getElementById('profileInputs');
            const enableTags = document.getElementById('enableTags');
            const tagsInputs = document.getElementById('tagsInputs');

            if (profiles.length > 0 && enableProfiles && !enableProfiles.checked) {
                enableProfiles.checked = true;
            }

            if (profileInputs && enableProfiles) {
                profileInputs.style.display = enableProfiles.checked ? 'block' : 'none';
            }
            if (tagsInputs && enableTags) {
                tagsInputs.style.display = enableTags.checked ? 'block' : 'none';
            }

            updateTagsList();
            updateReplacementsList();
            updatePagesList();
            updateCustomThemesList();
            updateProfilesList();
        } else {
            // 저장된 데이터가 없을 때: 초기값 설정
            loadDefaultSettings();
        }
    } catch (e) {
        console.error('Failed to load from storage:', e);
        loadDefaultSettings();
    }
}

// 초기값 설정 함수 (저장된 데이터가 없을 때만 실행됨)
function loadDefaultSettings() {
    // ===== 사용자 커스텀 초기값 =====

    // 기본 서식 설정
    const useRoundedQuotes = document.getElementById('useRoundedQuotes');
    const useTextIndent = document.getElementById('useTextIndent');
    if (useRoundedQuotes) useRoundedQuotes.checked = true;
    if (useTextIndent) useTextIndent.checked = false;
    const preserveLineBreaks = document.getElementById('preserveLineBreaks');
    if (preserveLineBreaks) preserveLineBreaks.checked = false;

    // 인트로 섹션 활성화
    const enableTopSection = document.getElementById('enableTopSection');
    const topSectionContent = document.getElementById('topSectionContent');
    if (enableTopSection) enableTopSection.checked = true;
    if (topSectionContent) topSectionContent.style.display = 'block';

    // 표지 설정
    const enableCover = document.getElementById('enableCover');
    const coverImage = document.getElementById('coverImage');
    const coverZoom = document.getElementById('coverZoom');
    const coverFocusX = document.getElementById('coverFocusX');
    const coverFocusY = document.getElementById('coverFocusY');
    const coverArchiveNo = document.getElementById('coverArchiveNo');
    const coverTitle = document.getElementById('coverTitle');
    const coverSubtitle = document.getElementById('coverSubtitle');
    const coverContent = document.getElementById('coverContent');
    const coverZoomValue = document.getElementById('coverZoomValue');
    const coverFocusXValue = document.getElementById('coverFocusXValue');
    const coverFocusYValue = document.getElementById('coverFocusYValue');
    
    if (enableCover) enableCover.checked = true;
    if (coverImage) coverImage.value = 'DefaultCover.png';
    if (coverZoom) coverZoom.value = 120;
    if (coverFocusX) coverFocusX.value = 50;
    if (coverFocusY) coverFocusY.value = 30;
    if (coverArchiveNo) coverArchiveNo.value = 'ARCHIVE NO.001';
    if (coverTitle) coverTitle.value = 'Yuzu';
    if (coverSubtitle) coverSubtitle.value = '귀여운 고양이 메이드';
    if (coverContent) coverContent.style.display = 'block';
    if (coverZoomValue) coverZoomValue.textContent = '120%';
    if (coverFocusXValue) coverFocusXValue.textContent = '50%';
    if (coverFocusYValue) coverFocusYValue.textContent = '30%';

    // 프로필 활성화
    const enableProfiles = document.getElementById('enableProfiles');
    const profileInputs = document.getElementById('profileInputs');
    if (enableProfiles) enableProfiles.checked = true;
    if (profileInputs) profileInputs.style.display = 'block';

    // 프로필 데이터
    profiles = [
        {
            name: 'Yuzu',
            imageUrl: 'DefaultProfile1.png',
            zoom: 100,
            focusX: 50,
            focusY: 30,
            desc: ' Profile 1 Description',
            tag: 'CHAR'
        },
        {
            name: 'Jong-won',
            imageUrl: 'DefaultProfile2.png',
            zoom: 100,
            focusX: 50,
            focusY: 10,
            desc: 'Profile 2 Description',
            tag: 'USER'
        }
    ];

    // 인트로/요약 텍스트
    const introText = document.getElementById('introText');
    const summaryText = document.getElementById('summaryText');
    if (introText) introText.value = '';
    if (summaryText) summaryText.value = '';

    // 태그 활성화
    const enableTags = document.getElementById('enableTags');
    const tagsInputs = document.getElementById('tagsInputs');
    if (enableTags) enableTags.checked = true;
    if (tagsInputs) tagsInputs.style.display = 'block';
    tags = [
        { name: 'Bot', value: 'Bot', link: '' },
        { name: 'Model', value: 'Model', link: '' },
        { name: 'Prompt', value: 'Prompt', link: '' },
        { name: 'Language', value: 'Eng', link: '' }
    ];

    // 테마 설정
    const topTheme = document.getElementById('topTheme');
    if (topTheme) topTheme.value = 'basic';

    // 커스텀 컬러 (basic 테마)
    setColorInputValue('customBg', '#ffffff');
    setColorInputValue('customText', '#2c3e50');
    setColorInputValue('customEm', '#2d5af0');
    setColorInputValue('customLine', '#2c3e50');
    setColorInputValue('customHeaderText', '#162a3e');
    setColorInputValue('customQuote1Bg', '#f0f2f5');
    setColorInputValue('customQuote1Text', '#2c3e50');
    setColorInputValue('customQuote2Bg', '#f0f2f5');
    setColorInputValue('customQuote2Text', '#162a3e');
    setColorInputValue('customTagText', '#6c8da8');
    setColorInputValue('customDivider', '#c8d6e0');

    // 페이지 데이터
    pages = [
        {
            itemType: 'section',
            title: 'Section Title',
            subtitle: 'Story',
            image: 'DefaultSection.png',
            focusX: 50,
            focusY: 40
        },
        {
            itemType: 'page',
            type: 'basic',
            title: 'Page Title',
            subtitle: 'Page Subtitle',
            content: '[IMG:DefaultImg.png]\nPage Content',
            bgImage: null,
            collapsed: false,
            useGlobalTags: true,
            tags: [],
            headerImage: null,
            headerFocusX: 50,
            headerFocusY: 50
        }
    ];

    // 치환 규칙
    replacements = [{ from: '', to: '' }];

    // 커스텀 테마
    customThemes = [];

    // 텍스트 간격 설정
    textSpacing = {
        fontSize: 14.2,
        lineHeight: 1.7,
        letterSpacing: -0.5,
        paragraphSpacing: 10,
        textIndent: 0
    };

    const textSizeInput = document.getElementById('textSizeInput');
    const textSizeSlider = document.getElementById('textSizeSlider');
    const lineHeightInput = document.getElementById('lineHeightInput');
    const lineHeightSlider = document.getElementById('lineHeightSlider');
    const letterSpacingInput = document.getElementById('letterSpacingInput');
    const letterSpacingSlider = document.getElementById('letterSpacingSlider');
    const paragraphSpacingInput = document.getElementById('paragraphSpacingInput');
    const paragraphSpacingSlider = document.getElementById('paragraphSpacingSlider');
    const textIndentInput = document.getElementById('textIndentInput');
    const textIndentSlider = document.getElementById('textIndentSlider');

    if (textSizeInput) textSizeInput.value = 14.2;
    if (textSizeSlider) textSizeSlider.value = 14.2;
    if (lineHeightInput) lineHeightInput.value = 1.7;
    if (lineHeightSlider) lineHeightSlider.value = 1.7;
    if (letterSpacingInput) letterSpacingInput.value = -0.5;
    if (letterSpacingSlider) letterSpacingSlider.value = -0.5;
    if (paragraphSpacingInput) paragraphSpacingInput.value = 10;
    if (paragraphSpacingSlider) paragraphSpacingSlider.value = 10;
    if (textIndentInput) textIndentInput.value = 0;
    if (textIndentSlider) textIndentSlider.value = 0;

    // 폰트 설정
    fontFamily = 'Noto Serif KR';
    const fontFamilySelect = document.getElementById('fontFamily');
    if (fontFamilySelect) fontFamilySelect.value = fontFamily;

    // UI 업데이트
    updateTagsList();
    updateReplacementsList();
    updatePagesList();
    updateCustomThemesList();
    updateProfilesList();

    // 초기 미리보기 업데이트
    updatePreview();
}

function setColorInputValue(baseId, value) {
    const colorInput = document.getElementById(baseId);
    const textInput = document.getElementById(baseId + 'Text');
    if (colorInput) colorInput.value = value;
    if (textInput) textInput.value = value;
}

function getColorValue(baseId) {
    const colorInput = document.getElementById(baseId);
    return colorInput ? colorInput.value : '#000000';
}

function saveToStorage() {
    try {
        const getChecked = (id) => {
            const el = document.getElementById(id);
            return el ? el.checked : false;
        };
        
        const getValue = (id, defaultValue = '') => {
            const el = document.getElementById(id);
            return el ? el.value : defaultValue;
        };
        
        const getIntValue = (id, defaultValue = 0) => {
            const el = document.getElementById(id);
            return el ? parseInt(el.value) : defaultValue;
        };
        
        const data = {
            useRoundedQuotes: getChecked('useRoundedQuotes'),
            useTextIndent: getChecked('useTextIndent'),
            preserveLineBreaks: getChecked('preserveLineBreaks'),
            enableTopSection: getChecked('enableTopSection'),
            enableCover: getChecked('enableCover'),
            coverImage: getValue('coverImage'),
            coverAutoFit: getChecked('coverAutoFit'),
            coverZoom: getIntValue('coverZoom', 120),
            coverFocusX: getIntValue('coverFocusX', 50),
            coverFocusY: getIntValue('coverFocusY', 30),
            coverArchiveNo: getValue('coverArchiveNo'),
            coverTitle: getValue('coverTitle'),
            coverSubtitle: getValue('coverSubtitle'),
            enableProfiles: getChecked('enableProfiles'),
            introText: getValue('introText'),
            summaryText: getValue('summaryText'),
            soundtrackUrl: getValue('soundtrackUrl'),
            soundtrackTitle: getValue('soundtrackTitle'),
            soundtrackArtist: getValue('soundtrackArtist'),
            enableComment: getChecked('enableComment'),
            commentText: getValue('commentText'),
            commentNickname: getValue('commentNickname'),
            enableTags: getChecked('enableTags'),
            customColors: {
                bg: getColorValue('customBg'),
                text: getColorValue('customText'),
                em: getColorValue('customEm'),
                header: getColorValue('customHeader'),
                quote1Bg: getColorValue('customQuote1Bg'),
                quote1Text: getColorValue('customQuote1Text'),
                quote2Bg: getColorValue('customQuote2Bg'),
                quote2Text: getColorValue('customQuote2Text'),
                tagText: getColorValue('customTagText'),
                divider: getColorValue('customDivider')
            },
            pages: pages,
            tags: tags,
            replacements: replacements,
            customThemes: customThemes,
            profiles: profiles,
            textSpacing: textSpacing,
            fontFamily: fontFamily,
            globalTheme: globalTheme,
            hidePageNumbers: hidePageNumbers,
            headingFontSizes: headingFontSizes,
            enablePageFold: enablePageFold,
            showHeaderWhenFoldOff: showHeaderWhenFoldOff,
            dividerStyle: dividerStyle,
            dividerCustomText: dividerCustomText
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save to storage:', e);
    }
}

function setupEventListeners() {
    const inputIds = ['introText', 'summaryText', 'topBgImage', 'coverImage', 'coverArchiveNo', 'coverTitle', 'coverSubtitle', 'soundtrackUrl', 'soundtrackTitle', 'soundtrackArtist', 'commentText', 'commentNickname'];
    inputIds.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function () {
                updatePreview();
                saveToStorage();
            });
        }
    });

    // 표지 Focus 슬라이더 이벤트
    const coverZoom = document.getElementById('coverZoom');
    const coverFocusX = document.getElementById('coverFocusX');
    const coverFocusY = document.getElementById('coverFocusY');

    if (coverZoom) {
        coverZoom.addEventListener('input', function () {
            const coverZoomValue = document.getElementById('coverZoomValue');
            if (coverZoomValue) coverZoomValue.textContent = this.value + '%';
            updatePreview();
            saveToStorage();
        });
    }

    if (coverFocusX) {
        coverFocusX.addEventListener('input', function () {
            const coverFocusXValue = document.getElementById('coverFocusXValue');
            if (coverFocusXValue) coverFocusXValue.textContent = this.value + '%';
            updatePreview();
            saveToStorage();
        });
    }

    if (coverFocusY) {
        coverFocusY.addEventListener('input', function () {
            const coverFocusYValue = document.getElementById('coverFocusYValue');
            if (coverFocusYValue) coverFocusYValue.textContent = this.value + '%';
            updatePreview();
            saveToStorage();
        });
    }

    // 표지 자동 크기 조절 체크박스
    const coverAutoFit = document.getElementById('coverAutoFit');
    if (coverAutoFit) {
        coverAutoFit.addEventListener('change', function () {
            const coverManualControls = document.getElementById('coverManualControls');
            if (coverManualControls) {
                coverManualControls.style.display = this.checked ? 'none' : 'block';
            }
            updatePreview();
            saveToStorage();
        });
    }

    // 표지 활성화 체크박스
    const enableCover = document.getElementById('enableCover');
    if (enableCover) {
        enableCover.addEventListener('change', function () {
            const coverContent = document.getElementById('coverContent');
            if (coverContent) coverContent.style.display = this.checked ? 'block' : 'none';
            updatePreview();
            saveToStorage();
        });
    }

    // globalTheme 변경 시 커스텀 색상에도 반영
    const globalThemeEl = document.getElementById('globalTheme');
    if (globalThemeEl) {
        globalThemeEl.addEventListener('change', function () {
            globalTheme = globalThemeEl.value;
            const selectedTheme = globalTheme;
            let themeToApply = null;

            if (selectedTheme === 'user') {
                themeToApply = STYLES.light;
            } else if (selectedTheme === 'char') {
                themeToApply = STYLES.dark;
            } else if (STYLES[selectedTheme]) {
                themeToApply = STYLES[selectedTheme];
            }

            if (themeToApply) {
                const theme = themeToApply;
                setColorInputValue('customBg', theme.bg);
                setColorInputValue('customText', theme.text);
                setColorInputValue('customEm', theme.em);
                setColorInputValue('customHeader', theme.header);
                setColorInputValue('customQuote1Bg', theme.quote1Bg);
                setColorInputValue('customQuote1Text', theme.quote1Text);
                setColorInputValue('customQuote2Bg', theme.quote2Bg);
                setColorInputValue('customQuote2Text', theme.quote2Text);
                setColorInputValue('customTagText', theme.tagText || theme.text);
                setColorInputValue('customDivider', theme.divider || theme.tagText || theme.text);
            }
            updatePreview();
            saveToStorage();
        });
    }

    // hidePageNumbers 체크박스 이벤트
    const hidePageNumbersEl = document.getElementById('hidePageNumbers');
    if (hidePageNumbersEl) {
        hidePageNumbersEl.addEventListener('change', function () {
            hidePageNumbers = hidePageNumbersEl.checked;
            updatePreview();
            saveToStorage();
        });
    }

    // enablePageFold 체크박스 이벤트
    const enablePageFoldEl = document.getElementById('enablePageFold');
    if (enablePageFoldEl) {
        enablePageFoldEl.addEventListener('change', function () {
            enablePageFold = enablePageFoldEl.checked;
            updatePreview();
            saveToStorage();
        });
    }

    // showHeaderWhenFoldOff 체크박스 이벤트
    const showHeaderWhenFoldOffEl = document.getElementById('showHeaderWhenFoldOff');
    if (showHeaderWhenFoldOffEl) {
        showHeaderWhenFoldOffEl.addEventListener('change', function () {
            showHeaderWhenFoldOff = showHeaderWhenFoldOffEl.checked;
            updatePreview();
            saveToStorage();
        });
    }

    // dividerStyle 드롭다운 이벤트
    const dividerStyleEl = document.getElementById('dividerStyle');
    const dividerCustomEl = document.getElementById('dividerCustomText');
    if (dividerStyleEl) {
        dividerStyleEl.addEventListener('change', function () {
            dividerStyle = dividerStyleEl.value;
            dividerCustomEl.style.display = dividerStyle === 'custom' ? 'block' : 'none';
            updatePreview();
            saveToStorage();
        });
    }
    if (dividerCustomEl) {
        dividerCustomEl.addEventListener('input', function () {
            dividerCustomText = dividerCustomEl.value;
            updatePreview();
            saveToStorage();
        });
    }

    const checkboxIds = ['useRoundedQuotes', 'useTextIndent', 'preserveLineBreaks', 'enableTopSection', 'enableProfiles', 'enableTags', 'enableCover', 'enableComment'];
    checkboxIds.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function () {
                if (id === 'enableTopSection') {
                    document.getElementById('topSectionContent').style.display = el.checked ? 'block' : 'none';
                }
                if (id === 'enableComment') {
                    document.getElementById('commentContent').style.display = el.checked ? 'block' : 'none';
                }
                updatePreview();
                saveToStorage();
            });
        }
    });

    const enableProfiles = document.getElementById('enableProfiles');
    if (enableProfiles) {
        enableProfiles.addEventListener('change', function () {
            document.getElementById('profileInputs').style.display =
                enableProfiles.checked ? 'block' : 'none';
        });
    }

    const enableTags = document.getElementById('enableTags');
    if (enableTags) {
        enableTags.addEventListener('change', function () {
            document.getElementById('tagsInputs').style.display =
                enableTags.checked ? 'block' : 'none';
        });
    }

    const colorIds = ['customBg', 'customText', 'customEm', 'customHeader',
        'customQuote1Bg', 'customQuote1Text', 'customQuote2Bg', 'customQuote2Text', 'customTagText', 'customDivider'];
    colorIds.forEach(function (id) {
        const colorEl = document.getElementById(id);
        const textEl = document.getElementById(id + 'Text');

        if (colorEl) {
            colorEl.addEventListener('input', function () {
                if (textEl) textEl.value = colorEl.value;
                updatePreview();
                saveToStorage();
            });
        }

        if (textEl) {
            textEl.addEventListener('input', function () {
                const val = textEl.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    if (colorEl) colorEl.value = val;
                    updatePreview();
                    saveToStorage();
                }
            });
            textEl.addEventListener('blur', function () {
                let val = textEl.value;
                if (!val.startsWith('#')) val = '#' + val;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                    textEl.value = val;
                    if (colorEl) colorEl.value = val;
                    updatePreview();
                    saveToStorage();
                } else {
                    textEl.value = colorEl ? colorEl.value : '#000000';
                }
            });
        }
    });

    const addPageBtn = document.getElementById('addPage');
    if (addPageBtn) {
        addPageBtn.addEventListener('click', function () {
            currentEditingIndex = null;
            document.getElementById('pageTitle').value = '';
            document.getElementById('pageSubtitle').value = '';
            document.getElementById('pageContent').value = '';

            tempPageTags = [];

            const pageModal = document.getElementById('pageModal');
            pageModal.style.display = 'block';
            
            // 페이지 통계 초기화
            updatePageStats();
            
            // 모바일에서 모달과 body를 맨 위로 스크롤
            setTimeout(function() {
                pageModal.scrollTop = 0;
                const modalBody = pageModal.querySelector('.modal-body');
                if (modalBody) modalBody.scrollTop = 0;
            }, 50);
        });
    }

    // NEW SECTION 버튼 이벤트
    const addSectionBtn = document.getElementById('addSection');
    if (addSectionBtn) {
        addSectionBtn.addEventListener('click', function () {
            currentEditingIndex = null;
            document.getElementById('sectionTitle').value = '';
            document.getElementById('sectionSubtitle').value = '';
            document.getElementById('sectionImage').value = '';
            document.getElementById('sectionAlign').value = 'center';
            document.getElementById('sectionZoom').value = 100;
            document.getElementById('sectionFocusX').value = 50;
            document.getElementById('sectionFocusY').value = 50;
            document.getElementById('sectionZoomValue').textContent = '100%';
            document.getElementById('sectionFocusXValue').textContent = '50%';
            document.getElementById('sectionFocusYValue').textContent = '50%';

            const sectionModal = document.getElementById('sectionModal');
            sectionModal.style.display = 'block';
            
            // 모바일에서 모달과 body를 맨 위로 스크롤
            setTimeout(function() {
                sectionModal.scrollTop = 0;
                const modalBody = sectionModal.querySelector('.modal-body');
                if (modalBody) modalBody.scrollTop = 0;
            }, 50);
        });
    }

    const closeModal = document.querySelector('.close');
    if (closeModal) {
        closeModal.addEventListener('click', function () {
            document.getElementById('pageModal').style.display = 'none';
        });
    }

    const closeSectionModal = document.querySelector('.close-section');
    if (closeSectionModal) {
        closeSectionModal.addEventListener('click', function () {
            document.getElementById('sectionModal').style.display = 'none';
        });
    }

    const savePage = document.getElementById('savePage');
    if (savePage) {
        savePage.addEventListener('click', savePageData);
    }

    const saveSection = document.getElementById('saveSection');
    if (saveSection) {
        saveSection.addEventListener('click', saveSectionData);
    }

    const deletePage = document.getElementById('deletePage');
    if (deletePage) {
        deletePage.addEventListener('click', deletePageData);
    }

    const deleteSection = document.getElementById('deleteSection');
    if (deleteSection) {
        deleteSection.addEventListener('click', deleteSectionData);
    }

    const deleteAllPagesBtn = document.getElementById('deleteAllPages');
    if (deleteAllPagesBtn) {
        deleteAllPagesBtn.addEventListener('click', deleteAllPages);
    }

    // 페이지 컨텐츠 입력 시 실시간 통계 업데이트
    const pageContent = document.getElementById('pageContent');
    if (pageContent) {
        pageContent.addEventListener('input', function() {
            updatePageStats();
        });
    }

    // 섹션 Focus 슬라이더 이벤트
    const sectionZoom = document.getElementById('sectionZoom');
    if (sectionZoom) {
        sectionZoom.addEventListener('input', function () {
            document.getElementById('sectionZoomValue').textContent = this.value + '%';
        });
    }

    const sectionFocusX = document.getElementById('sectionFocusX');
    if (sectionFocusX) {
        sectionFocusX.addEventListener('input', function () {
            document.getElementById('sectionFocusXValue').textContent = this.value + '%';
        });
    }

    const sectionFocusY = document.getElementById('sectionFocusY');
    if (sectionFocusY) {
        sectionFocusY.addEventListener('input', function () {
            document.getElementById('sectionFocusYValue').textContent = this.value + '%';
        });
    }

    // 전역 이미지 크기 슬라이더 이벤트
    const defaultImageWidth = document.getElementById('defaultImageWidth');
    if (defaultImageWidth) {
        defaultImageWidth.addEventListener('input', function () {
            const defaultImageWidthValue = document.getElementById('defaultImageWidthValue');
            if (defaultImageWidthValue) {
                defaultImageWidthValue.textContent = this.value + '%';
            }
        });
    }

    const insertImage = document.getElementById('insertImage');
    if (insertImage) {
        insertImage.addEventListener('click', function () {
            const url = prompt('이미지 URL을 입력하세요:');
            if (url) {
                const pageContent = document.getElementById('pageContent');
                const cursorPos = pageContent.selectionStart;
                const text = pageContent.value;
                
                // 기본적으로 페이지 설정을 사용하는 이미지 태그 삽입
                let imgTag = '[IMG:' + url + ']';
                
                pageContent.value = text.slice(0, cursorPos) + imgTag + text.slice(cursorPos);
            }
        });
    }

    // ── Bold / Italic 토글 버튼 ──
    function toggleInlineWrap(marker) {
        const ta = document.getElementById('pageContent');
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = ta.value;
        const selected = text.slice(start, end);
        const mLen = marker.length;

        // 이미 감싸져 있으면 제거, 없으면 추가
        const before = text.slice(start - mLen, start);
        const after = text.slice(end, end + mLen);
        if (before === marker && after === marker) {
            ta.value = text.slice(0, start - mLen) + selected + text.slice(end + mLen);
            ta.setSelectionRange(start - mLen, end - mLen);
        } else {
            const insert = marker + (selected || '텍스트') + marker;
            ta.value = text.slice(0, start) + insert + text.slice(end);
            ta.setSelectionRange(start + mLen, start + mLen + (selected || '텍스트').length);
        }
        ta.focus();
        updatePreview();
    }

    const insertBoldBtn = document.getElementById('insertBold');
    if (insertBoldBtn) insertBoldBtn.addEventListener('click', function() { toggleInlineWrap('**'); });

    const insertItalicBtn = document.getElementById('insertItalic');
    if (insertItalicBtn) insertItalicBtn.addEventListener('click', function() { toggleInlineWrap('*'); });

    // ── 정렬 버튼 ──
    function setLineAlign(prefix) {
        const ta = document.getElementById('pageContent');
        if (!ta) return;
        const start = ta.selectionStart;
        const text = ta.value;
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', start);
        const lineEndActual = lineEnd === -1 ? text.length : lineEnd;
        const lineText = text.slice(lineStart, lineEndActual);
        // 기존 정렬 prefix 제거 후 새 prefix 추가 (토글: 같은 prefix면 제거)
        const stripped = lineText.replace(/^\[<\]\s*|^\[\|\]\s*|^\[>\]\s*/, '');
        const existingPrefix = lineText.match(/^(\[<\]|\[\|\]|\[>\])\s*/);
        const isSame = existingPrefix && existingPrefix[1] === prefix;
        const newLine = isSame ? stripped : prefix + ' ' + stripped;
        ta.value = text.slice(0, lineStart) + newLine + text.slice(lineEndActual);
        ta.setSelectionRange(lineStart + newLine.length, lineStart + newLine.length);
        ta.focus();
        updatePreview();
    }

    const insertAlignLeft = document.getElementById('insertAlignLeft');
    if (insertAlignLeft) insertAlignLeft.addEventListener('click', function() { setLineAlign('[<]'); });
    const insertAlignCenter = document.getElementById('insertAlignCenter');
    if (insertAlignCenter) insertAlignCenter.addEventListener('click', function() { setLineAlign('[|]'); });
    const insertAlignRight = document.getElementById('insertAlignRight');
    if (insertAlignRight) insertAlignRight.addEventListener('click', function() { setLineAlign('[>]'); });

    // ── 마크다운 헤딩 삽입 버튼 ──
    function insertHeading(prefix) {
        const ta = document.getElementById('pageContent');
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = ta.value;
        const selected = text.slice(start, end).trim();
        // 커서가 있는 줄의 시작으로 이동
        const lineStart = text.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = text.indexOf('\n', end);
        const lineEndActual = lineEnd === -1 ? text.length : lineEnd;
        const lineText = text.slice(lineStart, lineEndActual);
        // 이미 헤딩 prefix가 있으면 교체, 없으면 추가
        const stripped = lineText.replace(/^#{1,4}\s*/, '');
        const newLine = prefix + ' ' + (stripped || '제목');
        ta.value = text.slice(0, lineStart) + newLine + text.slice(lineEndActual);
        // 텍스트 부분 선택
        const selectStart = lineStart + prefix.length + 1;
        const selectEnd = lineStart + newLine.length;
        ta.setSelectionRange(selectStart, selectEnd);
        ta.focus();
        updatePreview();
    }

    ['insertH1', 'insertH2', 'insertH3', 'insertH4'].forEach(function(id) {
        const btn = document.getElementById(id);
        if (btn) {
            const level = parseInt(id.replace('insertH', ''));
            btn.addEventListener('click', function() {
                insertHeading('#'.repeat(level));
            });
        }
    });

    const insertDivider = document.getElementById('insertDivider');
    if (insertDivider) {
        insertDivider.addEventListener('click', function () {
            const pageContent = document.getElementById('pageContent');
            const cursorPos = pageContent.selectionStart;
            const text = pageContent.value;
            pageContent.value = text.slice(0, cursorPos) + '\n[HR]\n' + text.slice(cursorPos);
        });
    }

    const insertFootnote = document.getElementById('insertFootnote');
    if (insertFootnote) {
        insertFootnote.addEventListener('click', function () {
            const pageContent = document.getElementById('pageContent');
            const selectedText = pageContent.value.substring(pageContent.selectionStart, pageContent.selectionEnd);
            if (!selectedText) {
                alert('주석을 달 텍스트를 먼저 선택하세요.');
                return;
            }
            const footnote = prompt('주석 내용을 입력하세요:');
            if (footnote) {
                const cursorStart = pageContent.selectionStart;
                const cursorEnd = pageContent.selectionEnd;
                const text = pageContent.value;
                pageContent.value = text.slice(0, cursorStart) + '[FN:' + selectedText + ']' + footnote + '[/FN]' + text.slice(cursorEnd);
            }
        });
    }


    const addTagBtn = document.getElementById('addTag');
    if (addTagBtn) {
        addTagBtn.addEventListener('click', function () {
            tags.push({ name: '', value: '', link: '' });
            updateTagsList();
            saveToStorage();
        });
    }

    const addReplacementBtn = document.getElementById('addReplacement');
    if (addReplacementBtn) {
        addReplacementBtn.addEventListener('click', function () {
            replacements.push({ from: '', to: '' });
            updateReplacementsList();
            saveToStorage();
        });
    }

    const addThemeBtn = document.getElementById('addCustomTheme');
    if (addThemeBtn) {
        addThemeBtn.addEventListener('click', addCustomTheme);
    }

    const addProfileBtn = document.getElementById('addProfile');
    if (addProfileBtn) {
        addProfileBtn.addEventListener('click', function () {
            if (profiles.length < 6) {
                profiles.push({
                    name: '',
                    imageUrl: '',
                    zoom: 100,
                    focusX: 50,
                    focusY: 30,
                    desc: '',
                    tag: ''
                });
                updateProfilesList();
                saveToStorage();
            } else {
                alert('프로필은 최대 6개까지 추가할 수 있습니다.');
            }
        });
    }

    const copyBtn = document.getElementById('copyToClipboard');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyToClipboard);
    }


    // --- script.js의 setupEventListeners 함수 내부에 추가 ---

    // 텍스트 간격 조정 기능
    const spacingDisplayMap = {
        fontSize: { displayId: 'textSizeDisplay', unit: 'px', decimals: 1 },
        lineHeight: { displayId: 'lineHeightDisplay', unit: '', decimals: 2 },
        letterSpacing: { displayId: 'letterSpacingDisplay', unit: 'px', decimals: 1 },
        paragraphSpacing: { displayId: 'paragraphSpacingDisplay', unit: 'px', decimals: 0 },
        textIndent: { displayId: 'textIndentDisplay', unit: 'px', decimals: 0 }
    };

    function updateSpacingDisplay(property, value) {
        const info = spacingDisplayMap[property];
        if (!info) return;
        const el = document.getElementById(info.displayId);
        if (el) el.textContent = parseFloat(value).toFixed(info.decimals) + info.unit;
    }

    function setupSpacingControls(inputId, sliderId, property) {
        const input = document.getElementById(inputId);
        const slider = document.getElementById(sliderId);

        if (input && slider) {
            // 입력창 변경
            input.addEventListener('input', function () {
                const value = parseFloat(this.value);
                slider.value = value;
                textSpacing[property] = value;
                updateSpacingDisplay(property, value);
                updatePreview();
                saveToStorage();
            });

            // 슬라이더 변경
            slider.addEventListener('input', function () {
                const value = parseFloat(this.value);
                input.value = value;
                textSpacing[property] = value;
                updateSpacingDisplay(property, value);
                updatePreview();
                saveToStorage();
            });

            // 초기 display 갱신
            updateSpacingDisplay(property, textSpacing[property] !== undefined ? textSpacing[property] : parseFloat(slider.value));
        }
    }

    // 각 간격 설정에 대한 이벤트 리스너 등록
    setupSpacingControls('textSizeInput', 'textSizeSlider', 'fontSize');
    setupSpacingControls('lineHeightInput', 'lineHeightSlider', 'lineHeight');
    setupSpacingControls('letterSpacingInput', 'letterSpacingSlider', 'letterSpacing');
    setupSpacingControls('paragraphSpacingInput', 'paragraphSpacingSlider', 'paragraphSpacing');
    setupSpacingControls('textIndentInput', 'textIndentSlider', 'textIndent');

    // 기본값 초기화 버튼
    const resetSpacingBtn = document.getElementById('resetSpacing');
    if (resetSpacingBtn) {
        resetSpacingBtn.addEventListener('click', function () {
            textSpacing = {
                fontSize: 14.2,
                lineHeight: 1.7,
                letterSpacing: -0.5,
                paragraphSpacing: 10,
                textIndent: 0
            };

            const textSizeInput = document.getElementById('textSizeInput');
            const textSizeSlider = document.getElementById('textSizeSlider');
            const lineHeightInput = document.getElementById('lineHeightInput');
            const lineHeightSlider = document.getElementById('lineHeightSlider');
            const letterSpacingInput = document.getElementById('letterSpacingInput');
            const letterSpacingSlider = document.getElementById('letterSpacingSlider');
            const paragraphSpacingInput = document.getElementById('paragraphSpacingInput');
            const paragraphSpacingSlider = document.getElementById('paragraphSpacingSlider');
            const textIndentInput = document.getElementById('textIndentInput');
            const textIndentSlider = document.getElementById('textIndentSlider');

            if (textSizeInput) textSizeInput.value = 14.2;
            if (textSizeSlider) textSizeSlider.value = 14.2;
            if (lineHeightInput) lineHeightInput.value = 1.7;
            if (lineHeightSlider) lineHeightSlider.value = 1.7;
            if (letterSpacingInput) letterSpacingInput.value = -0.5;
            if (letterSpacingSlider) letterSpacingSlider.value = -0.5;
            if (paragraphSpacingInput) paragraphSpacingInput.value = 10;
            if (paragraphSpacingSlider) paragraphSpacingSlider.value = 10;
            if (textIndentInput) textIndentInput.value = 0;
            if (textIndentSlider) textIndentSlider.value = 0;

            updatePreview();
            saveToStorage();
            showNotification('텍스트 간격이 기본값으로 초기화되었습니다.');
        });
    }

    // ── HEADING SIZES 컨트롤 ──────────────────────────────────────────
    const headingDefaults = {
        coverArchiveNo: 11,
        coverTitle: 42,
        coverSubtitle: 14,
        coverTag: 11,
        sectionTitle: 20,
        sectionSubtitle: 11,
        pageHeaderNum: 40,
        pageHeaderTitle: 15,
    };
    const headingDisplayMap = {
        coverArchiveNo:  { slider: 'coverArchiveNoSizeSlider',  input: 'coverArchiveNoSizeInput',  display: 'coverArchiveNoSizeDisplay' },
        coverTitle:      { slider: 'coverTitleSizeSlider',      input: 'coverTitleSizeInput',      display: 'coverTitleSizeDisplay' },
        coverSubtitle:   { slider: 'coverSubtitleSizeSlider',   input: 'coverSubtitleSizeInput',   display: 'coverSubtitleSizeDisplay' },
        coverTag:        { slider: 'coverTagSizeSlider',        input: 'coverTagSizeInput',        display: 'coverTagSizeDisplay' },
        sectionTitle:    { slider: 'sectionTitleSizeSlider',    input: 'sectionTitleSizeInput',    display: 'sectionTitleSizeDisplay' },
        sectionSubtitle: { slider: 'sectionSubtitleSizeSlider', input: 'sectionSubtitleSizeInput', display: 'sectionSubtitleSizeDisplay' },
        pageHeaderNum:   { slider: 'pageHeaderNumSizeSlider',   input: 'pageHeaderNumSizeInput',   display: 'pageHeaderNumSizeDisplay' },
        pageHeaderTitle: { slider: 'pageHeaderTitleSizeSlider', input: 'pageHeaderTitleSizeInput', display: 'pageHeaderTitleSizeDisplay' },
    };

    function syncHeadingUI(key, value) {
        const ids = headingDisplayMap[key];
        const sl = document.getElementById(ids.slider);
        const inp = document.getElementById(ids.input);
        const dsp = document.getElementById(ids.display);
        if (sl) sl.value = value;
        if (inp) inp.value = value;
        if (dsp) dsp.textContent = value + 'px';
    }

    function setupHeadingControl(key) {
        const ids = headingDisplayMap[key];
        const slider = document.getElementById(ids.slider);
        const input  = document.getElementById(ids.input);
        if (!slider || !input) return;
        slider.addEventListener('input', function () {
            const v = parseFloat(this.value);
            headingFontSizes[key] = v;
            syncHeadingUI(key, v);
            updatePreview();
            saveToStorage();
        });
        input.addEventListener('input', function () {
            const v = parseFloat(this.value);
            headingFontSizes[key] = v;
            syncHeadingUI(key, v);
            updatePreview();
            saveToStorage();
        });
        // 초기값 동기화
        syncHeadingUI(key, headingFontSizes[key]);
    }

    Object.keys(headingDefaults).forEach(setupHeadingControl);

    const resetHeadingBtn = document.getElementById('resetHeadingSizes');
    if (resetHeadingBtn) {
        resetHeadingBtn.addEventListener('click', function () {
            headingFontSizes = { ...headingDefaults };
            Object.keys(headingDefaults).forEach(k => syncHeadingUI(k, headingDefaults[k]));
            updatePreview();
            saveToStorage();
            showNotification('제목 크기가 기본값으로 초기화되었습니다.');
        });
    }
    // ─────────────────────────────────────────────────────────────────

    // 폰트 선택 이벤트
    const fontFamilySelect = document.getElementById('fontFamily');
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', function () {
            fontFamily = this.value;
            updatePreview();
            saveToStorage();
            showNotification('폰트가 변경되었습니다: ' + fontFamily);
        });
    }

    // 코멘트 테마 선택 이벤트
    const commentThemeSelect = document.getElementById('commentTheme');
    if (commentThemeSelect) {
        commentThemeSelect.addEventListener('change', function () {
            updatePreview();
            saveToStorage();
        });
    }

    // 빗소리 토글 기능
    const soundToggle = document.getElementById('soundToggle');
    const rainAudio = document.getElementById('rainAudio');
    const iconOff = document.getElementById('icon-sound-off');
    const iconOn = document.getElementById('icon-sound-on');

    if (soundToggle && rainAudio) {
        // 오디오 볼륨 설정 (너무 크지 않게)
        rainAudio.volume = 1.0;

        soundToggle.addEventListener('click', function () {
            if (rainAudio.paused) {
                rainAudio.play().then(() => {
                    iconOff.style.display = 'none';
                    iconOn.style.display = 'block';
                    soundToggle.classList.add('playing');
                    showNotification('빗소리가 켜졌습니다.');
                }).catch(e => {
                    console.error("Audio playback failed:", e);
                    showNotification('오디오 재생 실패 (브라우저 정책 확인)');
                });
            } else {
                rainAudio.pause();
                iconOff.style.display = 'block';
                iconOn.style.display = 'none';
                soundToggle.classList.remove('playing');
                showNotification('빗소리가 꺼졌습니다.');
            }
        });
    }

    // 데이터 내보내기 버튼
    const exportDataBtn = document.getElementById('exportData');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportDataToJSON);
    }

    // 데이터 불러오기 버튼
    const importDataBtn = document.getElementById('importData');
    const importFileInput = document.getElementById('importFileInput');
    if (importDataBtn && importFileInput) {
        importDataBtn.addEventListener('click', function () {
            importFileInput.click();
        });

        importFileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                importDataFromJSON(file);
                // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
                e.target.value = '';
            }
        });
    }

    // 초기화 버튼
    const resetDataBtn = document.getElementById('resetData');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', resetCurrentData);
    }
}

// 알림 타이머 전역 변수
let notificationTimer = null;

function showNotification(message) {
    const notification = document.getElementById('notification');
    
    // 기존 타이머가 있으면 제거
    if (notificationTimer) {
        clearTimeout(notificationTimer);
        notification.classList.remove('show');
    }
    
    // 강제로 리플로우를 발생시켜 애니메이션 재시작
    void notification.offsetWidth;
    
    notification.textContent = message;
    notification.classList.add('show');
    
    notificationTimer = setTimeout(function () { 
        notification.classList.remove('show');
        notificationTimer = null;
    }, 2000);
}

// 현재 작업 내용 초기화 (프리셋·커스텀 테마는 유지)
function resetCurrentData() {
    if (!confirm('현재 작업 중인 모든 내용이 초기화됩니다.\n저장된 프리셋과 테마는 유지됩니다.\n\n계속하시겠습니까?')) return;

    // ── 전역 변수 초기화 ──
    pages = [];
    tags = [];
    replacements = [];
    profiles = [];
    currentEditingIndex = null;
    tempPageTags = [];
    globalTheme = 'basic';
    hidePageNumbers = false;
    enablePageFold = true;
    showHeaderWhenFoldOff = false;
    dividerStyle = 'line';
    dividerCustomText = '';
    fontFamily = 'Pretendard';
    textSpacing = {
        fontSize: 14.2,
        lineHeight: 1.7,
        letterSpacing: -0.5,
        paragraphSpacing: 10,
        textIndent: 0
    };

    // ── 체크박스 초기화 ──
    const checkboxIds = [
        'useRoundedQuotes', 'useTextIndent', 'preserveLineBreaks', 'enableTopSection',
        'enableCover', 'coverAutoFit', 'enableProfiles',
        'enableTags', 'enableComment', 'hidePageNumbers'
    ];
    checkboxIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = (id === 'coverAutoFit' || id === 'enableTags');
    });

    // enablePageFold는 기본값 true
    const enablePageFoldEl = document.getElementById('enablePageFold');
    if (enablePageFoldEl) enablePageFoldEl.checked = true;

    // showHeaderWhenFoldOff 기본값 false
    const resetShEl = document.getElementById('showHeaderWhenFoldOff');
    if (resetShEl) resetShEl.checked = false;

    const resetDsEl = document.getElementById('dividerStyle');
    const resetDcEl = document.getElementById('dividerCustomText');
    if (resetDsEl) resetDsEl.value = 'line';
    if (resetDcEl) { resetDcEl.value = ''; resetDcEl.style.display = 'none'; }

    // ── 텍스트 입력 초기화 ──
    const textInputIds = [
        'coverImage', 'coverTitle', 'coverSubtitle',
        'introText', 'summaryText',
        'soundtrackUrl', 'soundtrackTitle', 'soundtrackArtist',
        'commentText', 'commentNickname'
    ];
    textInputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // coverArchiveNo 기본값 복원
    const coverArchiveNoEl = document.getElementById('coverArchiveNo');
    if (coverArchiveNoEl) coverArchiveNoEl.value = 'ARCHIVE NO.001';

    // ── 폰트 초기화 ──
    const fontFamilyEl = document.getElementById('fontFamily');
    if (fontFamilyEl) fontFamilyEl.value = 'Pretendard';

    // ── 텍스트 간격 슬라이더/입력 초기화 ──
    const spacingDefaults = {
        textSizeInput: 14.2,   textSizeSlider: 14.2,
        lineHeightInput: 1.7,  lineHeightSlider: 1.7,
        letterSpacingInput: -0.5, letterSpacingSlider: -0.5,
        paragraphSpacingInput: 10, paragraphSpacingSlider: 10,
        textIndentInput: 0,    textIndentSlider: 0
    };
    Object.entries(spacingDefaults).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    });

    // ── 전역 테마 초기화 ──
    const globalThemeEl = document.getElementById('globalTheme');
    if (globalThemeEl) globalThemeEl.value = 'basic';

    // ── UI 목록 갱신 ──
    updatePagesList();
    updateTagsList();
    updateReplacementsList();
    updateProfilesList();

    // 인트로/커버 섹션 숨김
    const topSectionContent = document.getElementById('topSectionContent');
    if (topSectionContent) topSectionContent.style.display = 'none';
    const coverContent = document.getElementById('coverContent');
    if (coverContent) coverContent.style.display = 'none';
    const profileInputs = document.getElementById('profileInputs');
    if (profileInputs) profileInputs.style.display = 'none';
    const commentContent = document.getElementById('commentContent');
    if (commentContent) commentContent.style.display = 'none';

    // ── localStorage에서 메인 데이터만 삭제 (프리셋·테마는 유지) ──
    localStorage.removeItem(STORAGE_KEY);

    // ── 미리보기 갱신 ──
    updatePreview();

    showNotification('초기화 완료! 프리셋과 테마는 유지됩니다.');
}

// 데이터를 JSON 파일로 내보내기
function exportDataToJSON() {
    try {
        // 프리셋 데이터 가져오기
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        const presets = savedPresets ? JSON.parse(savedPresets) : {};
        
        // 현재 상태를 JSON으로 저장
        const data = {
            useRoundedQuotes: document.getElementById('useRoundedQuotes').checked,
            useTextIndent: document.getElementById('useTextIndent').checked,
            preserveLineBreaks: document.getElementById('preserveLineBreaks').checked,
            enableTopSection: document.getElementById('enableTopSection').checked,
            enableCover: document.getElementById('enableCover').checked,
            coverImage: document.getElementById('coverImage').value,
            coverAutoFit: document.getElementById('coverAutoFit').checked,
            coverZoom: parseInt(document.getElementById('coverZoom').value),
            coverFocusX: parseInt(document.getElementById('coverFocusX').value),
            coverFocusY: parseInt(document.getElementById('coverFocusY').value),
            coverArchiveNo: document.getElementById('coverArchiveNo').value,
            coverTitle: document.getElementById('coverTitle').value,
            coverSubtitle: document.getElementById('coverSubtitle').value,
            enableProfiles: document.getElementById('enableProfiles').checked,
            introText: document.getElementById('introText').value,
            summaryText: document.getElementById('summaryText').value,
            soundtrackUrl: document.getElementById('soundtrackUrl').value,
            soundtrackTitle: document.getElementById('soundtrackTitle').value,
            soundtrackArtist: document.getElementById('soundtrackArtist').value,
            enableComment: document.getElementById('enableComment').checked,
            commentText: document.getElementById('commentText').value,
            commentNickname: document.getElementById('commentNickname').value,
            enableTags: document.getElementById('enableTags').checked,
            customColors: {
                bg: getColorValue('customBg'),
                text: getColorValue('customText'),
                em: getColorValue('customEm'),
                header: getColorValue('customHeader'),
                quote1Bg: getColorValue('customQuote1Bg'),
                quote1Text: getColorValue('customQuote1Text'),
                quote2Bg: getColorValue('customQuote2Bg'),
                quote2Text: getColorValue('customQuote2Text'),
                tagText: getColorValue('customTagText'),
                divider: getColorValue('customDivider')
            },
            pages: pages,
            tags: tags,
            replacements: replacements,
            customThemes: customThemes,
            profiles: profiles,
            textSpacing: textSpacing,
            fontFamily: fontFamily,
            globalTheme: globalTheme,
            hidePageNumbers: hidePageNumbers,
            enablePageFold: enablePageFold,
            showHeaderWhenFoldOff: showHeaderWhenFoldOff,
            dividerStyle: dividerStyle,
            dividerCustomText: dividerCustomText,
            headingFontSizes: headingFontSizes,
            presets: presets, // 프리셋 데이터 포함
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        // JSON 문자열로 변환
        const jsonStr = JSON.stringify(data, null, 2);

        // Blob 생성
        const blob = new Blob([jsonStr], { type: 'application/json' });

        // 다운로드 링크 생성
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 파일명: log-diary-backup-YYYY-MM-DD-HHMMSS.json
        const now = new Date();
        const dateStr = now.getFullYear() + '-' + 
                       String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(now.getDate()).padStart(2, '0') + '-' +
                       String(now.getHours()).padStart(2, '0') + 
                       String(now.getMinutes()).padStart(2, '0') + 
                       String(now.getSeconds()).padStart(2, '0');
        a.download = 'log-diary-backup-' + dateStr + '.json';
        
        // 다운로드 실행
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showNotification('데이터가 JSON 파일로 내보내졌습니다!');
    } catch (e) {
        console.error('Export failed:', e);
        showNotification('내보내기 실패: ' + e.message);
    }
}

// JSON 파일에서 데이터 불러오기
function importDataFromJSON(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 데이터 유효성 검사
            if (!data || typeof data !== 'object') {
                throw new Error('유효하지 않은 데이터 형식입니다.');
            }

            // 확인 대화상자
            if (!confirm('현재 작업 중인 데이터가 모두 사라집니다. 불러오시겠습니까?')) {
                return;
            }

            // 데이터 복원
            if (data.useRoundedQuotes !== undefined) document.getElementById('useRoundedQuotes').checked = data.useRoundedQuotes;
            if (data.useTextIndent !== undefined) document.getElementById('useTextIndent').checked = data.useTextIndent;
            if (data.preserveLineBreaks !== undefined) document.getElementById('preserveLineBreaks').checked = data.preserveLineBreaks;
            if (data.enableTopSection !== undefined) {
                document.getElementById('enableTopSection').checked = data.enableTopSection;
                document.getElementById('topSectionContent').style.display = data.enableTopSection ? 'block' : 'none';
            }
            
            if (data.enableCover !== undefined) {
                document.getElementById('enableCover').checked = data.enableCover;
                document.getElementById('coverContent').style.display = data.enableCover ? 'block' : 'none';
            }
            if (data.coverImage !== undefined) document.getElementById('coverImage').value = data.coverImage;
            if (data.coverAutoFit !== undefined) {
                document.getElementById('coverAutoFit').checked = data.coverAutoFit;
                const coverManualControls = document.getElementById('coverManualControls');
                if (coverManualControls) {
                    coverManualControls.style.display = data.coverAutoFit ? 'none' : 'block';
                }
            }
            if (data.coverZoom !== undefined) {
                document.getElementById('coverZoom').value = data.coverZoom;
                document.getElementById('coverZoomValue').textContent = data.coverZoom + '%';
            }
            if (data.coverFocusX !== undefined) {
                document.getElementById('coverFocusX').value = data.coverFocusX;
                document.getElementById('coverFocusXValue').textContent = data.coverFocusX + '%';
            }
            if (data.coverFocusY !== undefined) {
                document.getElementById('coverFocusY').value = data.coverFocusY;
                document.getElementById('coverFocusYValue').textContent = data.coverFocusY + '%';
            }
            if (data.coverArchiveNo !== undefined) document.getElementById('coverArchiveNo').value = data.coverArchiveNo;
            if (data.coverTitle !== undefined) document.getElementById('coverTitle').value = data.coverTitle;
            if (data.coverSubtitle !== undefined) document.getElementById('coverSubtitle').value = data.coverSubtitle;
            
            if (data.enableProfiles !== undefined) {
                document.getElementById('enableProfiles').checked = data.enableProfiles;
                document.getElementById('profileInputs').style.display = data.enableProfiles ? 'block' : 'none';
            }
            if (data.introText !== undefined) document.getElementById('introText').value = data.introText;
            if (data.summaryText !== undefined) document.getElementById('summaryText').value = data.summaryText;
            if (data.soundtrackUrl !== undefined) document.getElementById('soundtrackUrl').value = data.soundtrackUrl;
            if (data.soundtrackTitle !== undefined) document.getElementById('soundtrackTitle').value = data.soundtrackTitle;
            if (data.soundtrackArtist !== undefined) document.getElementById('soundtrackArtist').value = data.soundtrackArtist;
            
            if (data.enableComment !== undefined) {
                document.getElementById('enableComment').checked = data.enableComment;
                document.getElementById('commentContent').style.display = data.enableComment ? 'block' : 'none';
            }
            if (data.commentText !== undefined) document.getElementById('commentText').value = data.commentText;
            if (data.commentNickname !== undefined) document.getElementById('commentNickname').value = data.commentNickname;
            
            if (data.enableTags !== undefined) {
                document.getElementById('enableTags').checked = data.enableTags;
                document.getElementById('tagsInputs').style.display = data.enableTags ? 'block' : 'none';
            }

            // 커스텀 색상 복원
            if (data.customColors) {
                setColorInputValue('customBg', data.customColors.bg);
                setColorInputValue('customText', data.customColors.text);
                setColorInputValue('customEm', data.customColors.em);
                setColorInputValue('customHeader', data.customColors.header);
                setColorInputValue('customQuote1Bg', data.customColors.quote1Bg);
                setColorInputValue('customQuote1Text', data.customColors.quote1Text);
                setColorInputValue('customQuote2Bg', data.customColors.quote2Bg);
                setColorInputValue('customQuote2Text', data.customColors.quote2Text);
                setColorInputValue('customTagText', data.customColors.tagText);
                setColorInputValue('customDivider', data.customColors.divider);
            }

            // 배열 데이터 복원
            if (data.pages) pages = data.pages;
            if (data.tags) tags = data.tags;
            if (data.replacements) replacements = data.replacements;
            if (data.customThemes) customThemes = data.customThemes;
            if (data.profiles) profiles = data.profiles;

            // 텍스트 간격 복원
            if (data.textSpacing) {
                textSpacing = { ...textSpacing, ...data.textSpacing };
                const textSizeInput = document.getElementById('textSizeInput');
                const textSizeSlider = document.getElementById('textSizeSlider');
                const lineHeightInput = document.getElementById('lineHeightInput');
                const lineHeightSlider = document.getElementById('lineHeightSlider');
                const letterSpacingInput = document.getElementById('letterSpacingInput');
                const letterSpacingSlider = document.getElementById('letterSpacingSlider');
                const paragraphSpacingInput = document.getElementById('paragraphSpacingInput');
                const paragraphSpacingSlider = document.getElementById('paragraphSpacingSlider');
                const textIndentInput = document.getElementById('textIndentInput');
                const textIndentSlider = document.getElementById('textIndentSlider');

                if (textSizeInput) textSizeInput.value = textSpacing.fontSize;
                if (textSizeSlider) textSizeSlider.value = textSpacing.fontSize;
                if (lineHeightInput) lineHeightInput.value = textSpacing.lineHeight;
                if (lineHeightSlider) lineHeightSlider.value = textSpacing.lineHeight;
                if (letterSpacingInput) letterSpacingInput.value = textSpacing.letterSpacing;
                if (letterSpacingSlider) letterSpacingSlider.value = textSpacing.letterSpacing;
                if (paragraphSpacingInput) paragraphSpacingInput.value = textSpacing.paragraphSpacing;
                if (paragraphSpacingSlider) paragraphSpacingSlider.value = textSpacing.paragraphSpacing;
                if (textIndentInput) textIndentInput.value = textSpacing.textIndent;
                if (textIndentSlider) textIndentSlider.value = textSpacing.textIndent;
            }

            // 폰트 설정 복원
            if (data.fontFamily) {
                fontFamily = data.fontFamily;
                document.getElementById('fontFamily').value = fontFamily;
            }

            // 제목 크기 설정 복원
            if (data.headingFontSizes) {
                headingFontSizes = { ...headingFontSizes, ...data.headingFontSizes };
                const _hmap = {
                    coverArchiveNo:  { slider: 'coverArchiveNoSizeSlider',  input: 'coverArchiveNoSizeInput',  display: 'coverArchiveNoSizeDisplay' },
                    coverTitle:      { slider: 'coverTitleSizeSlider',      input: 'coverTitleSizeInput',      display: 'coverTitleSizeDisplay' },
                    coverSubtitle:   { slider: 'coverSubtitleSizeSlider',   input: 'coverSubtitleSizeInput',   display: 'coverSubtitleSizeDisplay' },
                    coverTag:        { slider: 'coverTagSizeSlider',        input: 'coverTagSizeInput',        display: 'coverTagSizeDisplay' },
                    sectionTitle:    { slider: 'sectionTitleSizeSlider',    input: 'sectionTitleSizeInput',    display: 'sectionTitleSizeDisplay' },
                    sectionSubtitle: { slider: 'sectionSubtitleSizeSlider', input: 'sectionSubtitleSizeInput', display: 'sectionSubtitleSizeDisplay' },
                    pageHeaderNum:   { slider: 'pageHeaderNumSizeSlider',   input: 'pageHeaderNumSizeInput',   display: 'pageHeaderNumSizeDisplay' },
                    pageHeaderTitle: { slider: 'pageHeaderTitleSizeSlider', input: 'pageHeaderTitleSizeInput', display: 'pageHeaderTitleSizeDisplay' },
                };
                Object.keys(headingFontSizes).forEach(k => {
                    if (!_hmap[k]) return;
                    const sl = document.getElementById(_hmap[k].slider);
                    const inp = document.getElementById(_hmap[k].input);
                    const dsp = document.getElementById(_hmap[k].display);
                    if (sl) sl.value = headingFontSizes[k];
                    if (inp) inp.value = headingFontSizes[k];
                    if (dsp) dsp.textContent = headingFontSizes[k] + 'px';
                });
            }

            // 전역 테마 복원
            if (data.globalTheme) {
                globalTheme = data.globalTheme;
                document.getElementById('globalTheme').value = globalTheme;
            }

            // 페이지 번호 숨김 복원
            if (data.hidePageNumbers !== undefined) {
                hidePageNumbers = data.hidePageNumbers;
                document.getElementById('hidePageNumbers').checked = hidePageNumbers;
            }

            // 페이지 접기 복원
            if (data.enablePageFold !== undefined) {
                enablePageFold = data.enablePageFold;
            } else {
                enablePageFold = true;
            }
            const importEnablePageFoldEl = document.getElementById('enablePageFold');
            if (importEnablePageFoldEl) importEnablePageFoldEl.checked = enablePageFold;

            showHeaderWhenFoldOff = data.showHeaderWhenFoldOff || false;
            const importShEl = document.getElementById('showHeaderWhenFoldOff');
            if (importShEl) importShEl.checked = showHeaderWhenFoldOff;

            dividerStyle = data.dividerStyle || 'line';
            dividerCustomText = data.dividerCustomText || '';
            const importDsEl = document.getElementById('dividerStyle');
            const importDcEl = document.getElementById('dividerCustomText');
            if (importDsEl) { importDsEl.value = dividerStyle; }
            if (importDcEl) { importDcEl.value = dividerCustomText; importDcEl.style.display = dividerStyle === 'custom' ? 'block' : 'none'; }

            // 프리셋 데이터 복원
            if (data.presets && typeof data.presets === 'object') {
                localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(data.presets));
                loadPresets(); // 프리셋 UI 업데이트
            }

            // UI 업데이트
            updateTagsList();
            updateReplacementsList();
            updatePagesList();
            updateCustomThemesList();
            updateProfilesList();
            updatePreview();
            saveToStorage();

            showNotification('데이터를 성공적으로 불러왔습니다!');
        } catch (e) {
            console.error('Import failed:', e);
            showNotification('불러오기 실패: ' + e.message);
        }
    };

    reader.onerror = function() {
        showNotification('파일 읽기 실패');
    };

    reader.readAsText(file);
}

function getTheme(type) {
    if (type === 'custom') {
        const headerColor = getColorValue('customHeader');
        return {
            bg: getColorValue('customBg'),
            text: getColorValue('customText'),
            em: getColorValue('customEm'),
            header: headerColor,
            headerText: headerColor,
            line: headerColor,
            quote1Bg: getColorValue('customQuote1Bg'),
            quote1Text: getColorValue('customQuote1Text'),
            quote2Bg: getColorValue('customQuote2Bg'),
            quote2Text: getColorValue('customQuote2Text'),
            tagText: getColorValue('customTagText') || getColorValue('customText'),
            divider: getColorValue('customDivider') || getColorValue('customTagText') || getColorValue('customText')
        };
    }
    if (type && type.startsWith('customTheme_')) {
        const index = parseInt(type.split('_')[1]);
        if (customThemes[index]) {
            return customThemes[index];
        }
    }
    if (STYLES[type]) return STYLES[type];
    return type === 'user' ? STYLES.light : STYLES.dark;
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 236, g: 236, b: 237 };
}

function applyReplacements(text) {
    let result = text;
    replacements.forEach(function (rep) {
        if (rep.from && rep.from.trim()) {
            const regex = new RegExp(escapeRegExp(rep.from), 'g');
            result = result.replace(regex, rep.to || '');
        }
    });
    return result;
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeImageUrl(url) {
    if (!url || !url.trim()) return '';
    const trimmed = url.trim();
    
    // // 로 시작하는 경우 https: 추가
    if (trimmed.startsWith('//')) {
        return 'https:' + trimmed;
    }
    
    // URL 그대로 반환 (폴백은 onerror에서 처리)
    return trimmed;
}

function parseText(text, themeStyle, skipIndent, reduceParagraphSpacing, imageWidth) {
    if (!text) return '';

    let processedText = applyReplacements(text);

    const useRoundedQuotes = document.getElementById('useRoundedQuotes').checked;
    const useTextIndent = document.getElementById('useTextIndent').checked;
    
    // 이미지 너비 설정 (기본값 100%)
    const imgWidth = imageWidth || 100;

    // 텍스트 간격 설정 적용
    const fontSize = textSpacing.fontSize + 'px';
    const lineHeight = textSpacing.lineHeight;
    const letterSpacing = textSpacing.letterSpacing + 'px';
    const paragraphSpacing = reduceParagraphSpacing ? '5px' : textSpacing.paragraphSpacing + 'px';
    // useTextIndent 체크 시 기본값 1em 적용, textIndent 값이 있으면 그 값 사용
    const indentValue = textSpacing.textIndent > 0 ? textSpacing.textIndent : 1;
    const indent = (useTextIndent && !skipIndent) ? indentValue + 'em' : '0';

    const textIndentStyle = indent !== '0' ? ' text-indent: ' + indent + ';' : '';
    const paragraphMargin = '0 0 ' + paragraphSpacing + ' 0';
    const pStyle = 'margin: ' + paragraphMargin + '; color: ' + themeStyle.text + '; line-height: ' + lineHeight + '; letter-spacing: ' + letterSpacing + '; font-size: ' + fontSize + ';' + textIndentStyle;
    const emStyle = 'font-style: italic; color: ' + themeStyle.em + ';';
    const q1Style = 'background-color: ' + themeStyle.quote1Bg + '; color: ' + themeStyle.quote1Text + '; padding: 0.05em 0.25em; border-radius: 2px; vertical-align: baseline; line-height: inherit;';
    const q1StyleNested = 'background-color: ' + themeStyle.quote1Bg + '; color: ' + themeStyle.quote1Text + '; padding: 0.05em 0.1em; border-radius: 2px; vertical-align: baseline; line-height: inherit;'; // 큰따옴표 안의 작은따옴표용
    const q2Style = 'background-color: ' + themeStyle.quote2Bg + '; color: ' + themeStyle.quote2Text + '; font-weight: 600; padding: 0.05em 0.25em; border-radius: 2px; vertical-align: baseline; line-height: inherit;';
    const footnoteStyle = 'font-size: 11px; color: ' + themeStyle.tagText + '; margin: -8px 0 10px 0; line-height: 1.4;';

    let detailsBlocks = [];
    let detailsCount = 0;

    // details 블록 내용을 처리하는 헬퍼 함수
    function processDetailsContent(content) {
        let result = content.trim();

        // 1. 먼저 따옴표 처리 (HTML 태그 생성 전에)
        const quotePlaceholders = [];
        let quoteIndex = 0;

        // ===== 단위 표현을 먼저 보호 =====
        const detailsUnitPlaceholders = [];
        let detailsUnitIndex = 0;
        
        result = result.replace(/(\d+)\s*['′]\s*(\d+)\s*["″]/g, function(m) {
            const ph = '{{DETAILS_UNIT_FULL_' + (detailsUnitIndex++) + '}}';
            detailsUnitPlaceholders.push(m);
            return ph;
        });
        result = result.replace(/(\d+)\s*['′]/g, function(m) {
            const ph = '{{DETAILS_UNIT_FEET_' + (detailsUnitIndex++) + '}}';
            detailsUnitPlaceholders.push(m);
            return ph;
        });

        if (useRoundedQuotes) {
            // 먼저 큰따옴표 안의 작은따옴표 처리
            result = result.replace(/\u201c([^\u201d]*)\u201d/g, function (match, content) {
                const innerProcessed = content.replace(/\u2018(.*?)\u2019/g, function (m, c) {
                    const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                    quotePlaceholders.push('<span style="' + q1Style + '">\u2018' + c + '\u2019</span>');
                    return ph;
                });
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q2Style + '">\u201c' + innerProcessed + '\u201d</span>');
                return ph;
            });
            // 남아있는 단독 작은따옴표 처리
            result = result.replace(/\u2018(.*?)\u2019/g, function (match, content) {
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q1Style + '">\u2018' + content + '\u2019</span>');
                return ph;
            });
            // 일반 큰따옴표 처리
            result = result.replace(/"([^"]*)"/g, function (match, content, offset) {
                if (offset > 0 && /\d/.test(result[offset - 1])) {
                    return match;
                }
                
                if (/^\d+['′]\s*\d*["″]?$/.test(content.trim())) {
                    return match;
                }
                
                const innerProcessed = content.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function (m, c) {
                    const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                    quotePlaceholders.push('<span style="' + q1StyleNested + '">\u2018' + c + '\u2019</span>');
                    return ph;
                });
                
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q2Style + '">\u201c' + innerProcessed + '\u201d</span>');
                return ph;
            });
            // 남아있는 단독 작은따옴표 처리
            result = result.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function (match, content, offset) {
                if (offset > 0 && /\d/.test(result[offset - 1])) {
                    return match;
                }
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q1Style + '">\u2018' + content + '\u2019</span>');
                return ph;
            });
        } else {
            // 먼저 큰따옴표 안의 작은따옴표 처리
            result = result.replace(/\u201c([^\u201d]*)\u201d/g, function (match, content) {
                const innerProcessed = content.replace(/\u2018(.*?)\u2019/g, function (m, c) {
                    const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                    quotePlaceholders.push('<span style="' + q1Style + '">\u2018' + c + '\u2019</span>');
                    return ph;
                });
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q2Style + '">"' + innerProcessed + '"</span>');
                return ph;
            });
            // 남아있는 단독 작은따옴표 처리
            result = result.replace(/\u2018(.*?)\u2019/g, function (match, content) {
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q1Style + '">\u2018' + content + '\u2019</span>');
                return ph;
            });
            // 일반 큰따옴표 처리
            result = result.replace(/"([^"]*)"/g, function (match, content, offset) {
                if (offset > 0 && /\d/.test(result[offset - 1])) {
                    return match;
                }
                
                if (/^\d+['′]\s*\d*["″]?$/.test(content.trim())) {
                    return match;
                }
                
                const innerProcessed = content.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function (m, c) {
                    const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                    quotePlaceholders.push('<span style="' + q1StyleNested + '">\'' + c + '\'</span>');
                    return ph;
                });
                
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q2Style + '">"' + innerProcessed + '"</span>');
                return ph;
            });
            // 남아있는 단독 작은따옴표 처리
            result = result.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function (match, content, offset) {
                if (offset > 0 && /\d/.test(result[offset - 1])) {
                    return match;
                }
                const ph = '{{QUOTE_PH_' + (quoteIndex++) + '}}';
                quotePlaceholders.push('<span style="' + q1Style + '">\'' + content + '\'</span>');
                return ph;
            });
        }

        // 2. 이탤릭 처리
        const italicPlaceholders = [];
        let italicIndex = 0;

        result = result.replace(/\*([^*]+)\*/g, function (match, content) {
            const ph = '{{ITALIC_PH_' + (italicIndex++) + '}}';
            italicPlaceholders.push('<em><span style="' + emStyle + '">' + content + '</span></em>');
            return ph;
        });

        // 3. 주석(FN) 처리
        let footnotes = [];
        let fnCount = 0;
        const fnPlaceholders = [];

        result = result.replace(/\[FN:([^\]]+)\]([^\[]*)\[\/FN\]/g, function (match, word, note) {
            fnCount++;
            const marker = '*'.repeat(fnCount);
            footnotes.push({ marker: marker, note: note.trim() });
            const ph = '{{FN_PH_' + (fnCount - 1) + '}}';
            fnPlaceholders.push(word + '<sup style="color:' + themeStyle.em + ';font-size:0.8em;">' + marker + '</sup>');
            return ph;
        });

        // 4. 모든 플레이스홀더를 실제 HTML로 교체 (역순으로 - 안쪽부터)
        for (let i = quotePlaceholders.length - 1; i >= 0; i--) {
            result = result.replace('{{QUOTE_PH_' + i + '}}', function () {
                return quotePlaceholders[i];
            });
        }

        for (let i = 0; i < italicPlaceholders.length; i++) {
            result = result.replace('{{ITALIC_PH_' + i + '}}', function () {
                return italicPlaceholders[i];
            });
        }

        for (let i = 0; i < fnPlaceholders.length; i++) {
            result = result.replace('{{FN_PH_' + i + '}}', function () {
                return fnPlaceholders[i];
            });
        }

        // 단위 플레이스홀더 복원
        for (let i = detailsUnitPlaceholders.length - 1; i >= 0; i--) {
            result = result.replace('{{DETAILS_UNIT_FULL_' + i + '}}', detailsUnitPlaceholders[i]);
            result = result.replace('{{DETAILS_UNIT_FEET_' + i + '}}', detailsUnitPlaceholders[i]);
        }

        // 줄바꿈 처리
        result = result.replace(/\n/g, '<br>');

        // 주석 추가 (접기 블록 전용 스타일)
        if (footnotes.length > 0) {
            const detailsFootnoteStyle = 'font-size: 11px; color: ' + themeStyle.tagText + '; margin: 0px -50px 10px -50px; padding: 0 50px; line-height: 1.4;';
            footnotes.forEach(function (fn) {
                result += '<div style="' + detailsFootnoteStyle + '"><span style="display: inline-block; vertical-align: middle; margin-right: 6px;">' + fn.marker + '</span>' + fn.note + '</div>';
            });
        }

        return result;
    }

    // [details] 태그 파싱 제거됨

    const lines = processedText.split('\n');
    let html = '';
    const preserveLineBreaks = document.getElementById('preserveLineBreaks') && document.getElementById('preserveLineBreaks').checked;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (!line.trim()) {
            if (preserveLineBreaks) {
                html += '<p style="margin: 0; line-height: ' + lineHeight + '; font-size: ' + fontSize + ';">&nbsp;</p>';
            }
            continue;
        }

        if (line.includes('[IMG:')) {
            const imgMatch = line.match(/\[IMG:([^\]]+)\]/);
            if (imgMatch) {
                const imgParts = imgMatch[1].split(':');
                const imageUrl = normalizeImageUrl(imgParts[0]);
                
                // 개별 이미지 너비 설정 (두 번째 파라미터) 또는 페이지 기본값 사용
                let individualWidth = imgWidth;
                if (imgParts.length > 1 && !isNaN(parseInt(imgParts[1]))) {
                    individualWidth = Math.max(30, Math.min(100, parseInt(imgParts[1])));
                }
                
                if (imageUrl) {
                    // 이미지 스타일: 개별 또는 페이지별 너비 설정 적용
                    const imgStyle = 'max-width: ' + individualWidth + '%; height: auto; border-radius: 15px; display: block; margin: 0 auto;';
                    
                    // 원본 URL 저장 (프록시 적용 전)
                    const originalUrl = imgParts[0].trim();
                    const needsProxy = originalUrl.includes('namu.la') || originalUrl.includes('arca.live');
                    
                    if (needsProxy) {
                        // 여러 프록시 옵션을 data 속성에 저장
                        const proxies = [
                            originalUrl,  // 먼저 원본 시도
                            'https://images.weserv.nl/?url=' + encodeURIComponent(originalUrl),
                            'https://api.allorigins.win/raw?url=' + encodeURIComponent(originalUrl)
                        ];
                        const proxyList = proxies.join('|');
                        
                        html += '<div style="text-align: center; margin: 20px 0;"><img src="' + imageUrl + '" style="' + imgStyle + '" data-original="' + originalUrl + '" data-proxies="' + proxyList + '" data-proxy-index="0" onerror="(function(img){var proxies=img.dataset.proxies.split(\'|\');var idx=parseInt(img.dataset.proxyIndex||0);if(idx<proxies.length-1){img.dataset.proxyIndex=idx+1;img.src=proxies[idx+1];}else{img.style.display=\'none\';};})(this)"></div>';
                    } else {
                        html += '<div style="text-align: center; margin: 20px 0;"><img src="' + imageUrl + '" style="' + imgStyle + '" onerror="this.style.display=\'none\'"></div>';
                    }
                }
                continue;
            }
        }

        if (line.trim().startsWith('{{DETAILS_BLOCK_')) {
            const block = detailsBlocks.find(b => b.placeholder === line.trim());
            if (block) {
                html += block.html;
                continue;
            }
        }

        if (line.trim() === '[HR]') {
            const hrColor = themeStyle.divider || themeStyle.tagText || themeStyle.header;
            const dividerContents = {
                line:     '<div style="width:30%;height:1px;background-color:' + hrColor + ';margin:20px auto;"></div>',
                fleuron:  '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">─── ❧ ───</div>',
                dots:     '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">· · · · · · ·</div>',
                stars:    '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">✦ ─── ✦ ─── ✦</div>',
                diamond:  '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">◇ ─ ◇ ─ ◇</div>',
                wave:     '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">〰〰〰〰〰</div>',
                cross:    '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">† ─── † ─── †</div>',
            };
            if (dividerStyle === 'custom' && dividerCustomText) {
                html += '<div style="text-align:center;margin:20px auto;color:' + hrColor + ';font-size:' + fontSize + ';">' + dividerCustomText + '</div>';
            } else {
                html += dividerContents[dividerStyle] || dividerContents.line;
            }
            continue;
        }

        let paragraphFootnotes = [];
        let footnoteCount = 0;

        line = line.replace(/\[FN:([^\]]+)\]([^\[]*)\[\/FN\]/g, function (match, word, note) {
            footnoteCount++;
            const marker = '*'.repeat(footnoteCount);
            paragraphFootnotes.push({ marker: marker, note: note.trim() });
            return word + '{{FOOTNOTE_' + footnoteCount + '}}';
        });

        let roundedQuotePairs = [];
        let pairIndex = 0;

        // 먼저 roundedQuote(\u201c\u201d, \u2018\u2019) 처리
        line = line.replace(/\u201c([^\u201d]*)\u201d/g, function (match, content) {
            // 큰따옴표 안의 작은따옴표를 먼저 찾아서 플레이스홀더로 변환
            const innerProcessed = content.replace(/\u2018(.*?)\u2019/g, function (m, c) {
                pairIndex++;
                roundedQuotePairs.push({ type: 'single', content: c });
                return '{{ROUND_QUOTE_' + pairIndex + '}}';
            });
            pairIndex++;
            roundedQuotePairs.push({ type: 'double', content: innerProcessed });
            return '{{ROUND_QUOTE_' + pairIndex + '}}';
        });

        // 남은 단독 작은따옴표 처리
        line = line.replace(/\u2018(.*?)(\u2019)(?=[^\w]|$)/g, function (match, content) {
            pairIndex++;
            roundedQuotePairs.push({ type: 'single', content: content });
            return '{{ROUND_QUOTE_' + pairIndex + '}}';
        });

        // ===== 핵심 변경: 단위 표현을 먼저 보호 =====
        const unitPlaceholders = [];
        let unitIndex = 0;
        
        // 단위 패턴 보호 (큰따옴표 매칭 전에 실행)
        line = line.replace(/(\d+)\s*['′]\s*(\d+)\s*["″]/g, function(m) {
            const ph = '{{UNIT_FULL_' + (unitIndex++) + '}}';
            unitPlaceholders.push(m);
            return ph;
        });
        line = line.replace(/(\d+)\s*['′]/g, function(m) {
            const ph = '{{UNIT_FEET_' + (unitIndex++) + '}}';
            unitPlaceholders.push(m);
            return ph;
        });

        if (useRoundedQuotes) {
            // 일반 큰따옴표 안의 작은따옴표 처리
            line = line.replace(/"([^"]*)"/g, function (match, content, offset) {
                // 숫자 바로 뒤의 " (인치 표시)는 이미 위에서 처리됨
                if (offset > 0 && /\d/.test(line[offset - 1])) {
                    return match;
                }
                
                // 내용 전체가 단위 표현인지 확인
                if (/^\d+['′]\s*\d*["″]?$/.test(content.trim())) {
                    return match;
                }
                
                // 작은따옴표 처리 - lookahead/lookbehind 사용
                const innerProcessed = content.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function (m, c) {
                    pairIndex++;
                    roundedQuotePairs.push({ type: 'single', content: c, nested: true }); // nested 플래그 추가
                    return '{{ROUND_QUOTE_' + pairIndex + '}}';
                });
                
                pairIndex++;
                roundedQuotePairs.push({ type: 'double', content: innerProcessed });
                return '{{ROUND_QUOTE_' + pairIndex + '}}';
            });
            // 남은 단독 작은따옴표 처리
            line = line.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function (match, content, offset) {
                if (offset > 0 && /\d/.test(line[offset - 1])) {
                    return match;
                }
                pairIndex++;
                roundedQuotePairs.push({ type: 'single', content: content });
                return '{{ROUND_QUOTE_' + pairIndex + '}}';
            });
        } else {
            // 일반 따옴표 모드
            line = line.replace(/"([^"]*)"/g, function (match, content, offset) {
                if (offset > 0 && /\d/.test(line[offset - 1])) {
                    return match;
                }
                
                if (/^\d+['′]\s*\d*["″]?$/.test(content.trim())) {
                    return match;
                }
                
                // 작은따옴표 처리 - nested에는 padding 없는 스타일 사용
                const innerProcessed = content.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function(m, c) {
                    return '<span style="' + q1StyleNested + '">\'' + c + '\'</span>';
                });
                
                return '<span style="' + q2Style + '">"' + innerProcessed + '"</span>';
            });
            line = line.replace(/(?<=[^\w\d]|^)'(.+?)'(?=[^\w\d]|$)/g, function(match, content, offset) {
                if (offset > 0 && /\d/.test(line[offset - 1])) {
                    return match;
                }
                return '<span style="' + q1Style + '">\'' + content + '\'</span>';
            });
        }

        // 플레이스홀더를 역순으로 복원 (안쪽부터 바깥쪽으로)
        for (let idx = roundedQuotePairs.length; idx >= 1; idx--) {
            const pair = roundedQuotePairs[idx - 1];
            if (pair.type === 'double') {
                line = line.replace('{{ROUND_QUOTE_' + idx + '}}', '<span style="' + q2Style + '">\u201c' + pair.content + '\u201d</span>');
            } else {
                // nested이면 padding 없는 스타일 사용
                const style = pair.nested ? q1StyleNested : q1Style;
                line = line.replace('{{ROUND_QUOTE_' + idx + '}}', '<span style="' + style + '">\u2018' + pair.content + '\u2019</span>');
            }
        }

        // 단위 플레이스홀더 복원
        for (let i = unitPlaceholders.length - 1; i >= 0; i--) {
            line = line.replace('{{UNIT_FULL_' + i + '}}', unitPlaceholders[i]);
            line = line.replace('{{UNIT_FEET_' + i + '}}', unitPlaceholders[i]);
        }

        // 볼드(**) 먼저 처리 — 내부에 *이탤릭* 중첩 허용
        line = line.replace(/\*\*([\s\S]+?)\*\*/g, function(match, inner) {
            const innerParsed = inner.replace(/\*([^*]+)\*/g, '<em><span style="' + emStyle + '">$1</span></em>');
            return '<strong style="font-weight:700; color:' + themeStyle.text + ';">' + innerParsed + '</strong>';
        });
        // 볼드 처리 후 남은 단독 이탤릭(*)
        line = line.replace(/\*([^*]+)\*/g, '<em><span style="' + emStyle + '">$1</span></em>');

        // ── 마크다운 헤딩 파싱 (#, ##, ###, ####) ──
        const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = headingMatch[2];
            const ff = fontFamily || 'Pretendard';
            const ffFallback = typeof getFontFallback === 'function' ? getFontFallback(ff) : 'sans-serif';
            const baseSize = (headingFontSizes && headingFontSizes.pageHeaderTitle) ? headingFontSizes.pageHeaderTitle : 20;
            const hColor = themeStyle.header || themeStyle.text;
            const subColor = themeStyle.tagText || themeStyle.text;
            // # → 가장 크고 굵게, #### → 본문보다 약간 크게
            const sizes = [baseSize * 1.3, baseSize * 1.05, baseSize * 0.88, baseSize * 0.76];
            const weights = ['800', '700', '600', '600'];
            const colors = [hColor, hColor, subColor, subColor];
            const idx = level - 1;

            // 이전/다음 줄이 헤딩인지 확인해서 margin 동적 결정
            const prevLine = i > 0 ? lines[i - 1] : '';
            const nextLine = i < lines.length - 1 ? lines[i + 1] : '';
            const prevIsHeading = /^#{1,4}\s+/.test(prevLine.trim());
            const nextIsHeading = /^#{1,4}\s+/.test(nextLine.trim());

            // 헤딩 그룹 첫 줄이면 위 여백 크게, 연속이면 위 여백 작게
            // 다음이 본문이면 아래 여백 크게, 다음도 헤딩이면 작게
            const marginTop = prevIsHeading ? '3px' : '20px';
            const marginBottom = nextIsHeading ? '1px' : '14px';

            // 헤딩 텍스트 앞 정렬 prefix 감지 (예: [|] 제목)
            const hAlignMatch = headingText.match(/^(\[<\]|\[\|\]|\[>\])\s*/);
            let hAlign = '';
            let hText = headingText;
            if (hAlignMatch) {
                const hAlignMap = { '[<]': 'left', '[|]': 'center', '[>]': 'right' };
                hAlign = hAlignMap[hAlignMatch[1]];
                hText = headingText.slice(hAlignMatch[0].length);
            }
            const hAlignStyle = hAlign ? ' text-align:' + hAlign + ';' : '';
            const hStyle = 'display:block; font-size:' + Math.round(sizes[idx]) + 'px; font-weight:' + weights[idx] + '; color:' + colors[idx] + '; font-family:\'' + ff + '\',' + ffFallback + '; line-height:1.35; margin:' + marginTop + ' 0 ' + marginBottom + '; letter-spacing:-0.2px;' + hAlignStyle;
            html += '<div style="' + hStyle + '">' + hText + '</div>';
            continue;
        }

        for (let j = 1; j <= footnoteCount; j++) {
            line = line.replace('{{FOOTNOTE_' + j + '}}', '<sup style="font-size: 0.7em;">' + '*'.repeat(j) + '</sup>');
        }

        // ── 정렬 prefix 파싱 ([<] 좌측 / [|] 가운데 / [>] 우측) ──
        let textAlign = '';
        const alignMatch = line.match(/^\[(<|\||\>)\]\s*/);
        if (alignMatch) {
            const alignMap = { '<': 'left', '|': 'center', '>': 'right' };
            textAlign = alignMap[alignMatch[1]];
            line = line.slice(alignMatch[0].length);
        }
        const alignedPStyle = textAlign ? pStyle + ' text-align:' + textAlign + ';' : pStyle;

        html += '<p style="' + alignedPStyle + '">' + line + '</p>';

        if (paragraphFootnotes.length > 0) {
            for (let k = 0; k < paragraphFootnotes.length; k++) {
                html += '<p style="' + footnoteStyle + '"><span style="vertical-align: middle; margin-right: 2px;">' + paragraphFootnotes[k].marker + '</span>' + paragraphFootnotes[k].note + '</p>';
            }
        }
    }

    return html;
}

function createHeader(text, themeStyle, headerImage, headerFocusX, headerFocusY) {
    // Parse header text to extract number, title, and subtitle
    let pageNum = '';
    let pageTitle = '';
    let pageSubtitle = '';

    const parts = text.split(' - ');
    const titlePart = parts[0]; // "#1 Title" or just "#1"
    if (parts.length > 1) {
        pageSubtitle = parts.slice(1).join(' - '); // Everything after first " - "
    }

    // Extract number and title from first part
    const numMatch = titlePart.match(/^(#\d+)\s*(.*)/);
    if (numMatch) {
        pageNum = numMatch[1]; // "#1"
        pageTitle = numMatch[2]; // "Title" or empty
    } else {
        pageTitle = titlePart;
    }

    // 표지 이미지 유무에 따른 색상 결정
    const hasHeaderImage = headerImage && typeof headerImage === 'string' && headerImage.trim();
    const numberColor = hasHeaderImage ? '#ffffff' : themeStyle.header;
    const titleColor = hasHeaderImage ? '#ffffff' : themeStyle.header;
    const subtitleColor = hasHeaderImage ? 'rgba(255, 255, 255, 0.85)' : (themeStyle.tagText || themeStyle.text);

    // Create layout: number on left (large), title/subtitle on right
    let headerHtml = '';

    // hidePageNumbers가 true면 번호를 표시하지 않음
    if (pageNum && !hidePageNumbers) {
        // Layout with number - display:table로 flex 대체 (아카라이브 등 환경 호환)
        headerHtml += '<div style="display: table; width: 100%; padding: clamp(15px, 3vw, 20px) 0;">';
        headerHtml += '<div style="display: table-cell; vertical-align: middle; width: 1%; white-space: nowrap; padding-left: clamp(30px, 5vw, 50px); padding-right: clamp(20px, 3vw, 30px);">';
        headerHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.pageHeaderNum) + '; font-weight: 700; color: ' + numberColor + '; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1; white-space: nowrap;">' + pageNum.replace('#', '') + '</div>';
        headerHtml += '</div>';
        headerHtml += '<div style="display: table-cell; vertical-align: middle;">';
        if (pageTitle) {
            const titleMargin = pageSubtitle ? ' margin-bottom: 4px;' : '';
            headerHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.pageHeaderTitle) + '; font-weight: 700; color: ' + titleColor + ';' + titleMargin + ' font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1.3;">' + pageTitle + '</div>';
        }
        if (pageSubtitle) {
            headerHtml += '<div style="font-size: ' + pxToClamp(Math.round(headingFontSizes.pageHeaderTitle * 0.8)) + '; color: ' + subtitleColor + '; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1.4;">' + pageSubtitle + '</div>';
        }
        headerHtml += '</div>';
        headerHtml += '</div>';
    } else if (hidePageNumbers && (pageTitle || pageSubtitle)) {
        // 번호 숨김이지만 제목이나 부제목이 있는 경우
        if (pageTitle && !pageSubtitle) {
            // 제목만 있고 부제목 없음 - display:table로 세로 중앙정렬
            const headerHeight = 'clamp(60px, 10vw, 80px)';
            headerHtml += '<div style="display: table; width: 100%; height: ' + headerHeight + ';">';
            headerHtml += '<div style="display: table-cell; vertical-align: middle; padding-left: clamp(30px, 5vw, 50px); padding-right: clamp(30px, 5vw, 50px);">';
            headerHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.pageHeaderTitle) + '; font-weight: 700; color: ' + titleColor + '; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1.3;">' + pageTitle + '</div>';
            headerHtml += '</div>';
            headerHtml += '</div>';
        } else {
            // 제목 + 부제목 둘 다 있는 경우 - 기존 방식 유지
            headerHtml += '<div style="padding: clamp(15px, 3vw, 20px) clamp(30px, 5vw, 50px);">';
            if (pageTitle) {
                headerHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.pageHeaderTitle) + '; font-weight: 700; color: ' + titleColor + '; margin-bottom: 4px; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1.3;">' + pageTitle + '</div>';
            }
            if (pageSubtitle) {
                headerHtml += '<div style="font-size: ' + pxToClamp(Math.round(headingFontSizes.pageHeaderTitle * 0.8)) + '; color: ' + subtitleColor + '; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1.4;">' + pageSubtitle + '</div>';
            }
            headerHtml += '</div>';
        }
    } else if (hidePageNumbers && pageNum) {
        // 번호 숨김이고 제목/부제목이 없는 경우 - "Page n" 표시 (좌측 정렬)
        const pageNumber = pageNum.replace('#', '');
        headerHtml += '<div style="padding: clamp(15px, 3vw, 20px) clamp(30px, 5vw, 50px);">';
        headerHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.pageHeaderTitle) + '; font-weight: 700; color: ' + titleColor + '; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; line-height: 1.3;">Page ' + pageNumber + '</div>';
        headerHtml += '</div>';
    } else {
        // Fallback to centered layout if no number
        const displayContent = text ? text.toUpperCase() : '';
        const headerStyle = 'text-align: center; font-size: ' + pxToClamp(headingFontSizes.pageHeaderTitle) + '; letter-spacing: clamp(2px, 0.5vw, 4px); font-weight: 600; color: ' + titleColor + '; margin-bottom: 0; padding: clamp(15px, 3vw, 20px) 0; line-height: 1; white-space: nowrap;';
        const lineStyle = 'display: inline-block; width: clamp(25px, 5vw, 40px); height: 0px; border-top: 1px solid ' + titleColor + '; vertical-align: middle; font-size: 0px; line-height: 0px;';
        const textWrapperStyle = 'display: inline-block; margin: 0 clamp(10px, 2vw, 15px); vertical-align: middle;';

        headerHtml = '<div style="' + headerStyle + '">' +
            '<span style="' + lineStyle + '">&nbsp;</span>' +
            '<span style="' + textWrapperStyle + '">' + displayContent + '</span>' +
            '<span style="' + lineStyle + '">&nbsp;</span>' +
            '</div>';
    }

    // 헤더 띠지 이미지가 있으면 추가
    if (hasHeaderImage) {
        const focusX = headerFocusX || 50;
        const focusY = headerFocusY || 50;
        const bannerStyle = 'width: calc(100% + clamp(30px, 6vw, 60px)); margin: 0 -' + 'clamp(15px, 3vw, 30px)' + '; height: 100px; background: url(\'' + headerImage + '\') ' + focusX + '% ' + focusY + '% / cover no-repeat; margin-bottom: 20px; margin-top: -20px;';
        headerHtml += '<div style="' + bannerStyle + '"></div>';
    }

    return headerHtml;
}

function createCreditFooter() {
    // 컨테이너 바깥에 독립적으로 표시되는 크레딧
    return '<div style="text-align: center; padding: clamp(15px, 3vw, 20px) 0; font-size: clamp(9px, 1.5vw, 10px); color: #999999; max-width: 900px; margin: clamp(5px, 1vw, 10px) auto 0;">Template by <a href="https://arca.live/b/characterai/161701867" style="color: #999999; text-decoration: none;">Log Diary</a></div>';
}

function createCommentSection(commentText, commentNickname, themeStyle) {
    let commentHtml = '';

    // 컨테이너 스타일 (다른 섹션과 통일)
    const containerStyle = 'box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width: 900px; margin: 5px auto; border-radius: 1rem; background-color: ' + themeStyle.bg + '; padding: clamp(20px, 4vw, 30px) 0; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; font-size: clamp(13px, 2.3vw, 14.2px);';

    commentHtml += '<div style="' + containerStyle + '">';

    // COMMENT 헤더
    commentHtml += '<div style="padding: 0 clamp(30px, 5vw, 50px) clamp(10px, 2vw, 15px) clamp(30px, 5vw, 50px); text-align: center;">';
    commentHtml += '<span style="display: inline-block; font-size: clamp(10px, 1.8vw, 12px); font-weight: 600; letter-spacing: clamp(1.5px, 0.3vw, 2px); color: ' + themeStyle.headerText + '; text-transform: uppercase; border-bottom: 1px solid ' + themeStyle.headerText + '; padding-bottom: 5px; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">Comment</span>';
    commentHtml += '</div>';

    // 코멘트 내용
    commentHtml += '<div style="padding: 0 clamp(30px, 5vw, 50px);">' + parseText(commentText, themeStyle, true, true) + '</div>';

    // 닉네임과 날짜
    const today = new Date();
    const dateStr = today.getFullYear() + '.' + String(today.getMonth() + 1).padStart(2, '0') + '.' + String(today.getDate()).padStart(2, '0');

    commentHtml += '<div style="text-align: right; padding: clamp(10px, 2vw, 15px) clamp(30px, 5vw, 50px) 0 clamp(30px, 5vw, 50px); font-size: clamp(9px, 1.5vw, 10px); color: ' + (themeStyle.tagText || themeStyle.text) + '; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">';

    if (commentNickname && commentNickname.trim()) {
        commentHtml += 'BY ' + commentNickname + ' • ' + dateStr;
    } else {
        commentHtml += dateStr;
    }

    commentHtml += '</div>';

    commentHtml += '</div>';

    return commentHtml;
}

function createSoundtrackSection(youtubeUrl, songTitle, artistName, themeStyle, isPreview) {
    // YouTube URL을 embed 형식으로 변환
    let videoId = '';

    // 다양한 유튜브 URL 형식 지원
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\/\s]+)/,
        /youtube\.com\/.*[?&]v=([^&?\/\s]+)/
    ];

    for (let pattern of patterns) {
        const match = youtubeUrl.match(pattern);
        if (match && match[1]) {
            videoId = match[1];
            break;
        }
    }

    if (!videoId) {
        return ''; // 유효한 YouTube URL이 아니면 빈 문자열 반환
    }

    const embedUrl = 'https://www.youtube.com/embed/' + videoId;
    const thumbnailUrl = 'https://img.youtube.com/vi/' + videoId + '/hqdefault.jpg';

    let html = '';

    // 상단 여백
    html += '<div style="padding-top: clamp(20px, 4vw, 30px);"></div>';

    // SOUNDTRACK 헤더
    html += '<div style="text-align: center; padding-bottom: clamp(15px, 3vw, 20px);">';
    html += '<span style="display: inline-block; font-size: clamp(11px, 2vw, 13px); font-weight: 600; letter-spacing: clamp(1.5px, 0.3vw, 2px); color: ' + themeStyle.headerText + '; text-transform: uppercase; border-bottom: 1px solid ' + themeStyle.headerText + '; padding-bottom: 5px; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">Soundtrack</span>';
    html += '</div>';

    // 뮤직플레이어 컨테이너
    html += '<div style="text-align: center; padding: 0 clamp(20px, 5vw, 40px) clamp(25px, 4vw, 35px);">';

    // YouTube 영상 - 정사각형 300x300 (미리보기에선 썸네일, 복사 시 iframe)
    html += '<div style="max-width: 300px; margin: 0 auto;">';
    if (isPreview) {
        // 미리보기: YouTube 썸네일 이미지 + 재생 버튼 오버레이
        html += '<div style="width: 300px; height: 300px; background: #000 url(\'' + thumbnailUrl + '\') center center / cover no-repeat; border-radius: 4px;">';
        html += '<div style="display: table; width: 100%; height: 100%;">';
        html += '<div style="display: table-cell; vertical-align: middle; text-align: center;">';
        html += '<div style="width: 60px; height: 60px; margin: 0 auto; background: rgba(255,0,0,0.9); border-radius: 12px;">';
        html += '<div style="display: table; width: 100%; height: 100%;">';
        html += '<div style="display: table-cell; vertical-align: middle; text-align: center;">';
        html += '<div style="display: inline-block; width: 0; height: 0; border-top: 12px solid transparent; border-bottom: 12px solid transparent; border-left: 18px solid #fff; margin-left: 4px;"></div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    } else {
        // 복사용: iframe
        html += '<iframe src="' + embedUrl + '" width="300" height="300" allowfullscreen="true"></iframe>';
    }
    html += '</div>';

    // 노래 제목과 아티스트 표시 (미디어 버튼 위)
    if (songTitle || artistName) {
        html += '<div style="max-width: 300px; margin: clamp(12px, 2.5vw, 18px) auto 0; text-align: center;">';
        if (songTitle) {
            html += '<div style="font-size: clamp(13px, 2.5vw, 15px); font-weight: 600; color: ' + (themeStyle.header || themeStyle.text) + '; line-height: 1.4; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">' + songTitle + '</div>';
        }
        if (artistName) {
            html += '<div style="font-size: clamp(11px, 2vw, 12px); color: ' + (themeStyle.tagText || '#888') + '; margin-top: 4px; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">' + artistName + '</div>';
        }
        html += '</div>';
    }

    // 미디어 컨트롤 버튼 장식 (CSS border로 삼각형 구현)
    html += '<div style="max-width: 200px; margin: clamp(15px, 3vw, 22px) auto 0;">';
    html += '<div style="display: table; width: 100%;">';

    // 이전 버튼 (◀◀) - CSS 삼각형 2개
    html += '<div style="display: table-cell; width: 33%; text-align: center; vertical-align: middle;">';
    html += '<div style="display: inline-block; width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 8px solid ' + (themeStyle.tagText || '#888') + ';"></div>';
    html += '<div style="display: inline-block; width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-right: 8px solid ' + (themeStyle.tagText || '#888') + '; margin-left: 2px;"></div>';
    html += '</div>';

    // 재생 버튼 (▶) - CSS 삼각형
    html += '<div style="display: table-cell; width: 34%; text-align: center; vertical-align: middle;">';
    html += '<div style="display: inline-block; width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-left: 14px solid ' + (themeStyle.em || themeStyle.header) + ';"></div>';
    html += '</div>';

    // 다음 버튼 (▶▶) - CSS 삼각형 2개
    html += '<div style="display: table-cell; width: 33%; text-align: center; vertical-align: middle;">';
    html += '<div style="display: inline-block; width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 8px solid ' + (themeStyle.tagText || '#888') + ';"></div>';
    html += '<div style="display: inline-block; width: 0; height: 0; border-top: 6px solid transparent; border-bottom: 6px solid transparent; border-left: 8px solid ' + (themeStyle.tagText || '#888') + '; margin-left: 2px;"></div>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    html += '</div>'; // 뮤직플레이어 컨테이너 끝

    return html;
}






function createContainer(content, type, bgImage, isCollapsed, headerHtml, tagsHtml, hasTopImage, noBottomPadding) {
    const theme = getTheme(globalTheme);

    // hasTopImage가 true면 상단 패딩 0, 아니면 하단과 동일하게
    const topPadding = hasTopImage ? '0' : 'clamp(20px, 4vw, 30px)';
    const bottomPadding = noBottomPadding ? '0' : 'clamp(20px, 4vw, 30px)';
    const overflowStyle = noBottomPadding ? 'overflow:hidden;' : '';
    let containerStyle = 'box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width: 900px; margin: 5px auto; border-radius: 1rem; background-color: ' + theme.bg + '; padding: ' + topPadding + ' 0 ' + bottomPadding + ' 0; ' + overflowStyle + 'font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; font-size: clamp(13px, 2.3vw, 14.2px);';

    if (bgImage) {
        const normalizedBgImage = normalizeImageUrl(bgImage);
        const rgb = hexToRgb(theme.bg);
        containerStyle = 'box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width: 900px; margin: 5px auto; padding: clamp(15px, 3vw, 30px); border-radius: 1rem; background-image: url(\'' + normalizedBgImage + '\'); background-size: cover; background-position: center; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; font-size: clamp(13px, 2.3vw, 14.2px);';

        if (isCollapsed && headerHtml) {
            const headerInBg = '<div style="padding: clamp(15px, 3vw, 20px) 0;">' + headerHtml.replace('margin-bottom: 20px; padding-top: 20px;', 'margin: 0; padding: 0;') + '</div>';
            content = '<div style="background-color: rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.85); padding: 0; border-radius: 1rem; margin-top: clamp(15px, 3vw, 20px);">' + content + '</div>';
            if (tagsHtml) content += tagsHtml;

            const summaryStyle = 'cursor: pointer; list-style: none; outline: none; color: inherit; font-weight: normal;';

            let detailsHtml = '<details style="' + containerStyle + '">';
            detailsHtml += '<summary style="' + summaryStyle + '">';
            detailsHtml += headerInBg;
            detailsHtml += '</summary>';
            detailsHtml += content;
            detailsHtml += '</details>';
            return detailsHtml;
        } else {
            if (headerHtml) {
                const headerInBg = '<div style="padding: clamp(15px, 3vw, 20px) 0;">' + headerHtml.replace('margin-bottom: 20px; padding-top: 20px;', 'margin: 0; padding: 0;') + '</div>';
                const contentWithoutHeader = content.replace(headerHtml, '').replace('<div style="margin-bottom: 20px;"></div>', '');
                content = headerInBg + '<div style="background-color: rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.85); padding: 0; border-radius: 8px; margin-top: clamp(15px, 3vw, 20px);">' + contentWithoutHeader + '</div>';
                if (tagsHtml) content += tagsHtml;
            } else {
                content = '<div style="background-color: rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.85); padding: 0; border-radius: 8px;">' + content + '</div>';
                if (tagsHtml) content += tagsHtml;
            }
        }
    }

    if (isCollapsed && headerHtml) {
        const collapsedHeaderHtml = headerHtml.replace('margin-bottom: 20px; padding-top: 20px;', 'margin: 0; padding: clamp(15px, 3vw, 20px) 0 clamp(15px, 3vw, 20px) 0;');
        const summaryStyle = 'cursor: pointer; list-style: none; outline: none; color: inherit; font-weight: normal;';

        // 화살표 추가
        const arrowWrapperStart = '<div style="width: 100%; display: table;"><div style="display: table-row;"><div style="display: table-cell; vertical-align: middle;">';
        const arrowWrapperMid = '</div><div style="display: table-cell; vertical-align: middle; width: clamp(50px, 10vw, 70px); text-align: right; padding-right: clamp(30px, 5vw, 50px);"><span style="font-size: ' + pxToClamp(headingFontSizes.sectionTitle) + '; color: ' + theme.tagText + ';">⌵</span></div></div></div>';
        const summaryContent = arrowWrapperStart + collapsedHeaderHtml + arrowWrapperMid;

        let detailsHtml = '<details style="' + containerStyle + '">';
        detailsHtml += '<summary style="' + summaryStyle + '">';
        detailsHtml += summaryContent;
        detailsHtml += '</summary>';
        detailsHtml += content;
        detailsHtml += '</details>';
        return detailsHtml;
    }

    // 단독 페이지 처리 (섹션 없을 때)
    if (headerHtml) {
        // 화살표로 감싼 header 생성
        const arrowWrapperStart = '<div style="width: 100%; display: table;"><div style="display: table-row;"><div style="display: table-cell; vertical-align: middle;">';
        const arrowWrapperMid = '</div><div style="display: table-cell; vertical-align: middle; width: clamp(50px, 10vw, 70px); text-align: right; padding-right: clamp(30px, 5vw, 50px);"><span style="font-size: ' + pxToClamp(headingFontSizes.sectionTitle) + '; color: ' + theme.tagText + ';">⌵</span></div></div></div>';

        const headerWithArrow = arrowWrapperStart + headerHtml + arrowWrapperMid;

        return '<div style="' + containerStyle + '">' + headerWithArrow + content + '</div>';
    }

    return '<div style="' + containerStyle + '">' + content + '</div>';
}

function updateTagsList() {
    const tagsList = document.getElementById('tagsList');
    if (!tagsList) return;

    tagsList.innerHTML = '';

    tags.forEach(function (tag, index) {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-edit-item';
        // Grid 구조: 값(Input) | 링크(Input) | 삭제(Btn) - Name 필드 제거
        tagItem.innerHTML =
            '<input type="text" class="tag-value-input" placeholder="태그 텍스트" value="' + (tag.value || '') + '" data-index="' + index + '" data-field="value">' +
            '<input type="text" class="tag-link-input" placeholder="링크 (선택)" value="' + (tag.link || '') + '" data-index="' + index + '" data-field="link">' +
            '<button class="btn-delete-item" data-index="' + index + '" title="삭제">×</button>';
        tagsList.appendChild(tagItem);
    });

    tagsList.querySelectorAll('.tag-value-input, .tag-link-input').forEach(function (input) {
        input.addEventListener('input', function (e) {
            const idx = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            tags[idx][field] = e.target.value;
            updatePreview();
            saveToStorage();
        });
    });

    tagsList.querySelectorAll('.btn-delete-item').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const idx = parseInt(e.target.dataset.index);
            tags.splice(idx, 1);
            updateTagsList();
            updatePreview();
            saveToStorage();
        });
    });
}

function updatePageTagsList() {
    const list = document.getElementById('pageTagsList');
    if (!list) return;

    list.innerHTML = '';

    tempPageTags.forEach(function (tag, index) {
        const tagItem = document.createElement('div');
        tagItem.className = 'tag-edit-item'; // CSS Grid 스타일 적용됨

        // 디자인 통일: Label | Value | Link | Delete(Icon)
        tagItem.innerHTML =
            '<div class="tag-label-static" title="' + (tag.name || 'Tag') + '">' + (tag.name || 'Tag') + '</div>' +
            '<input type="text" class="tag-value-input" placeholder="값 (Value)" value="' + (tag.value || '') + '" data-index="' + index + '" data-field="value">' +
            '<input type="text" class="tag-link-input" placeholder="링크 (선택)" value="' + (tag.link || '') + '" data-index="' + index + '" data-field="link">' +
            '<button class="btn-delete-tag" data-index="' + index + '" title="삭제">×</button>'; // 클래스명 btn-delete-tag 사용 (CSS에서 스타일 통합됨)

        list.appendChild(tagItem);
    });

    // 입력 이벤트 리스너
    list.querySelectorAll('.tag-value-input, .tag-link-input').forEach(function (input) {
        input.addEventListener('input', function (e) {
            const idx = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            tempPageTags[idx][field] = e.target.value;
        });
    });

    // 삭제 버튼 이벤트 리스너
    list.querySelectorAll('.btn-delete-tag').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const idx = parseInt(e.target.dataset.index);
            tempPageTags.splice(idx, 1);
            updatePageTagsList();
        });
    });
}

function updateProfilesList() {
    const profilesList = document.getElementById('profilesList');
    if (!profilesList) return;

    profilesList.innerHTML = '';

    profiles.forEach(function (profile, index) {
        const profileSection = document.createElement('div');
        profileSection.className = 'profile-section';

        const focusXId = 'profile' + index + 'FocusX';
        const focusYId = 'profile' + index + 'FocusY';
        const focusXValueId = 'profile' + index + 'FocusXValue';
        const focusYValueId = 'profile' + index + 'FocusYValue';
        const zoomId = 'profile' + index + 'Zoom';
        const zoomValueId = 'profile' + index + 'ZoomValue';

        // [수정됨] 페이지 목록(page-controls) 스타일을 그대로 차용
        profileSection.innerHTML =
            '<div class="profile-header">' +
            '<span class="profile-title">PROFILE #' + (index + 1) + '</span>' +
            '<div class="page-controls">' + // page-controls 클래스 재사용
            '<button class="btn-move btn-profile-move-up" data-index="' + index + '" title="위로">▲</button>' +
            '<button class="btn-move btn-profile-move-down" data-index="' + index + '" title="아래로">▼</button>' +
            '<button class="btn-profile-delete" data-index="' + index + '" title="프로필 삭제">×</button>' +
            '</div>' +
            '</div>' +
            '<div class="input-group">' +
            '<label>이름 (Name)</label>' +
            '<input type="text" class="profile-name-input" placeholder="캐릭터 이름" value="' + (profile.name || '') + '" data-index="' + index + '">' +
            '</div>' +
            '<div class="input-group">' +
            '<label>이미지 URL' +
            '<span class="image-url-tooltip">' +
            '<span class="tooltip-icon">?</span>' +
            '<span class="tooltip-text">//ac.namu.la/~ 형식의 링크 사용을 권장합니다. 아카라이브 글쓰기에서 원하는 이미지를 삽입한 후 \'코드보기\'에서 확인할 수 있는 부분을 붙여넣기 해주세요.</span>' +
            '</span>' +
            '</label>' +
            '<input type="text" class="profile-image-input" placeholder="https://..." value="' + (profile.imageUrl || '') + '" data-index="' + index + '">' +
            '</div>' +
            '<div class="input-group">' +
            '<label>Zoom <span id="' + zoomValueId + '" style="color:var(--accent-blue);">' + (profile.zoom || 100) + '%</span></label>' +
            '<input type="range" id="' + zoomId + '" class="profile-zoom-input spacing-slider" min="100" max="300" value="' + (profile.zoom || 100) + '" data-index="' + index + '" style="width: 100%;">' +
            '</div>' +
            '<div class="input-group">' +
            '<label>Focus X (좌우) <span id="' + focusXValueId + '" style="color:var(--accent-blue);">' + (profile.focusX || 50) + '%</span></label>' +
            '<input type="range" id="' + focusXId + '" class="profile-focusx-input spacing-slider" min="0" max="100" value="' + (profile.focusX || 50) + '" data-index="' + index + '" style="width: 100%;">' +
            '</div>' +
            '<div class="input-group">' +
            '<label>Focus Y (상하) <span id="' + focusYValueId + '" style="color:var(--accent-blue);">' + (profile.focusY || 30) + '%</span></label>' +
            '<input type="range" id="' + focusYId + '" class="profile-focusy-input spacing-slider" min="0" max="100" value="' + (profile.focusY || 30) + '" data-index="' + index + '" style="width: 100%;">' +
            '</div>' +
            '<div class="input-group">' +
            '<label>소개글 (Description)</label>' +
            '<textarea class="profile-desc-input" rows="3" placeholder="소개 내용..." data-index="' + index + '">' + (profile.desc || '') + '</textarea>' +
            '</div>' +
            '<div class="input-group">' +
            '<label>인물 태그</label>' +
            '<div class="select-wrapper">' +
            '<select class="profile-tag-input" data-index="' + index + '">' +
            '<option value="" ' + (!profile.tag ? 'selected' : '') + '>(태그 없음)</option>' +
            '<option value="USER" ' + (profile.tag === 'USER' ? 'selected' : '') + '>USER</option>' +
            '<option value="CHAR" ' + (profile.tag === 'CHAR' ? 'selected' : '') + '>CHAR</option>' +
            '</select>' +
            '</div>' +
            '</div>';

        profilesList.appendChild(profileSection);
    });

    attachProfileEvents(profilesList);
}




// 편의를 위해 이벤트 연결 로직 분리 (updateProfilesList 안에서 호출)
function attachProfileEvents(profilesList) {
    profilesList.querySelectorAll('.profile-name-input').forEach(input => {
        input.addEventListener('input', e => {
            profiles[parseInt(e.target.dataset.index)].name = e.target.value;
            updatePreview(); saveToStorage();
        });
    });
    profilesList.querySelectorAll('.profile-image-input').forEach(input => {
        input.addEventListener('input', e => {
            profiles[parseInt(e.target.dataset.index)].imageUrl = e.target.value;
            updatePreview(); saveToStorage();
        });
    });
    profilesList.querySelectorAll('.profile-zoom-input').forEach(input => {
        input.addEventListener('input', e => {
            const idx = parseInt(e.target.dataset.index);
            profiles[idx].zoom = parseInt(e.target.value);
            document.getElementById('profile' + idx + 'ZoomValue').textContent = e.target.value + '%';
            updatePreview(); saveToStorage();
        });
    });
    profilesList.querySelectorAll('.profile-focusx-input').forEach(input => {
        input.addEventListener('input', e => {
            const idx = parseInt(e.target.dataset.index);
            profiles[idx].focusX = parseInt(e.target.value);
            document.getElementById('profile' + idx + 'FocusXValue').textContent = e.target.value + '%';
            updatePreview(); saveToStorage();
        });
    });
    profilesList.querySelectorAll('.profile-focusy-input').forEach(input => {
        input.addEventListener('input', e => {
            const idx = parseInt(e.target.dataset.index);
            profiles[idx].focusY = parseInt(e.target.value);
            document.getElementById('profile' + idx + 'FocusYValue').textContent = e.target.value + '%';
            updatePreview(); saveToStorage();
        });
    });
    profilesList.querySelectorAll('.profile-desc-input').forEach(input => {
        input.addEventListener('input', e => {
            profiles[parseInt(e.target.dataset.index)].desc = e.target.value;
            updatePreview(); saveToStorage();
        });
    });
    profilesList.querySelectorAll('.profile-tag-input').forEach(input => {
        input.addEventListener('change', e => {
            profiles[parseInt(e.target.dataset.index)].tag = e.target.value;
            updatePreview(); saveToStorage();
        });
    });
    // [추가됨] 위로 이동 버튼 이벤트
    profilesList.querySelectorAll('.btn-profile-move-up').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index);
            moveProfileUp(idx);
        });
    });

    // [추가됨] 아래로 이동 버튼 이벤트
    profilesList.querySelectorAll('.btn-profile-move-down').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index);
            moveProfileDown(idx);
        });
    });
    profilesList.querySelectorAll('.btn-profile-delete').forEach(btn => {
        btn.addEventListener('click', e => {
            const idx = parseInt(e.target.dataset.index);
            if (confirm('이 프로필을 삭제하시겠습니까?')) {
                profiles.splice(idx, 1);
                updateProfilesList(); updatePreview(); saveToStorage();
            }
        });
    });

}


function updateReplacementsList() {
    const list = document.getElementById('replacementsList');
    if (!list) return;

    list.innerHTML = '';

    replacements.forEach(function (rep, index) {
        const item = document.createElement('div');
        item.className = 'replacement-edit-item';
        // Grid 구조: 원본 | 화살표 | 치환 | 삭제
        item.innerHTML =
            '<input type="text" class="replacement-from-input" placeholder="원본 단어" value="' + (rep.from || '') + '" data-index="' + index + '" data-field="from">' +
            '<div class="arrow-static">→</div>' +
            '<input type="text" class="replacement-to-input" placeholder="바꿀 단어" value="' + (rep.to || '') + '" data-index="' + index + '" data-field="to">' +
            '<button class="btn-delete-item" data-index="' + index + '" title="삭제">×</button>';
        list.appendChild(item);
    });

    // 이벤트 리스너 연결 로직 동일
    document.querySelectorAll('.replacement-from-input, .replacement-to-input').forEach(function (input) {
        input.addEventListener('input', function (e) {
            const idx = parseInt(e.target.dataset.index);
            const field = e.target.dataset.field;
            replacements[idx][field] = e.target.value;
            updatePreview();
            saveToStorage();
        });
    });

    document.querySelectorAll('.btn-delete-item').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const idx = parseInt(e.target.dataset.index);
            replacements.splice(idx, 1);
            updateReplacementsList();
            updatePreview();
            saveToStorage();
        });
    });
}

function addCustomTheme() {
    if (customThemes.length >= 20) {
        alert('커스텀 테마는 최대 20개까지만 저장할 수 있습니다.');
        return;
    }

    const themeName = prompt('테마 이름을 입력하세요:', '커스텀 테마 ' + (customThemes.length + 1));
    if (themeName === null || themeName.trim() === '') return; // 취소 또는 빈 문자열

    const newTheme = {
        name: themeName.trim(),
        bg: getColorValue('customBg'),
        text: getColorValue('customText'),
        em: getColorValue('customEm'),
        line: getColorValue('customLine'),
        headerText: getColorValue('customHeaderText'),
        quote1Bg: getColorValue('customQuote1Bg'),
        quote1Text: getColorValue('customQuote1Text'),
        quote2Bg: getColorValue('customQuote2Bg'),
        quote2Text: getColorValue('customQuote2Text'),
        tagText: getColorValue('customTagText'),
        divider: getColorValue('customDivider')
    };

    customThemes.push(newTheme);
    updateCustomThemesList();
    saveToStorage();
    showNotification('커스텀 테마가 저장되었습니다!');
}

function updateCustomThemesList() {
    const themesList = document.getElementById('customThemesList');
    if (!themesList) return;

    themesList.innerHTML = '';
    customThemes.forEach(function (theme, index) {
        const themeItem = document.createElement('div');
        themeItem.className = 'custom-theme-item';
        themeItem.innerHTML =
            '<span class="theme-name">' + theme.name + '</span>' +
            '<span class="theme-preview" style="background-color: ' + theme.bg + '; border: 1px solid ' + theme.line + ';"></span>' +
            '<div class="theme-actions">' +
                '<button class="btn-load-theme" data-index="' + index + '">불러오기</button>' +
                '<button class="btn-overwrite-theme" data-index="' + index + '">덮어쓰기</button>' +
                '<button class="btn-rename-theme" data-index="' + index + '" title="이름 수정">✎</button>' +
                '<button class="btn-delete-theme" data-index="' + index + '" title="삭제">×</button>' +
            '</div>';
        themesList.appendChild(themeItem);
    });

    document.querySelectorAll('.btn-load-theme').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const index = parseInt(e.target.dataset.index);
            loadCustomTheme(index);
        });
    });

    document.querySelectorAll('.btn-overwrite-theme').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const index = parseInt(e.target.dataset.index);
            overwriteCustomTheme(index);
        });
    });

    document.querySelectorAll('.btn-rename-theme').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const index = parseInt(e.target.dataset.index);
            renameCustomTheme(index);
        });
    });

    document.querySelectorAll('.btn-delete-theme').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            const index = parseInt(e.target.dataset.index);
            deleteCustomTheme(index);
        });
    });
}

function loadCustomTheme(index) {
    const theme = customThemes[index];
    if (!theme) return;

    setColorInputValue('customBg', theme.bg);
    setColorInputValue('customText', theme.text);
    setColorInputValue('customEm', theme.em);
    setColorInputValue('customLine', theme.line);
    setColorInputValue('customHeaderText', theme.headerText);
    setColorInputValue('customQuote1Bg', theme.quote1Bg);
    setColorInputValue('customQuote1Text', theme.quote1Text);
    setColorInputValue('customQuote2Bg', theme.quote2Bg);
    setColorInputValue('customQuote2Text', theme.quote2Text);
    setColorInputValue('customTagText', theme.tagText || theme.badgeBg || '#888888');

    updatePreview();
    saveToStorage();
    showNotification('테마를 불러왔습니다!');
}

function overwriteCustomTheme(index) {
    const theme = customThemes[index];
    if (!theme) return;

    if (!confirm('"' + theme.name + '" 테마를 현재 색상으로 덮어쓰시겠습니까?')) {
        return;
    }

    customThemes[index] = {
        name: theme.name, // 이름은 유지
        bg: getColorValue('customBg'),
        text: getColorValue('customText'),
        em: getColorValue('customEm'),
        line: getColorValue('customLine'),
        headerText: getColorValue('customHeaderText'),
        quote1Bg: getColorValue('customQuote1Bg'),
        quote1Text: getColorValue('customQuote1Text'),
        quote2Bg: getColorValue('customQuote2Bg'),
        quote2Text: getColorValue('customQuote2Text'),
        tagText: getColorValue('customTagText'),
        divider: getColorValue('customDivider')
    };

    updateCustomThemesList();
    saveToStorage();
    showNotification('테마를 덮어썼습니다!');
}

function renameCustomTheme(index) {
    const theme = customThemes[index];
    if (!theme) return;

    const newName = prompt('새로운 테마 이름을 입력하세요:', theme.name);
    if (newName === null || newName.trim() === '') return; // 취소 또는 빈 문자열

    customThemes[index].name = newName.trim();
    updateCustomThemesList();
    saveToStorage();
    showNotification('테마 이름이 변경되었습니다!');
}

function deleteCustomTheme(index) {
    const theme = customThemes[index];
    if (!theme) return;

    if (confirm('"' + theme.name + '" 테마를 삭제하시겠습니까?')) {
        customThemes.splice(index, 1);
        updateCustomThemesList();
        saveToStorage();
        showNotification('테마가 삭제되었습니다.');
    }
}

function savePageData() {
    const pageTitle = document.getElementById('pageTitle').value.trim();
    const pageSubtitle = document.getElementById('pageSubtitle').value.trim();
    const content = document.getElementById('pageContent').value;
    const defaultImageWidthInput = document.getElementById('defaultImageWidth');
    const pageImageWidth = defaultImageWidthInput ? parseInt(defaultImageWidthInput.value) : 100;

    if (!content.trim()) {
        alert('내용을 입력해주세요.');
        return;
    }

    if (currentEditingIndex === null) {
        // 새 페이지 추가
        const pageData = {
            itemType: 'page',
            type: globalTheme,
            title: pageTitle,
            subtitle: pageSubtitle,
            content: content,
            imageWidth: pageImageWidth,
            bgImage: null,
            collapsed: false,
            useGlobalTags: true,
            tags: [],
            headerImage: null,
            headerFocusX: 50,
            headerFocusY: 50
        };
        pages.push(pageData);
        console.log('Added new page with imageWidth:', pageData.imageWidth);
    } else {
        // 기존 페이지 수정 - 기존 객체 유지하고 속성만 업데이트
        const existingPage = pages[currentEditingIndex];
        existingPage.title = pageTitle;
        existingPage.subtitle = pageSubtitle;
        existingPage.content = content;
        existingPage.imageWidth = pageImageWidth;
        console.log('Updated page', currentEditingIndex, 'imageWidth:', existingPage.imageWidth);
    }

    document.getElementById('pageModal').style.display = 'none';
    updatePagesList();
    updatePreview();
    saveToStorage();
}

// 섹션 데이터 저장 함수
function saveSectionData() {
    const sectionTitle = document.getElementById('sectionTitle').value.trim();
    const sectionSubtitle = document.getElementById('sectionSubtitle').value.trim();
    const sectionImage = document.getElementById('sectionImage').value.trim();
    const sectionAlign = document.getElementById('sectionAlign').value;
    const sectionZoom = parseInt(document.getElementById('sectionZoom').value);
    const sectionFocusX = parseInt(document.getElementById('sectionFocusX').value);
    const sectionFocusY = parseInt(document.getElementById('sectionFocusY').value);

    if (!sectionTitle && !sectionSubtitle && !sectionImage) {
        alert('제목, 부제목 또는 이미지 중 하나 이상을 입력해주세요.');
        return;
    }

    const sectionData = {
        itemType: 'section', // 섹션 타입 식별자
        title: sectionTitle,
        subtitle: sectionSubtitle,
        image: sectionImage,
        align: sectionAlign || 'center', // 정렬 옵션 추가 (기본값: center)
        zoom: sectionZoom,
        focusX: sectionFocusX,
        focusY: sectionFocusY
    };

    if (currentEditingIndex === null) {
        pages.push(sectionData);
    } else {
        pages[currentEditingIndex] = sectionData;
    }

    document.getElementById('sectionModal').style.display = 'none';
    updatePagesList();
    updatePreview();
    saveToStorage();
}

// 섹션 데이터 삭제 함수
function deleteSectionData() {
    if (currentEditingIndex !== null && confirm('삭제하시겠습니까?')) {
        pages.splice(currentEditingIndex, 1);
        document.getElementById('sectionModal').style.display = 'none';
        updatePagesList();
        updatePreview();
        saveToStorage();
    }
}

function deletePageData() {
    if (currentEditingIndex !== null && confirm('삭제하시겠습니까?')) {
        pages.splice(currentEditingIndex, 1);
        document.getElementById('pageModal').style.display = 'none';
        updatePagesList();
        updatePreview();
        saveToStorage();
    }
}

// 전체 페이지 삭제 함수 (섹션 포함)
function deleteAllPages() {
    if (pages.length === 0) {
        showNotification('삭제할 페이지가 없습니다.');
        return;
    }
    if (confirm('모든 섹션과 페이지를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
        pages = [];
        updatePagesList();
        updatePreview();
        saveToStorage();
        showNotification('모든 섹션과 페이지가 삭제되었습니다.');
    }
}

function movePageUp(index) {
    if (index > 0) {
        const temp = pages[index];
        pages[index] = pages[index - 1];
        pages[index - 1] = temp;
        updatePagesList();
        updatePreview();
        saveToStorage();
    }
}

function movePageDown(index) {
    if (index < pages.length - 1) {
        const temp = pages[index];
        pages[index] = pages[index + 1];
        pages[index + 1] = temp;
        updatePagesList();
        updatePreview();
        saveToStorage();
    }
}

// 텍스트 통계 계산 함수
function calculateTextStats(text) {
    if (!text || !text.trim()) {
        return {
            charCountNoSpace: 0,
            charCountWithSpace: 0,
            wordCount: 0
        };
    }

    // 본문 텍스트만 추출 (태그 및 마크업 제거)
    let cleanText = text;
    
    // [HR], [IMG:...], [FN:...][/FN] 등의 태그 제거
    cleanText = cleanText.replace(/\[HR\]/g, '');
    cleanText = cleanText.replace(/\[IMG:[^\]]*\]/g, '');
    cleanText = cleanText.replace(/\[FN:[^\]]*\].*?\[\/FN\]/g, '');
    
    // 공백 정리
    cleanText = cleanText.trim();
    
    // 글자 수 계산 (공백 제외)
    const charCountNoSpace = cleanText.replace(/\s/g, '').length;
    
    // 글자 수 계산 (공백 포함)
    const charCountWithSpace = cleanText.length;
    
    // 단어 수 계산 (한글은 어절 단위, 영문은 단어 단위)
    const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
        charCountNoSpace: charCountNoSpace,
        charCountWithSpace: charCountWithSpace,
        wordCount: wordCount
    };
}

// 페이지별 통계 업데이트
function updatePageStats() {
    const pageContent = document.getElementById('pageContent');
    const pageStats = document.getElementById('pageStats');
    
    if (!pageContent || !pageStats) return;
    
    const stats = calculateTextStats(pageContent.value);
    
    pageStats.innerHTML = 
        '<strong>현재 페이지:</strong><br>' +
        '글자 수 (공백 제외): <span style="color: var(--accent-blue);">' + stats.charCountNoSpace.toLocaleString() + '자</span><br>' +
        '글자 수 (공백 포함): <span style="color: var(--accent-blue);">' + stats.charCountWithSpace.toLocaleString() + '자</span><br>' +
        '단어 수: <span style="color: var(--accent-blue);">' + stats.wordCount.toLocaleString() + '개</span>';
}

// 전체 페이지 통계 업데이트
function updateTotalStats() {
    const totalStats = document.getElementById('totalStats');
    if (!totalStats) return;
    
    let totalCharCountNoSpace = 0;
    let totalCharCountWithSpace = 0;
    let totalWordCount = 0;
    
    pages.forEach(function(item) {
        // 페이지만 카운트 (섹션은 제외)
        if (item.itemType !== 'section' && item.content) {
            const stats = calculateTextStats(item.content);
            totalCharCountNoSpace += stats.charCountNoSpace;
            totalCharCountWithSpace += stats.charCountWithSpace;
            totalWordCount += stats.wordCount;
        }
    });
    
    if (totalCharCountNoSpace === 0) {
        totalStats.innerHTML = '<strong>전체 페이지 통계:</strong> 페이지가 없습니다.';
    } else {
        totalStats.innerHTML = 
            '<strong>전체 페이지 통계:</strong><br>' +
            '글자 수 (공백 제외): <span style="color: var(--accent-blue);">' + totalCharCountNoSpace.toLocaleString() + '자</span><br>' +
            '글자 수 (공백 포함): <span style="color: var(--accent-blue);">' + totalCharCountWithSpace.toLocaleString() + '자</span><br>' +
            '단어 수: <span style="color: var(--accent-blue);">' + totalWordCount.toLocaleString() + '개</span>';
    }
}

function updatePagesList() {
    const pagesList = document.getElementById('pagesList');
    pagesList.innerHTML = '';

    let pageNumber = 0; // 실제 페이지 번호 카운터

    pages.forEach(function (item, index) {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';

        // 섹션인 경우
        if (item.itemType === 'section') {
            let sectionDisplay = item.title || 'Section';
            if (item.subtitle) {
                sectionDisplay += ' - ' + item.subtitle;
            }

            pageItem.innerHTML =
                '<div class="page-item-header">' +
                '<div class="page-item-main">' +
                '<div class="page-item-info">' +
                '<span class="page-item-name" style="color: var(--accent-blue); font-weight: 700;">📑 ' + sectionDisplay + '</span>' +
                '<div class="page-item-preview" style="color: var(--text-muted); font-size: 12px;">섹션 (구분선)</div>' +
                '</div>' +
                '</div>' +
                '<div class="page-controls">' +
                '<button class="btn-move btn-move-up" data-index="' + index + '" title="위로">▲</button>' +
                '<button class="btn-move btn-move-down" data-index="' + index + '" title="아래로">▼</button>' +
                '<button class="btn-delete-page" data-index="' + index + '" title="삭제">×</button>' +
                '</div>' +
                '</div>';

            // 섹션 클릭 이벤트
            pageItem.addEventListener('click', function (e) {
                if (e.target.closest('.btn-move') || e.target.closest('.btn-delete-page')) return;

                currentEditingIndex = index;
                document.getElementById('sectionTitle').value = item.title || '';
                document.getElementById('sectionSubtitle').value = item.subtitle || '';
                document.getElementById('sectionImage').value = item.image || '';
                document.getElementById('sectionAlign').value = item.align || 'center';
                document.getElementById('sectionZoom').value = item.zoom || 100;
                document.getElementById('sectionFocusX').value = item.focusX || 50;
                document.getElementById('sectionFocusY').value = item.focusY || 50;
                document.getElementById('sectionZoomValue').textContent = (item.zoom || 100) + '%';
                document.getElementById('sectionFocusXValue').textContent = (item.focusX || 50) + '%';
                document.getElementById('sectionFocusYValue').textContent = (item.focusY || 50) + '%';

                const sectionModal = document.getElementById('sectionModal');
                sectionModal.style.display = 'flex';
                
                // 모바일에서 모달과 body를 맨 위로 스크롤
                setTimeout(function() {
                    sectionModal.scrollTop = 0;
                    const modalBody = sectionModal.querySelector('.modal-body');
                    if (modalBody) modalBody.scrollTop = 0;
                }, 50);
            });
        }
        // 페이지인 경우
        else {
            pageNumber++; // 페이지 번호 증가

            let speaker = '#' + pageNumber;
            if (item.title && item.title.trim()) {
                speaker = item.title;
            }
            if (item.subtitle && item.subtitle.trim()) {
                speaker += ' - ' + item.subtitle;
            }

            const previewText = item.content.substring(0, 50).replace(/\[.*?\]/g, '').trim() + '...';

            pageItem.innerHTML =
                '<div class="page-item-header">' +
                '<div class="page-item-main">' +
                '<span class="page-num">#' + pageNumber + '</span>' +
                '<div class="page-item-info">' +
                '<span class="page-item-name">' + speaker + '</span>' +
                '<div class="page-item-preview">' + previewText + '</div>' +
                '</div>' +
                '</div>' +
                '<div class="page-controls">' +
                '<button class="btn-move btn-move-up" data-index="' + index + '" title="위로">▲</button>' +
                '<button class="btn-move btn-move-down" data-index="' + index + '" title="아래로">▼</button>' +
                '<button class="btn-delete-page" data-index="' + index + '" title="삭제">×</button>' +
                '</div>' +
                '</div>';

            // 페이지 클릭 이벤트 (편집)
            pageItem.addEventListener('click', function (e) {
                if (e.target.closest('.btn-move') || e.target.closest('.btn-delete-page')) return;

                currentEditingIndex = index;
                document.getElementById('pageTitle').value = item.title || '';
                document.getElementById('pageSubtitle').value = item.subtitle || '';
                document.getElementById('pageContent').value = item.content;

                tempPageTags = [];

                const pageModal = document.getElementById('pageModal');
                pageModal.style.display = 'flex';
                
                // 페이지 통계 업데이트
                updatePageStats();
                
                // 모바일에서 모달과 body를 맨 위로 스크롤
                setTimeout(function() {
                    pageModal.scrollTop = 0;
                    const modalBody = pageModal.querySelector('.modal-body');
                    if (modalBody) modalBody.scrollTop = 0;
                }, 50);
            });
        }

        pagesList.appendChild(pageItem);
    });

    // 버튼 이벤트 리스너
    document.querySelectorAll('.btn-move-up').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.index);
            movePageUp(idx);
        });
    });

    document.querySelectorAll('.btn-move-down').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.index);
            movePageDown(idx);
        });
    });

    // 삭제 버튼 이벤트 리스너
    document.querySelectorAll('.btn-delete-page').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            const idx = parseInt(e.target.dataset.index);

            // 인덱스 유효성 검증
            if (idx < 0 || idx >= pages.length || !pages[idx]) {
                showNotification('삭제할 항목을 찾을 수 없습니다.');
                return;
            }

            // 확인 대화상자
            const itemType = pages[idx].itemType === 'section' ? '섹션' : '페이지';
            let itemName;
            if (pages[idx].itemType === 'section') {
                itemName = pages[idx].title || 'Section';
            } else {
                // 섹션을 제외한 실제 페이지 번호 계산
                let actualPageNumber = 0;
                for (let i = 0; i <= idx; i++) {
                    if (pages[i].itemType !== 'section') {
                        actualPageNumber++;
                    }
                }
                itemName = pages[idx].title || '#' + actualPageNumber;
            }

            if (confirm(itemType + ' "' + itemName + '"을(를) 삭제하시겠습니까?')) {
                pages.splice(idx, 1);
                saveToStorage();
                updatePagesList();
                updatePreview();
                showNotification(itemType + '이(가) 삭제되었습니다.');
            }
        });
    });
    
    // 전체 통계 업데이트
    updateTotalStats();
}

function generateHTML(isPreview) {
    let html = '';

    const enableTopSection = document.getElementById('enableTopSection').checked;
    const enableProfiles = document.getElementById('enableProfiles').checked;
    const enableTags = document.getElementById('enableTags').checked;
    const introText = document.getElementById('introText').value;
    const summaryText = document.getElementById('summaryText').value;

    // 표지 이미지가 활성화되어 있으면 보이지 않는 이미지를 HTML 맨 앞에 추가
    const enableCover = document.getElementById('enableCover').checked;
    const coverImageUrl = enableCover ? normalizeImageUrl(document.getElementById('coverImage').value) : '';
    if (enableCover && coverImageUrl) {
        const originalCoverUrl = document.getElementById('coverImage').value.trim();
        const needsCoverProxy = originalCoverUrl.includes('namu.la') || originalCoverUrl.includes('arca.live');
        
        if (needsCoverProxy) {
            const proxies = [
                originalCoverUrl,
                'https://images.weserv.nl/?url=' + encodeURIComponent(originalCoverUrl),
                'https://api.allorigins.win/raw?url=' + encodeURIComponent(originalCoverUrl)
            ];
            const proxyList = proxies.join('|');
            html += '<img style="width: 0px; height: 0px;" src="' + coverImageUrl + '" class="fr-fic fr-dii" data-proxies="' + proxyList + '" data-proxy-index="0" onerror="(function(img){var proxies=img.dataset.proxies.split(\'|\');var idx=parseInt(img.dataset.proxyIndex||0);if(idx<proxies.length-1){img.dataset.proxyIndex=idx+1;img.src=proxies[idx+1];}else{img.remove();};})(this)">';
        } else {
            html += '<img style="width: 0px; height: 0px;" src="' + coverImageUrl + '" class="fr-fic fr-dii">';
        }
    }

    if (enableTopSection) {
        const themeType = globalTheme;
        const theme = getTheme(themeType);

        let topContent = '';
        const coverImage = coverImageUrl;

        const lineRgb = hexToRgb(theme.line);
        const lineColor = 'rgba(' + lineRgb.r + ', ' + lineRgb.g + ', ' + lineRgb.b + ', 0.6)';

        // 표지 관련 정보 가져오기
        const coverArchiveNo = document.getElementById('coverArchiveNo').value;
        const coverTitle = document.getElementById('coverTitle').value;
        const coverSubtitle = document.getElementById('coverSubtitle').value;

        // 표지 하단에 올 실제 내용이 있는지 확인 (프로필, 인트로, 요약, 사운드트랙만 체크)
        // coverArchiveNo/coverTitle/coverSubtitle은 표지 내부 요소이므로 포함하지 않음
        const soundtrackUrlCheck = document.getElementById('soundtrackUrl').value;
        const hasRealContent = (enableProfiles && profiles.length > 0) || introText.trim() || summaryText.trim() || (soundtrackUrlCheck && soundtrackUrlCheck.trim());

        // 인트로가 마지막 컨테이너인지 확인 (페이지도 없고 코멘트도 없으면)
        const enableComment = document.getElementById('enableComment').checked;
        const commentText = document.getElementById('commentText').value;
        const hasCommentSection = enableComment && commentText && commentText.trim();
        const isIntroLastContainer = pages.length === 0 && !hasCommentSection;

        // 표지 생성
        if (enableCover) {
            const coverAutoFit = document.getElementById('coverAutoFit').checked;
            const coverZoom = document.getElementById('coverZoom').value;
            const coverFocusX = document.getElementById('coverFocusX').value;
            const coverFocusY = document.getElementById('coverFocusY').value;

            // 표지 내용이 있는지 확인 (이미지, 제목, 부제목, 번호 중 하나라도 있으면)
            const hasCoverContent = coverImage || coverArchiveNo || coverTitle || coverSubtitle;

            if (hasCoverContent) {
                if (coverImage) {
                    // 이미지가 있는 경우 - 기존 로직
                    const normalizedCoverImage = normalizeImageUrl(coverImage);
                    
                    // 자동 크기 조절 여부에 따라 background-size 결정
                    const backgroundSize = coverAutoFit ? 'cover' : (coverZoom + '% auto');
                    
                    // 내용 없을 때: margin/padding 없이 표지가 컨테이너를 꽉 채움
                    const coverWrapperMarginBottom = hasRealContent ? '30px' : '0';
                    const coverImgBorderRadius = hasRealContent ? '10px 10px 0 0' : '10px 10px 10px 10px';

                    topContent += '<div style="width:100%;margin:0 0 ' + coverWrapperMarginBottom + ' 0;box-sizing:border-box;background-color:#1a1a1a;background-image:url(\'' + normalizedCoverImage + '\');background-size:' + backgroundSize + ';background-position:' + coverFocusX + '% ' + coverFocusY + '%;background-repeat:no-repeat;border-radius:' + coverImgBorderRadius + ';display:table;">';
                    topContent += '<div style="display:table-cell;vertical-align:bottom;width:100%;height:min(68.421vw, 615px);min-height:200px;padding:clamp(15px, 3vw, 20px) clamp(30px, 5vw, 40px);box-sizing:border-box;background:linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 25%, transparent 45%);border-radius:' + coverImgBorderRadius + ';">';

                    if (coverArchiveNo) {
                        topContent += '<p style="font-size:' + pxToClamp(headingFontSizes.coverArchiveNo) + ';color:rgba(255, 255, 255, 0.8);letter-spacing:clamp(2px, 0.4vw, 3px);margin:0 0 5px 0;font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';text-shadow:0 2px 4px rgba(0,0,0,0.5);">' + coverArchiveNo + '</p>';
                    }

                    if (coverTitle) {
                        const titleMargin = coverSubtitle ? '0 0 0px 0' : '0 0 10px 0';
                        topContent += '<h1 style="font-size:' + pxToClamp(headingFontSizes.coverTitle) + ';color:rgba(255, 255, 255, 1.0);margin:' + titleMargin + ';font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';font-weight:700;line-height:1.0;text-shadow:0 4px 15px rgba(0,0,0,0.6);word-break:keep-all;">' + coverTitle + '</h1>';
                    }

                    if (coverSubtitle) {
                        topContent += '<div style="font-size:' + pxToClamp(headingFontSizes.coverSubtitle) + ';letter-spacing:-0.5px;color:rgba(255, 255, 255, 0.9);margin:5px 0 10px 0;font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';max-width:90%;text-shadow:0 1px 3px rgba(0,0,0,0.8);">' + coverSubtitle + '</div>';
                    }

                    // 태그를 표지에 표시
                    if (enableTags && tags && tags.length > 0) {
                        const validTags = tags.filter(function (tag) {
                            return tag.value && tag.value.trim();
                        });

                        if (validTags.length > 0) {
                            topContent += '<div style="font-size:0;">';
                            validTags.forEach(function (tag) {
                                const tagContent = tag.link
                                    ? '<a href="' + tag.link + '" style="text-decoration:none;color:inherit;">' + tag.value + '</a>'
                                    : tag.value;
                                const tagStyle = 'display:inline-block;vertical-align:top;background:rgba(255, 255, 255, 0.1);color:#ffffff;padding:' + pxToClamp(Math.round(headingFontSizes.coverTag * 0.45)) + ' ' + pxToClamp(Math.round(headingFontSizes.coverTag * 1.1)) + ';margin:0 ' + pxToClamp(Math.round(headingFontSizes.coverTag * 0.7)) + ' ' + pxToClamp(Math.round(headingFontSizes.coverTag * 0.7)) + ' 0;border:1px solid rgba(255, 255, 255, 0.3);font-size:' + pxToClamp(headingFontSizes.coverTag) + ';font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';';
                                topContent += '<span style="' + tagStyle + '">' + tagContent + '</span> ';
                            });
                            topContent += '</div>';
                        }
                    }

                    topContent += '</div></div>';
                } else {
                    // 이미지가 없지만 제목/부제목/번호가 있는 경우 - 텍스트만 표시 (테마 색상 사용)
                    topContent += '<div style="padding: clamp(20px, 4vw, 30px) clamp(30px, 5vw, 40px) clamp(15px, 3vw, 20px) clamp(30px, 5vw, 40px);">';
                    
                    if (coverArchiveNo) {
                        topContent += '<p style="font-size:' + pxToClamp(headingFontSizes.coverArchiveNo) + ';color:' + theme.tagText + ';letter-spacing:clamp(2px, 0.4vw, 3px);margin:0 0 8px 0;font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">' + coverArchiveNo + '</p>';
                    }

                    if (coverTitle) {
                        const titleMargin = coverSubtitle ? '0 0 5px 0' : '0 0 15px 0';
                        topContent += '<h1 style="font-size:' + pxToClamp(headingFontSizes.coverTitle) + ';color:' + theme.header + ';margin:' + titleMargin + ';font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';font-weight:700;line-height:1.1;word-break:keep-all;">' + coverTitle + '</h1>';
                    }

                    if (coverSubtitle) {
                        topContent += '<div style="font-size:' + pxToClamp(headingFontSizes.coverSubtitle) + ';letter-spacing:-0.5px;color:' + theme.text + ';margin:5px 0 15px 0;font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';max-width:90%;">' + coverSubtitle + '</div>';
                    }

                    // 태그를 표지에 표시
                    if (enableTags && tags && tags.length > 0) {
                        const validTags = tags.filter(function (tag) {
                            return tag.value && tag.value.trim();
                        });

                        if (validTags.length > 0) {
                            topContent += '<div style="font-size:0;margin-top:10px;">';
                            validTags.forEach(function (tag) {
                                const tagContent = tag.link
                                    ? '<a href="' + tag.link + '" style="text-decoration:none;color:inherit;">' + tag.value + '</a>'
                                    : tag.value;
                                const tagStyle = 'display:inline-block;vertical-align:top;background:' + theme.quote1Bg + ';color:' + theme.text + ';padding:' + pxToClamp(Math.round(headingFontSizes.coverTag * 0.45)) + ' ' + pxToClamp(Math.round(headingFontSizes.coverTag * 1.1)) + ';margin:0 ' + pxToClamp(Math.round(headingFontSizes.coverTag * 0.7)) + ' ' + pxToClamp(Math.round(headingFontSizes.coverTag * 0.7)) + ' 0;border:1px solid ' + theme.divider + ';font-size:' + pxToClamp(headingFontSizes.coverTag) + ';font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';';
                                topContent += '<span style="' + tagStyle + '">' + tagContent + '</span> ';
                            });
                            topContent += '</div>';
                        }
                    }

                    topContent += '</div>';
                }
            }
        }

        if (enableProfiles && profiles.length > 0) {
            // 표지 내용(이미지 또는 텍스트)이 없을 때는 상단 여백 추가
            const hasCoverContent = coverImage || coverArchiveNo || coverTitle || coverSubtitle;
            const topPadding = hasCoverContent ? '0px' : '30px';
            topContent += '<div style="padding: ' + topPadding + ' 0 10px 0;">';
            topContent += '<div style="padding: 0 clamp(30px, 5vw, 50px) 10px clamp(30px, 5vw, 50px); text-align: center;">';
            topContent += '<span style="display: inline-block; font-size: clamp(11px, 2vw, 13px); font-weight: 600; letter-spacing: clamp(1.5px, 0.3vw, 2px); color: ' + theme.headerText + '; text-transform: uppercase; border-bottom: 1px solid ' + theme.headerText + '; padding-bottom: 5px;margin-bottom:10px">Profile</span>';
            topContent += '</div>';

            const profileRowStyle = 'width: 100%; text-align: center; font-size: 0; margin-bottom: 0px;';
            const profileContainerStyle = 'display: inline-block; width: 50%; max-width: 350px; vertical-align: top; text-align: center; box-sizing: border-box; padding: 0 clamp(15px, 4vw, 30px); margin-bottom: clamp(20px, 4vw, 30px);';
            const imgWrapperStyle = 'display: inline-block; width: 100%; max-width: clamp(130px, 18vw, 200px); vertical-align: top; margin: 0 auto clamp(10px, 2vw, 15px) auto;';
            const imgCircleStyleBase = 'width: 100%; height: 0; padding-bottom: 100%; border-radius: 50%; margin: 0 auto;';
            const textContainerStyle = 'text-align: center;';
            const nameStyle = 'display: block; font-size: clamp(13px, 2.5vw, 18px); font-weight: 700; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; color: ' + theme.headerText + '; line-height: 1.2; margin-bottom: clamp(6px, 1.5vw, 10px);';
            const tagStyle = 'font-size: clamp(8px, 1.3vw, 10px); color: ' + theme.tagText + '; margin-bottom: 3px; font-weight: 600; text-transform: uppercase; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';';
            const descStyle = 'font-size: clamp(11px, 2vw, 12px); line-height: 1.6; color: ' + theme.text + '; word-break: keep-all; text-align: center; padding: 0 5px; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';';
            const leftStyle = 'text-align: left; padding: 0 clamp(15px, 4vw, 25px);';

            topContent += '<div style="' + profileRowStyle + '">';

            profiles.forEach(function (profile) {
                const profileImageUrl = normalizeImageUrl(profile.imageUrl || '');
                const hasImage = profileImageUrl.trim() !== '';
                const hasContent = (profile.name && profile.name.trim()) || (profile.desc && profile.desc.trim());

                if (hasContent) {
                    topContent += '<div style="' + profileContainerStyle + '">';

                    if (hasImage) {
                        topContent += '<div style="' + imgWrapperStyle + '">';
                        const bgPosition = (profile.focusX || 50) + '% ' + (profile.focusY || 30) + '%';
                        const bgSize = (profile.zoom || 100) + '% auto';
                        topContent += '<div style="' + imgCircleStyleBase + ' background: url(\'' + profileImageUrl + '\') ' + bgPosition + ' / ' + bgSize + ' no-repeat;"></div>';
                        topContent += '</div>';
                    }

                    topContent += '<div style="' + textContainerStyle + '">';
                    if (profile.tag) {
                        topContent += '<div style="' + tagStyle + '">' + profile.tag + '</div>';
                    }
                    if (profile.name && profile.name.trim()) {
                        topContent += '<div style="' + nameStyle + '">' + profile.name + '</div>';
                    }
                    if (profile.desc && profile.desc.trim()) {
                        // 페이지 헤더 부제목과 동일한 크기로 표시하기 위해 parseText 사용하지 않음
                        const descText = profile.desc.replace(/\n/g, '<br>');
                        topContent += '<div style="' + descStyle + '">' + descText + '</div>';
                    }
                    topContent += '</div>';

                    topContent += '</div>';
                }
            });

            topContent += '</div>';

            topContent += '</div>';
        }

        if (introText.trim()) {
            // 표지 내용(이미지 또는 텍스트)이 없고 프로필도 없을 때는 상단 여백 추가
            const hasCoverContent = coverImage || coverArchiveNo || coverTitle || coverSubtitle;
            const needTopPadding = !hasCoverContent && (!enableProfiles || profiles.length === 0);
            const topPadding = needTopPadding ? '30px' : '10px';
            topContent += '<div style="padding: ' + topPadding + ' clamp(30px, 5vw, 50px) 10px clamp(30px, 5vw, 50px);">' + parseText(introText, theme, true, true) + '</div>';
        }

        if (summaryText.trim()) {
            // 표지 내용, 프로필, 인트로 텍스트가 모두 없을 때는 상단 여백 추가
            const hasCoverContent = coverImage || coverArchiveNo || coverTitle || coverSubtitle;
            const needTopPadding = !hasCoverContent && (!enableProfiles || profiles.length === 0) && !introText.trim();
            const topPadding = needTopPadding ? '30px' : '20px';

            if (!enableProfiles || profiles.length === 0) {
                topContent += '<div style="padding-top: ' + topPadding + ';"></div>';
            }
            if (introText.trim()) {
                topContent += '<br>';
            }
            topContent += '<div style="padding: 0 clamp(20px, 3vw, 25px) 5px clamp(20px, 3vw, 25px); text-align: center;">';
            topContent += '<span style="display: inline-block; font-size: clamp(11px, 2vw, 13px); font-weight: 600; letter-spacing: clamp(1.5px, 0.3vw, 2px); color: ' + theme.headerText + '; text-transform: uppercase; border-bottom: 1px solid ' + theme.headerText + '; padding-bottom: 5px; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">Story So Far</span>';
            topContent += '</div>';
            topContent += '<div style="padding: 10px clamp(30px, 5vw, 50px) 10px clamp(30px, 5vw, 50px);">' + parseText(summaryText, theme, true, true) + '</div>';
        }

        // 사운드트랙 섹션 추가
        const soundtrackUrl = document.getElementById('soundtrackUrl').value;
        const soundtrackTitle = document.getElementById('soundtrackTitle').value;
        const soundtrackArtist = document.getElementById('soundtrackArtist').value;
        if (soundtrackUrl && soundtrackUrl.trim()) {
            topContent += createSoundtrackSection(soundtrackUrl, soundtrackTitle, soundtrackArtist, theme, isPreview);
        }

        // 표지만 있고 다른 내용이 없으면 컨테이너 없이 표지만 직접 출력
        if (enableCover && !hasRealContent) {
            // 컨테이너(배경색/패딩/그림자) 없이 max-width만 맞춰서 직접 출력
            html += '<div style="max-width:900px;margin:5px auto;">' + topContent + '</div>';
        } else if (hasRealContent || enableCover) {
            // 내용이 있거나 표지와 함께 내용이 있는 경우
            html += createContainer(topContent, themeType, null, false, null, null, !!coverImage);
        }
        // enableCover도 없고 내용도 없으면 아무것도 출력하지 않음
    }

    if (enableTopSection && pages.length > 0) {
        html += '<br>';
    }

    let pageNumber = 0; // 실제 페이지 번호 카운터
    let sectionNumber = 0; // 섹션 번호 카운터
    let sectionContainerHtml = ''; // 섹션 내부 페이지들을 모을 변수
    let currentSectionTheme = null; // 현재 섹션의 테마
    let currentSectionHasImage = false; // 현재 섹션에 이미지가 있는지 여부
    let isInSection = false; // 섹션 내부에 있는지 여부

    // 코멘트가 있는지 미리 확인
    const enableCommentCheck = document.getElementById('enableComment').checked;
    const commentTextCheck = document.getElementById('commentText').value;
    const hasCommentAtEnd = enableCommentCheck && commentTextCheck && commentTextCheck.trim();

    pages.forEach(function (item, index) {
        // 섹션인 경우
        if (item.itemType === 'section') {
            // 이전 섹션이 있었다면 컨테이너로 감싸서 출력
            if (isInSection && sectionContainerHtml) {
                const topPadding = currentSectionHasImage ? '0' : 'clamp(20px, 4vw, 30px)';
                html += '<div style="box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width: 900px; margin: 5px auto; border-radius: 1rem; background-color: ' + currentSectionTheme.bg + '; padding: ' + topPadding + ' 0 clamp(20px, 4vw, 30px) 0; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; font-size: clamp(13px, 2.2vw, 14.2px);">';
                html += sectionContainerHtml;
                html += '</div>';
                html += '<br>'; // 섹션 컨테이너 뒤에 간격 추가
                sectionContainerHtml = '';
            }

            pageNumber = 0; // 섹션 만날 때마다 페이지 번호 초기화
            sectionNumber++; // 섹션 번호 증가
            isInSection = true; // 섹션 시작

            // 섹션에 이미지가 있는지 저장
            currentSectionHasImage = item.image && item.image.trim();

            // 다음 페이지가 있고 그것이 페이지(section이 아닌)라면 테마 미리 가져오기
            if (index + 1 < pages.length && pages[index + 1].itemType !== 'section') {
                currentSectionTheme = getTheme(globalTheme);
            } else {
                currentSectionTheme = getTheme(globalTheme); // globalTheme 사용
                isInSection = false; // 섹션 다음에 페이지가 없으면 컨테이너 불필요
            }

            // 섹션 렌더링
            let sectionHtml = '';

            // 섹션 이미지가 있는 경우 - 표지와 유사한 레이아웃 사용
            if (item.image && item.image.trim()) {
                const zoom = item.zoom || 100;
                const focusX = item.focusX || 50;
                const focusY = item.focusY || 50;
                const textAlign = item.align || 'center';
                const sectionImage = normalizeImageUrl(item.image);
                
                // 섹션 내에 페이지가 있을 때만 margin-bottom 추가, border-radius도 조건부 적용
                const sectionMarginBottom = isInSection ? 'margin-bottom:20px;' : '';
                const sectionBorderRadius = isInSection ? 'border-radius:10px 10px 0 0;' : 'border-radius:10px;';

                sectionHtml += '<div style="width:100%;height:15vh;display:table;background-color:#1a1a1a;background-image:url(\'' + sectionImage + '\');background-size:' + zoom + '% auto;background-position:' + focusX + '% ' + focusY + '%;background-repeat:no-repeat;' + sectionBorderRadius + sectionMarginBottom + '">';
                sectionHtml += '<div style="display:table-cell;vertical-align:middle;width:100%;height:15vh;padding:clamp(15px, 3vw, 20px) clamp(30px, 5vw, 40px);box-sizing:border-box;background:linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 30%, transparent 60%);' + sectionBorderRadius + 'text-align:' + textAlign + ';">';

                if (item.subtitle && item.subtitle.trim()) {
                    sectionHtml += '<div style="font-size:' + pxToClamp(headingFontSizes.sectionSubtitle) + ';line-height:1.3;letter-spacing:clamp(1.5px, 0.3vw, 2px);color:rgba(255, 255, 255, 0.7);margin:0 0 clamp(6px, 1.2vw, 8px) 0;font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';text-transform:uppercase;text-shadow:0 1px 3px rgba(0,0,0,0.8);">' + item.subtitle + '</div>';
                }

                if (item.title) {
                    sectionHtml += '<h1 style="font-size:' + pxToClamp(headingFontSizes.sectionTitle) + ';color:rgba(255, 255, 255, 1.0);margin:0;font-family:\'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';font-weight:700;line-height:1.2;text-shadow:0 4px 15px rgba(0,0,0,0.6);">' + item.title + '</h1>';
                }

                sectionHtml += '</div></div>';
            }
            // 이미지가 없는 경우
            else {
                const textAlign = item.align || 'center';
                sectionHtml += '<div style="width: 100%; padding: clamp(15px, 3vw, 20px) clamp(30px, 5vw, 40px); text-align: ' + textAlign + ';">';
                
                if (item.subtitle && item.subtitle.trim()) {
                    sectionHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.sectionSubtitle) + '; color: ' + currentSectionTheme.tagText + '; letter-spacing: clamp(1.5px, 0.3vw, 2px); margin-bottom: clamp(8px, 1.5vw, 10px); text-transform: uppercase;">' + item.subtitle + '</div>';
                }
                
                if (item.title) {
                    sectionHtml += '<div style="font-size: ' + pxToClamp(headingFontSizes.sectionTitle) + '; font-weight: 700; color: ' + currentSectionTheme.header + '; letter-spacing: clamp(0.5px, 0.2vw, 1px);">' + item.title + '</div>';
                }
                
                sectionHtml += '</div>';
            }

            // 섹션 다음에 페이지가 있으면 컨테이너에 추가, 없으면 바로 출력
            if (isInSection) {
                sectionContainerHtml += sectionHtml;
            } else {
                html += '<div style="box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width: 900px; margin: 5px auto; border-radius: 10px; background-color: ' + currentSectionTheme.bg + '; padding: 0; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + ';">';
                html += sectionHtml;
                html += '</div>';
                // 다음 항목도 섹션인 경우 간격 추가
                if (index + 1 < pages.length && pages[index + 1].itemType === 'section') {
                    html += '<br>';
                }
            }
        }
        // 페이지인 경우
        else {
            pageNumber++; // 페이지 번호 증가

            // 현재 편집 중인 페이지라면 모달의 값을 실시간으로 반영
            let currentPage = item;
            if (currentEditingIndex === index && item.itemType !== 'section') {
                currentPage = {
                    itemType: 'page',
                    type: globalTheme,
                    title: document.getElementById('pageTitle').value,
                    subtitle: document.getElementById('pageSubtitle').value,
                    content: document.getElementById('pageContent').value,
                    imageWidth: currentEditingIndex !== null && pages[currentEditingIndex] ? pages[currentEditingIndex].imageWidth : 100,
                    bgImage: null,
                    collapsed: false, // 기본값: 접힌 상태
                    useGlobalTags: true,
                    tags: [],
                    headerImage: null,
                    headerFocusX: 50,
                    headerFocusY: 50
                };
            }

            const theme = getTheme(globalTheme);

            // 페이지 헤더 텍스트 생성 (넘버 + 제목 + 부제목)
            let headerText = '#' + pageNumber;
            if (currentPage.title && currentPage.title.trim()) {
                headerText += ' ' + currentPage.title;
            }
            if (currentPage.subtitle && currentPage.subtitle.trim()) {
                headerText += ' - ' + currentPage.subtitle;
            }

            let pageContentHtml = '';
            const header = createHeader(headerText, theme, currentPage.headerImage, currentPage.headerFocusX, currentPage.headerFocusY);

            // 글로벌 태그 기능 완전히 제거 (Cover 태그는 유지)

            const isExpanded = currentPage.collapsed;

            // ── 페이지 접기 OFF: 헤더 없이 본문만 펼쳐서 표시 (옵션에 따라 헤더 포함) ──
            if (!enablePageFold) {
                const pageImageWidth = (currentPage.imageWidth !== undefined && currentPage.imageWidth !== null) ? currentPage.imageWidth : 100;
                if (showHeaderWhenFoldOff) {
                    pageContentHtml += header;
                }
                pageContentHtml += '<div style="padding: clamp(20px, 4vw, 30px) clamp(30px, 5vw, 50px);">' + parseText(currentPage.content, theme, false, false, pageImageWidth) + '</div>';

                if (currentPage.bgImage) {
                    const pageHtml = createContainer(pageContentHtml, currentPage.type, currentPage.bgImage, false, null, null, false);
                    if (isInSection) {
                        sectionContainerHtml += pageHtml;
                    } else {
                        html += pageHtml;
                    }
                } else {
                    if (isInSection) {
                        sectionContainerHtml += pageContentHtml;
                        if (index + 1 < pages.length && pages[index + 1].itemType !== 'section') {
                            const hrColor = theme.divider || theme.tagText || 'rgba(0,0,0,0.1)';
                            sectionContainerHtml += '<div style="height: 1px; background-color: ' + hrColor + '; margin: clamp(10px, 2vw, 15px) clamp(30px, 5vw, 50px);"></div>';
                        }
                    } else {
                        html += createContainer(pageContentHtml, currentPage.type, currentPage.bgImage, false, null, null, false);
                    }
                }
            // ── 페이지 접기 ON: 기존 로직 ──
            } else if (isExpanded) {
                // 펼쳐진 상태: 헤더 + 본문 표시
                const pageImageWidth = (currentPage.imageWidth !== undefined && currentPage.imageWidth !== null) ? currentPage.imageWidth : 100;
                console.log('Page', index, 'imageWidth:', currentPage.imageWidth, 'using:', pageImageWidth);
                if (currentPage.bgImage) {
                    pageContentHtml += '<div style="padding: clamp(20px, 4vw, 30px) clamp(30px, 5vw, 50px);">' + parseText(currentPage.content, theme, false, false, pageImageWidth) + '</div>';
                } else {
                    // 단독 페이지는 header를 pageContentHtml에 포함하지 않음 (createContainer에서 처리)
                    pageContentHtml += '<div style="padding: clamp(20px, 4vw, 30px) clamp(30px, 5vw, 50px);">' + parseText(currentPage.content, theme, false, false, pageImageWidth) + '</div>';
                }

                // 이 페이지가 마지막 컨테이너인지 확인 (섹션 밖의 단독 페이지이고, 이후에 페이지나 코멘트가 없음)
                const isLastStandalonePage = !isInSection && index === pages.length - 1 && !hasCommentAtEnd;

                if (currentPage.bgImage) {
                    const pageHtml = createContainer(pageContentHtml, currentPage.type, currentPage.bgImage, false, header, null, false);
                    if (isInSection) {
                        sectionContainerHtml += pageHtml;
                    } else {
                        html += pageHtml;
                    }
                } else {
                    // 섹션 안에 있는 페이지는 개별 컨테이너 제거
                    if (isInSection) {
                        sectionContainerHtml += header + pageContentHtml;
                        // 다음 페이지가 있고 섹션이 아니면 구분선 추가
                        if (index + 1 < pages.length && pages[index + 1].itemType !== 'section') {
                            const hrColor = theme.divider || theme.tagText || 'rgba(0,0,0,0.1)';
                            sectionContainerHtml += '<div style="height: 1px; background-color: ' + hrColor + '; margin: clamp(10px, 2vw, 15px) clamp(30px, 5vw, 50px);"></div>';
                        }
                    } else {
                        html += createContainer(pageContentHtml, currentPage.type, currentPage.bgImage, false, header, null, false);
                    }
                }
            } else {
                // 접힌 상태: 헤더만 summary로, 본문은 접힌 내용으로
                // 본문 내용을 미리 준비 (펼쳤을 때 보여질 내용)
                const pageImageWidth = (currentPage.imageWidth !== undefined && currentPage.imageWidth !== null) ? currentPage.imageWidth : 100;
                console.log('Page', index, 'imageWidth (collapsed):', currentPage.imageWidth, 'using:', pageImageWidth);
                let collapsedContent = '<div style="padding: clamp(15px, 3vw, 20px) clamp(30px, 5vw, 50px);">' + parseText(currentPage.content, theme, false, false, pageImageWidth) + '</div>';

                // 이 페이지가 마지막 컨테이너인지 확인
                const isLastStandalonePage = !isInSection && index === pages.length - 1 && !hasCommentAtEnd;

                if (currentPage.bgImage) {
                    const pageHtml = createContainer(collapsedContent, currentPage.type, currentPage.bgImage, true, header, null, false);
                    if (isInSection) {
                        sectionContainerHtml += pageHtml;
                    } else {
                        html += pageHtml;
                    }
                } else {
                    // 섹션 안에 있는 페이지는 개별 컨테이너 제거하고 details만 추가
                    if (isInSection) {
                        const summaryStyle = 'cursor: pointer; list-style: none; outline: none; color: inherit; font-weight: normal;';
                        const collapsedHeaderHtml = header.replace('margin-bottom: 20px; padding-top: 20px;', 'margin: 0;').replace('vertical-align: center;', 'vertical-align: middle;');
                        // 테이블을 사용한 화살표 아이콘 (우측 정렬)
                        const arrowWrapperStart = '<div style="width: 100%; display: table;"><div style="display: table-row;"><div style="display: table-cell; vertical-align: middle;">';
                        const arrowWrapperMid = '</div><div style="display: table-cell; vertical-align: middle; width: clamp(50px, 10vw, 70px); text-align: right; padding-right: clamp(30px, 5vw, 50px);"><span style="font-size: ' + pxToClamp(headingFontSizes.sectionTitle) + '; color: ' + theme.tagText + ';">⌵</span></div></div></div>';
                        sectionContainerHtml += '<details style="margin: 0;">';
                        sectionContainerHtml += '<summary style="' + summaryStyle + '">' + arrowWrapperStart + collapsedHeaderHtml + arrowWrapperMid + '</summary>';
                        sectionContainerHtml += collapsedContent;
                        sectionContainerHtml += '</details>';
                        // 다음 페이지가 있고 섹션이 아니면 구분선 추가
                        if (index + 1 < pages.length && pages[index + 1].itemType !== 'section') {
                            const hrColor = theme.divider || theme.tagText || 'rgba(0,0,0,0.1)';
                            sectionContainerHtml += '<div style="height: 1px; background-color: ' + hrColor + '; margin: clamp(10px, 2vw, 15px) clamp(30px, 5vw, 50px);"></div>';
                        }
                    } else {
                        html += createContainer(collapsedContent, currentPage.type, currentPage.bgImage, true, header, null, false);
                    }
                }
            }

            // 섹션에 속하지 않은 페이지 뒤 간격 처리
            if (!isInSection && index < pages.length - 1) {
                html += '<br>';
            }
        }
    });

    // 마지막 섹션 컨테이너 출력
    if (isInSection && sectionContainerHtml) {
        const topPadding = currentSectionHasImage ? '0' : 'clamp(20px, 4vw, 30px)';
        html += '<div style="box-shadow:0 4px 16px rgba(0,0,0,0.1);max-width: 900px; margin: 5px auto; border-radius: 1rem; background-color: ' + currentSectionTheme.bg + '; padding: ' + topPadding + ' 0 clamp(20px, 4vw, 30px) 0; font-family: \'' + fontFamily + '\', ' + getFontFallback(fontFamily) + '; font-size: clamp(13px, 2.2vw, 14.2px);">';
        html += sectionContainerHtml;
        html += '</div>';
    }


    // 코멘트 섹션 추가
    const enableComment = document.getElementById('enableComment').checked;
    if (enableComment) {
        const commentText = document.getElementById('commentText').value;
        const commentNickname = document.getElementById('commentNickname').value;
        const commentTheme = globalTheme;

        if (commentText && commentText.trim()) {
            const theme = getTheme(commentTheme);
            // 앞에 페이지/섹션이 있을 때 코멘트 앞에 줄바꿈 추가
            if (pages.length > 0) {
                html += '<br>';
            }
            html += createCommentSection(commentText, commentNickname, theme);
        }
    }

    // 크레딧을 모든 컨테이너 바깥에 독립적으로 추가
    html += createCreditFooter();

    return html;
}

function updatePreview() {
    const html = generateHTML(true);
    const preview = document.getElementById('preview');
    preview.innerHTML = html;
}

async function copyToClipboard() {
    const content = generateHTML(false);

    try {
        await navigator.clipboard.writeText(content);
        showNotification('HTML 코드가 복사되었습니다!');

        // 미리보기 화면도 갱신 (선택사항, 하지만 일관성을 위해)
        updatePreview();
    } catch (err) {
        // 클립보드 API 실패 시 fallback
        const textarea = document.createElement('textarea');
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showNotification('HTML 코드가 복사되었습니다!');
        } catch (e) {
            console.error('복사 실패:', e);
            showNotification('복사에 실패했습니다.');
        }
        document.body.removeChild(textarea);
    }
}
// ─── 라이트/다크 모드 토글 ───
(function () {
    const themeToggleBtn = document.getElementById('themeToggle');
    const iconLight = document.getElementById('icon-theme-light');
    const iconDark = document.getElementById('icon-theme-dark');
    const THEME_KEY = 'owb_ui_theme'; // localStorage 키

    // 저장된 모드 복원
    function applyTheme(mode) {
        if (mode === 'light') {
            document.body.classList.add('light-mode');
            iconLight.style.display = 'none';   // 라이트 모드 → 달 아이콘 표시
            iconDark.style.display = 'block';
        } else {
            document.body.classList.remove('light-mode');
            iconLight.style.display = 'block';  // 다크 모드 → 태양 아이콘 표시
            iconDark.style.display = 'none';
        }
    }

    // 초기 로드
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved || 'light');

    // 클릭 토글
    themeToggleBtn.addEventListener('click', function () {
        const isLight = document.body.classList.contains('light-mode');
        const next = isLight ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
    });
})();
function moveProfileUp(index) {
    if (index > 0) {
        const temp = profiles[index];
        profiles[index] = profiles[index - 1];
        profiles[index - 1] = temp;
        updateProfilesList();
        updatePreview();
        saveToStorage();
    }
}

function moveProfileDown(index) {
    if (index < profiles.length - 1) {
        const temp = profiles[index];
        profiles[index] = profiles[index + 1];
        profiles[index + 1] = temp;
        updateProfilesList();
        updatePreview();
        saveToStorage();
    }
}

// 모바일 프리뷰 토글 기능
(function () {
    const toggleBtn = document.getElementById('togglePreview');
    const previewPanel = document.querySelector('.preview-panel');
    const eyeIcon = document.getElementById('icon-preview-eye');
    const editIcon = document.getElementById('icon-preview-edit');

    if (!toggleBtn || !previewPanel) return;

    // 아이콘 전환 함수
    function toggleIcons(showPreview) {
        if (showPreview) {
            eyeIcon.style.display = 'none';
            editIcon.style.display = 'block';
            toggleBtn.title = '편집으로 돌아가기';
        } else {
            eyeIcon.style.display = 'block';
            editIcon.style.display = 'none';
            toggleBtn.title = '미리보기 보기';
        }
    }

    // 프리뷰 토글
    toggleBtn.addEventListener('click', function () {
        const isVisible = previewPanel.classList.toggle('mobile-visible');
        toggleIcons(isVisible);
    });

    // 프리뷰 패널의 닫기 버튼 (::before pseudo-element)
    previewPanel.addEventListener('click', function (e) {
        // 프리뷰 패널의 배경이나 닫기 영역 클릭 시
        const rect = previewPanel.getBoundingClientRect();
        const closeButtonArea = {
            left: rect.right - 55,
            right: rect.right - 15,
            top: rect.top + 15,
            bottom: rect.top + 55
        };

        if (e.clientX >= closeButtonArea.left &&
            e.clientX <= closeButtonArea.right &&
            e.clientY >= closeButtonArea.top &&
            e.clientY <= closeButtonArea.bottom) {
            previewPanel.classList.remove('mobile-visible');
            toggleIcons(false);
        }
    });

    // ESC 키로 프리뷰 닫기
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && previewPanel.classList.contains('mobile-visible')) {
            previewPanel.classList.remove('mobile-visible');
            toggleIcons(false);
        }
    });
})();

// ========================================
//  프리셋 기능
// ========================================

// 프리셋 초기화
function initializePresets() {
    const presetsContainer = document.getElementById('presetSlots');
    if (!presetsContainer) return;

    // 저장된 프리셋 불러오기
    loadPresets();
}

// 프리셋 불러오기
function loadPresets() {
    try {
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        const presets = savedPresets ? JSON.parse(savedPresets) : {};
        
        renderPresetSlots(presets);
    } catch (error) {
        console.error('프리셋 불러오기 실패:', error);
    }
}

// 프리셋 슬롯 렌더링
function renderPresetSlots(presets) {
    const presetsContainer = document.getElementById('presetSlots');
    if (!presetsContainer) return;
    
    presetsContainer.innerHTML = '';
    
    // 저장된 프리셋들을 슬롯으로 렌더링
    const presetKeys = Object.keys(presets).map(Number).sort((a, b) => a - b);
    
    presetKeys.forEach(index => {
        const preset = presets[index];
        const slotDiv = document.createElement('div');
        slotDiv.className = 'preset-slot has-data';
        slotDiv.dataset.slotIndex = index;
        
        slotDiv.innerHTML = `
            <div class="preset-number">${index + 1}</div>
            <div class="preset-info">
                <div class="preset-name">${preset.name || `프리셋 ${index + 1}`}</div>
                <div class="preset-date">${preset.date || ''}</div>
            </div>
            <div class="preset-actions">
                <button class="btn-load-preset" onclick="loadPreset(${index})">불러오기</button>
                <button class="btn-save-preset" onclick="savePreset(${index})">덮어쓰기</button>
                <button class="btn-rename-preset" onclick="renamePreset(${index})" title="이름 수정">✎</button>
                <button class="btn-delete-preset" onclick="deletePreset(${index})" title="삭제">×</button>
            </div>
        `;
        
        presetsContainer.appendChild(slotDiv);
    });
    
    // 현재 프리셋 저장 버튼 (항상 맨 아래)
    const saveNewBtn = document.createElement('button');
    saveNewBtn.className = 'btn-save-new-preset';
    saveNewBtn.textContent = presetKeys.length === 0 ? '프리셋 저장하기' : '+ 새 프리셋 저장';
    saveNewBtn.onclick = saveNewPreset;
    presetsContainer.appendChild(saveNewBtn);
}

// 새 프리셋 저장 (빈 슬롯 찾아서 저장)
function saveNewPreset() {
    try {
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        const presets = savedPresets ? JSON.parse(savedPresets) : {};
        
        // 비어있는 가장 작은 인덱스 찾기
        let newIndex = 0;
        while (presets[newIndex] !== undefined) {
            newIndex++;
        }
        
        if (newIndex >= 20) {
            alert('프리셋은 최대 20개까지 저장할 수 있습니다.');
            return;
        }
        
        const presetName = prompt('프리셋 이름을 입력하세요:', `프리셋 ${newIndex + 1}`);
        if (presetName === null || presetName.trim() === '') return; // 취소 또는 빈 문자열
        
        // 현재 상태 수집
        const currentData = {
            useRoundedQuotes: document.getElementById('useRoundedQuotes')?.checked,
            useTextIndent: document.getElementById('useTextIndent')?.checked,
            enableTopSection: document.getElementById('enableTopSection')?.checked,
            enableCover: document.getElementById('enableCover')?.checked,
            coverImage: document.getElementById('coverImage')?.value,
            coverZoom: parseInt(document.getElementById('coverZoom')?.value || 120),
            coverFocusX: parseInt(document.getElementById('coverFocusX')?.value || 50),
            coverFocusY: parseInt(document.getElementById('coverFocusY')?.value || 50),
            coverArchiveNo: document.getElementById('coverArchiveNo')?.value,
            coverTitle: document.getElementById('coverTitle')?.value,
            coverSubtitle: document.getElementById('coverSubtitle')?.value,
            enableProfiles: document.getElementById('enableProfiles')?.checked,
            introText: document.getElementById('introText')?.value,
            summaryText: document.getElementById('summaryText')?.value,
            soundtrackUrl: document.getElementById('soundtrackUrl')?.value,
            soundtrackTitle: document.getElementById('soundtrackTitle')?.value,
            soundtrackArtist: document.getElementById('soundtrackArtist')?.value,
            enableComment: document.getElementById('enableComment')?.checked,
            commentText: document.getElementById('commentText')?.value,
            commentNickname: document.getElementById('commentNickname')?.value,
            enableTags: document.getElementById('enableTags')?.checked,
            customColors: {
                bg: getColorValue('customBg'),
                text: getColorValue('customText'),
                em: getColorValue('customEm'),
                header: getColorValue('customHeader'),
                quote1Bg: getColorValue('customQuote1Bg'),
                quote1Text: getColorValue('customQuote1Text'),
                quote2Bg: getColorValue('customQuote2Bg'),
                quote2Text: getColorValue('customQuote2Text'),
                tagText: getColorValue('customTagText'),
                divider: getColorValue('customDivider')
            },
            pages: pages,
            tags: tags,
            replacements: replacements,
            customThemes: customThemes,
            profiles: profiles,
            textSpacing: textSpacing,
            fontFamily: fontFamily,
            globalTheme: globalTheme,
            hidePageNumbers: hidePageNumbers,
            headingFontSizes: headingFontSizes,
            enablePageFold: enablePageFold,
            showHeaderWhenFoldOff: showHeaderWhenFoldOff,
            dividerStyle: dividerStyle,
            dividerCustomText: dividerCustomText
        };
        
        presets[newIndex] = {
            name: presetName.trim(),
            date: new Date().toLocaleString('ko-KR'),
            data: currentData
        };
        
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        
        loadPresets();
        showNotification(`프리셋 "${presetName}" 저장 완료!`);
    } catch (error) {
        console.error('프리셋 저장 실패:', error);
        showNotification('프리셋 저장 실패: ' + error.message);
    }
}

// 현재 설정을 프리셋으로 저장
function savePreset(slotIndex) {
    try {
        const presetName = prompt('프리셋 이름을 입력하세요:', `프리셋 ${slotIndex + 1}`);
        if (presetName === null) return; // 취소
        
        // 현재 상태 수집
        const currentData = {
            useRoundedQuotes: document.getElementById('useRoundedQuotes')?.checked,
            useTextIndent: document.getElementById('useTextIndent')?.checked,
            enableTopSection: document.getElementById('enableTopSection')?.checked,
            enableCover: document.getElementById('enableCover')?.checked,
            coverImage: document.getElementById('coverImage')?.value,
            coverAutoFit: document.getElementById('coverAutoFit')?.checked,
            coverZoom: parseInt(document.getElementById('coverZoom')?.value || 120),
            coverFocusX: parseInt(document.getElementById('coverFocusX')?.value || 50),
            coverFocusY: parseInt(document.getElementById('coverFocusY')?.value || 50),
            coverArchiveNo: document.getElementById('coverArchiveNo')?.value,
            coverTitle: document.getElementById('coverTitle')?.value,
            coverSubtitle: document.getElementById('coverSubtitle')?.value,
            enableProfiles: document.getElementById('enableProfiles')?.checked,
            introText: document.getElementById('introText')?.value,
            summaryText: document.getElementById('summaryText')?.value,
            soundtrackUrl: document.getElementById('soundtrackUrl')?.value,
            soundtrackTitle: document.getElementById('soundtrackTitle')?.value,
            soundtrackArtist: document.getElementById('soundtrackArtist')?.value,
            enableComment: document.getElementById('enableComment')?.checked,
            commentText: document.getElementById('commentText')?.value,
            commentNickname: document.getElementById('commentNickname')?.value,
            enableTags: document.getElementById('enableTags')?.checked,
            customColors: {
                bg: getColorValue('customBg'),
                text: getColorValue('customText'),
                em: getColorValue('customEm'),
                header: getColorValue('customHeader'),
                quote1Bg: getColorValue('customQuote1Bg'),
                quote1Text: getColorValue('customQuote1Text'),
                quote2Bg: getColorValue('customQuote2Bg'),
                quote2Text: getColorValue('customQuote2Text'),
                tagText: getColorValue('customTagText'),
                divider: getColorValue('customDivider')
            },
            pages: pages,
            tags: tags,
            replacements: replacements,
            customThemes: customThemes,
            profiles: profiles,
            textSpacing: textSpacing,
            fontFamily: fontFamily,
            globalTheme: globalTheme,
            hidePageNumbers: hidePageNumbers,
            enablePageFold: enablePageFold,
            showHeaderWhenFoldOff: showHeaderWhenFoldOff,
            dividerStyle: dividerStyle,
            dividerCustomText: dividerCustomText
        };
        
        // 프리셋 저장
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        const presets = savedPresets ? JSON.parse(savedPresets) : {};
        
        presets[slotIndex] = {
            name: presetName,
            date: new Date().toLocaleString('ko-KR'),
            data: currentData
        };
        
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        
        // UI 업데이트
        loadPresets();
        showNotification(`프리셋 "${presetName}" 저장 완료!`);
    } catch (error) {
        console.error('프리셋 저장 실패:', error);
        showNotification('프리셋 저장 실패: ' + error.message);
    }
}

// 프리셋 불러오기
function loadPreset(slotIndex) {
    try {
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        if (!savedPresets) return;
        
        const presets = JSON.parse(savedPresets);
        const preset = presets[slotIndex];
        
        if (!preset || !preset.data) {
            showNotification('프리셋 데이터가 없습니다.');
            return;
        }
        
        if (!confirm(`"${preset.name}" 프리셋을 불러오시겠습니까?\n현재 작업 중인 데이터가 사라집니다.`)) {
            return;
        }
        
        const data = preset.data;
        
        // 데이터 복원
        if (data.useRoundedQuotes !== undefined) document.getElementById('useRoundedQuotes').checked = data.useRoundedQuotes;
        if (data.useTextIndent !== undefined) document.getElementById('useTextIndent').checked = data.useTextIndent;
        if (data.enableTopSection !== undefined) {
            document.getElementById('enableTopSection').checked = data.enableTopSection;
            document.getElementById('topSectionContent').style.display = data.enableTopSection ? 'block' : 'none';
        }
        
        if (data.enableCover !== undefined) {
            document.getElementById('enableCover').checked = data.enableCover;
            document.getElementById('coverContent').style.display = data.enableCover ? 'block' : 'none';
        }
        if (data.coverImage !== undefined) document.getElementById('coverImage').value = data.coverImage;
        if (data.coverAutoFit !== undefined) {
            document.getElementById('coverAutoFit').checked = data.coverAutoFit;
            const coverManualControls = document.getElementById('coverManualControls');
            if (coverManualControls) {
                coverManualControls.style.display = data.coverAutoFit ? 'none' : 'block';
            }
        }
        if (data.coverZoom !== undefined) {
            document.getElementById('coverZoom').value = data.coverZoom;
            document.getElementById('coverZoomValue').textContent = data.coverZoom + '%';
        }
        if (data.coverFocusX !== undefined) {
            document.getElementById('coverFocusX').value = data.coverFocusX;
            document.getElementById('coverFocusXValue').textContent = data.coverFocusX + '%';
        }
        if (data.coverFocusY !== undefined) {
            document.getElementById('coverFocusY').value = data.coverFocusY;
            document.getElementById('coverFocusYValue').textContent = data.coverFocusY + '%';
        }
        if (data.coverArchiveNo !== undefined) document.getElementById('coverArchiveNo').value = data.coverArchiveNo;
        if (data.coverTitle !== undefined) document.getElementById('coverTitle').value = data.coverTitle;
        if (data.coverSubtitle !== undefined) document.getElementById('coverSubtitle').value = data.coverSubtitle;
        
        if (data.enableProfiles !== undefined) {
            document.getElementById('enableProfiles').checked = data.enableProfiles;
            document.getElementById('profileInputs').style.display = data.enableProfiles ? 'block' : 'none';
        }
        if (data.introText !== undefined) document.getElementById('introText').value = data.introText;
        if (data.summaryText !== undefined) document.getElementById('summaryText').value = data.summaryText;
        if (data.soundtrackUrl !== undefined) document.getElementById('soundtrackUrl').value = data.soundtrackUrl;
        if (data.soundtrackTitle !== undefined) document.getElementById('soundtrackTitle').value = data.soundtrackTitle;
        if (data.soundtrackArtist !== undefined) document.getElementById('soundtrackArtist').value = data.soundtrackArtist;
        
        if (data.enableComment !== undefined) {
            document.getElementById('enableComment').checked = data.enableComment;
            document.getElementById('commentContent').style.display = data.enableComment ? 'block' : 'none';
        }
        if (data.commentText !== undefined) document.getElementById('commentText').value = data.commentText;
        if (data.commentNickname !== undefined) document.getElementById('commentNickname').value = data.commentNickname;
        
        if (data.enableTags !== undefined) {
            document.getElementById('enableTags').checked = data.enableTags;
            document.getElementById('tagsInputs').style.display = data.enableTags ? 'block' : 'none';
        }

        // 커스텀 색상 복원
        if (data.customColors) {
            setColorInputValue('customBg', data.customColors.bg);
            setColorInputValue('customText', data.customColors.text);
            setColorInputValue('customEm', data.customColors.em);
            setColorInputValue('customHeader', data.customColors.header);
            setColorInputValue('customQuote1Bg', data.customColors.quote1Bg);
            setColorInputValue('customQuote1Text', data.customColors.quote1Text);
            setColorInputValue('customQuote2Bg', data.customColors.quote2Bg);
            setColorInputValue('customQuote2Text', data.customColors.quote2Text);
            setColorInputValue('customTagText', data.customColors.tagText);
            setColorInputValue('customDivider', data.customColors.divider);
        }

        // 배열 데이터 복원
        if (data.pages) {
            pages = JSON.parse(JSON.stringify(data.pages));
            updatePagesList();
        }
        if (data.tags) {
            tags = JSON.parse(JSON.stringify(data.tags));
            updateTagsList();
        }
        if (data.replacements) {
            replacements = JSON.parse(JSON.stringify(data.replacements));
            updateReplacementsList();
        }
        if (data.customThemes) {
            customThemes = JSON.parse(JSON.stringify(data.customThemes));
            updateCustomThemesList();
        }
        if (data.profiles) {
            profiles = JSON.parse(JSON.stringify(data.profiles));
            updateProfilesList();
        }

        // 텍스트 간격 복원
        if (data.textSpacing) {
            textSpacing = data.textSpacing;
            const textSizeInput = document.getElementById('textSizeInput');
            const textSizeSlider = document.getElementById('textSizeSlider');
            const lineHeightInput = document.getElementById('lineHeightInput');
            const lineHeightSlider = document.getElementById('lineHeightSlider');
            const letterSpacingInput = document.getElementById('letterSpacingInput');
            const letterSpacingSlider = document.getElementById('letterSpacingSlider');
            const paragraphSpacingInput = document.getElementById('paragraphSpacingInput');
            const paragraphSpacingSlider = document.getElementById('paragraphSpacingSlider');
            const textIndentInput = document.getElementById('textIndentInput');
            const textIndentSlider = document.getElementById('textIndentSlider');
            
            if (textSizeInput) textSizeInput.value = textSpacing.fontSize;
            if (textSizeSlider) textSizeSlider.value = textSpacing.fontSize;
            if (lineHeightInput) lineHeightInput.value = textSpacing.lineHeight;
            if (lineHeightSlider) lineHeightSlider.value = textSpacing.lineHeight;
            if (letterSpacingInput) letterSpacingInput.value = textSpacing.letterSpacing;
            if (letterSpacingSlider) letterSpacingSlider.value = textSpacing.letterSpacing;
            if (paragraphSpacingInput) paragraphSpacingInput.value = textSpacing.paragraphSpacing;
            if (paragraphSpacingSlider) paragraphSpacingSlider.value = textSpacing.paragraphSpacing;
            if (textIndentInput) textIndentInput.value = textSpacing.textIndent;
            if (textIndentSlider) textIndentSlider.value = textSpacing.textIndent;
        }

        // 폰트 복원
        if (data.fontFamily) {
            fontFamily = data.fontFamily;
            const fontFamilySelect = document.getElementById('fontFamily');
            if (fontFamilySelect) fontFamilySelect.value = fontFamily;
        }

        // 제목 크기 복원
        if (data.headingFontSizes) {
            headingFontSizes = { ...headingFontSizes, ...data.headingFontSizes };
            const _hmap2 = {
                coverArchiveNo:  { slider: 'coverArchiveNoSizeSlider',  input: 'coverArchiveNoSizeInput',  display: 'coverArchiveNoSizeDisplay' },
                coverTitle:      { slider: 'coverTitleSizeSlider',      input: 'coverTitleSizeInput',      display: 'coverTitleSizeDisplay' },
                coverSubtitle:   { slider: 'coverSubtitleSizeSlider',   input: 'coverSubtitleSizeInput',   display: 'coverSubtitleSizeDisplay' },
                coverTag:        { slider: 'coverTagSizeSlider',        input: 'coverTagSizeInput',        display: 'coverTagSizeDisplay' },
                sectionTitle:    { slider: 'sectionTitleSizeSlider',    input: 'sectionTitleSizeInput',    display: 'sectionTitleSizeDisplay' },
                sectionSubtitle: { slider: 'sectionSubtitleSizeSlider', input: 'sectionSubtitleSizeInput', display: 'sectionSubtitleSizeDisplay' },
                pageHeaderNum:   { slider: 'pageHeaderNumSizeSlider',   input: 'pageHeaderNumSizeInput',   display: 'pageHeaderNumSizeDisplay' },
                pageHeaderTitle: { slider: 'pageHeaderTitleSizeSlider', input: 'pageHeaderTitleSizeInput', display: 'pageHeaderTitleSizeDisplay' },
            };
            Object.keys(headingFontSizes).forEach(k => {
                if (!_hmap2[k]) return;
                const sl = document.getElementById(_hmap2[k].slider);
                const inp = document.getElementById(_hmap2[k].input);
                const dsp = document.getElementById(_hmap2[k].display);
                if (sl) sl.value = headingFontSizes[k];
                if (inp) inp.value = headingFontSizes[k];
                if (dsp) dsp.textContent = headingFontSizes[k] + 'px';
            });
        }

        // 전역 테마 복원
        if (data.globalTheme) {
            globalTheme = data.globalTheme;
            const themeSelect = document.getElementById('globalTheme');
            if (themeSelect) themeSelect.value = globalTheme;
        }

        // 페이지 번호 숨김 설정 복원
        if (data.hidePageNumbers !== undefined) {
            hidePageNumbers = data.hidePageNumbers;
            const hidePageNumbersCheckbox = document.getElementById('hidePageNumbers');
            if (hidePageNumbersCheckbox) hidePageNumbersCheckbox.checked = hidePageNumbers;
        }

        // 페이지 접기 설정 복원
        if (data.enablePageFold !== undefined) {
            enablePageFold = data.enablePageFold;
        } else {
            enablePageFold = true;
        }
        const presetPageFoldEl = document.getElementById('enablePageFold');
        if (presetPageFoldEl) presetPageFoldEl.checked = enablePageFold;

        showHeaderWhenFoldOff = data.showHeaderWhenFoldOff || false;
        const presetShEl = document.getElementById('showHeaderWhenFoldOff');
        if (presetShEl) presetShEl.checked = showHeaderWhenFoldOff;

        dividerStyle = data.dividerStyle || 'line';
        dividerCustomText = data.dividerCustomText || '';
        const presetDsEl = document.getElementById('dividerStyle');
        const presetDcEl = document.getElementById('dividerCustomText');
        if (presetDsEl) { presetDsEl.value = dividerStyle; }
        if (presetDcEl) { presetDcEl.value = dividerCustomText; presetDcEl.style.display = dividerStyle === 'custom' ? 'block' : 'none'; }

        // 미리보기 업데이트 및 로컬 스토리지 저장
        updatePreview();
        saveToStorage();
        
        showNotification(`프리셋 "${preset.name}" 불러오기 완료!`);
    } catch (error) {
        console.error('프리셋 불러오기 실패:', error);
        showNotification('프리셋 불러오기 실패: ' + error.message);
    }
}

// 프리셋 삭제
function deletePreset(slotIndex) {
    try {
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        if (!savedPresets) return;
        
        const presets = JSON.parse(savedPresets);
        const preset = presets[slotIndex];
        
        if (!preset) return;
        
        if (!confirm(`"${preset.name}" 프리셋을 삭제하시겠습니까?`)) {
            return;
        }
        
        delete presets[slotIndex];
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        
        loadPresets();
        showNotification('프리셋 삭제 완료!');
    } catch (error) {
        console.error('프리셋 삭제 실패:', error);
        showNotification('프리셋 삭제 실패: ' + error.message);
    }
}

// 프리셋 이름 수정
function renamePreset(slotIndex) {
    try {
        const savedPresets = localStorage.getItem(PRESET_STORAGE_KEY);
        if (!savedPresets) return;
        
        const presets = JSON.parse(savedPresets);
        const preset = presets[slotIndex];
        
        if (!preset) return;
        
        const newName = prompt('새로운 프리셋 이름을 입력하세요:', preset.name);
        if (newName === null || newName.trim() === '') return; // 취소 또는 빈 문자열
        
        preset.name = newName.trim();
        localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
        
        loadPresets();
        showNotification('프리셋 이름 변경 완료!');
    } catch (error) {
        console.error('프리셋 이름 변경 실패:', error);
        showNotification('프리셋 이름 변경 실패: ' + error.message);
    }
}