# n8n-nodes-mediafx 프로젝트 규칙

## 프로젝트 개요
- **목적**: FFmpeg 기반 로컬 미디어 처리를 위한 n8n 커스텀 노드
- **범위**: 비디오, 오디오, 이미지, 텍스트/자막 처리
- **핵심 원칙**: 프라이버시 중심(로컬 처리), 외부 API 불필요, FFmpeg의 강력한 기능 활용

## 기술 스택
- **Runtime**: Node.js 16+
- **Framework**: n8n 1.0+
- **Core Dependency**: FFmpeg (via @ffmpeg-installer/ffmpeg, fallback: ffmpeg-static)
- **Language**: TypeScript
- **Package Manager**: npm

## 프로젝트 구조
```
n8n-nodes-mediafx/
├── nodes/           # 노드 구현 파일
├── credentials/     # 자격증명 정의 (있는 경우)
├── dist/           # 빌드된 파일
├── src/            # 소스 코드
├── package.json    # 패키지 정의
├── tsconfig.json   # TypeScript 설정
├── README.md       # 영문 문서
└── README.ko-KR.md # 한국어 문서
```

## 리소스 및 작업 구조

### Video Resource
- **Merge**: 여러 비디오 파일 결합
- **Trim**: 특정 구간 자르기
- **Transition**: 비디오 간 전환 효과 (FFmpeg 버전 자동 감지)
- **Fade**: 페이드 인/아웃 효과

### Audio Resource
- **Extract**: 비디오에서 오디오 추출 (MP3, WAV, AAC, FLAC)
- **Mix**: 고급 오디오 믹싱
  - 볼륨 조절 (독립적)
  - 전체/부분 믹스 모드
  - 오디오 루핑
  - 페이드 효과

### Image Resource
- **Image to Video**: 이미지를 비디오로 변환
- **Stamp Image**: 워터마크 기능
  - 위치, 크기, 회전, 투명도 제어
  - 시간 제어 (특정 구간 표시)

### Text Resource
- **Add String**: 텍스트 오버레이
- **Add Subtitle**: SRT 자막 파일 추가
- 스타일링 옵션: 폰트, 크기, 색상, 윤곽선, 배경
- 위치 지정: 정렬 프리셋 또는 커스텀 좌표
- 패딩 제어: 가로/세로 독립 조절

### Font Resource
- **List**: 시스템 및 사용자 글꼴 목록
- **Upload**: 커스텀 글꼴 업로드 (TTF, OTF)
- **Delete**: 업로드된 글꼴 삭제

## 코딩 규칙

### TypeScript 규칙
- n8n 노드 인터페이스 구현 (INodeType, INodeTypeDescription)
- 엄격한 타입 정의 사용
- 에러 처리 및 유효성 검사 포함

### FFmpeg 통합
- 자동 다운로드 메커니즘 (@ffmpeg-installer/ffmpeg)
- 폴백 지원 (ffmpeg-static)
- 버전 호환성 검사 (특히 전환 효과)
- 에러 핸들링 및 복구 전략

### 파라미터 명명 규칙
- 소스 관련: `source*`, `*Source`, `*SourceType`, `*SourceUrl`
- 시간 관련: `startTime`, `endTime`, `duration`
- 크기 관련: `width`, `height`, `videoSize`
- 효과 관련: `enable*`, `*Duration`, `*Volume`
- 출력 관련: `outputFormat`, `outputProperty`

### 파일 처리
- Binary 데이터 지원 (n8n binary property)
- URL 입력 지원
- 임시 파일 관리 및 정리
- 메모리 효율적 스트리밍

## 품질 기준
- 모든 작업은 로컬에서 실행
- FFmpeg 명령 실행 전 유효성 검사
- 명확한 에러 메시지 제공
- 리소스 정리 보장 (임시 파일 삭제)
- 한국어/영어 문서 동기화 유지

## 개발 워크플로우
1. `npm install` - 의존성 설치
2. `npm run dev` - 개발 모드 (watch & rebuild)
3. `npm run build` - 프로덕션 빌드
4. 로컬 n8n에 링크하여 테스트

## 버전 관리
- Semantic Versioning (SemVer) 준수
- Breaking changes는 major 버전 업데이트
- 새 기능은 minor 버전 업데이트
- 버그 수정은 patch 버전 업데이트

## 문서화 규칙
- README는 영어/한국어 버전 모두 유지
- 각 작업별 사용 예제 JSON 포함
- FFmpeg 설치 가이드 제공
- 지원 채널 명시 (GitHub Issues, Discussions, YouTube)

## 테스트 고려사항
- 다양한 미디어 형식 지원 확인
- FFmpeg 버전별 호환성 테스트
- 메모리 누수 방지
- 대용량 파일 처리 테스트
- 에러 케이스 처리 검증

## 배포
- npm 패키지로 배포 (n8n-nodes-mediafx)
- n8n 커뮤니티 노드로 등록
- GitHub 저장소 공개 유지
- MIT 라이선스

## 컨트리뷰션 가이드라인
- Issue 먼저 생성 후 PR
- 코드 스타일 일관성 유지
- 테스트 포함
- 문서 업데이트 필수
- 한국어/영어 문서 동시 업데이트