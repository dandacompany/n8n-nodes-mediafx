# n8n-nodes-mediafx (한국어)

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-mediafx?style=flat-square)](https://www.npmjs.com/package/n8n-nodes-mediafx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![N8N Community Node](https://img.shields.io/badge/n8n-community--node-blue.svg?style=flat-square)](https://n8n.io)

이 저장소는 FFmpeg의 강력한 기능을 사용하여 포괄적인 로컬 미디어 처리를 위한 커스텀 n8n 노드를 포함하고 있습니다. 외부 API나 서비스 없이 n8n 워크플로우 내에서 직접 다양한 비디오, 오디오, 이미지, 텍스트 작업을 수행할 수 있습니다.

<!-- Optional: Add a GIF of the node in action here -->
<!-- <p align="center"><img src="link/to/your/demo.gif" alt="MediaFX Node Demo"></p> -->

## MediaFX를 사용해야 하는 이유

-   **프라이버시 중심**: 모든 처리가 n8n 인스턴스에서 로컬로 이루어집니다. 미디어 파일은 절대 서버 외부로 나가지 않습니다.
-   **외부 API 불필요**: API 키, 구독, 제3자 서비스 비용이 필요 없습니다.
-   **강력한 성능**: 고품질 미디어 조작을 위해 FFmpeg의 모든 기능을 활용합니다.
-   **자체 포함**: `ffmpeg`가 자동으로 포함되어 있어, 시스템 종속성을 수동으로 설치할 필요가 없습니다.
-   **유연성**: 간단한 자르기부터 복잡한 오디오 믹싱, 텍스트 오버레이까지 다양한 작업을 처리합니다.

## 주요 기능

-   **비디오 처리**: 여러 클립 병합, 특정 구간 자르기, 크로스페이드 전환 적용, 페이드 인/아웃 효과 추가.
-   **오디오 조작**: 비디오에서 오디오 추출, 볼륨 조절 옵션과 함께 새 오디오 트랙 믹싱 (전체 트랙 또는 특정 구간).
-   **이미지 작업**: 사용자 지정 크기 및 길이로 이미지에서 비디오 클립 생성, 워터마크로 이미지 오버레이(위치 및 투명도 조절).
-   **텍스트 및 자막**: 광범위한 스타일 옵션(글꼴, 크기, 색상, 위치, 배경 상자)으로 비디오에 텍스트 오버레이 추가, 외부 자막 파일(`.srt`) 추가 및 스타일링.
-   **글꼴 관리**: 텍스트 작업에 사용할 사용자 지정 글꼴(TTF, OTF) 업로드, 목록 조회, 미리보기 및 삭제.

## n8n에 설치하기

1.  **설정 > 커뮤니티 노드**로 이동합니다.
2.  **설치**를 클릭합니다.
3.  **npm 패키지 이름 입력** 필드에 `n8n-nodes-mediafx`를 입력합니다.
4.  **설치**를 다시 클릭합니다.

노드가 설치되고 n8n이 다시 시작됩니다. 그러면 노드 패널에서 "MediaFX" 노드를 찾을 수 있습니다.

구버전 n8n 또는 수동 설치의 경우:

1.  n8n 사용자 데이터 폴더(기본값: `~/.n8n/`)로 이동합니다.
2.  `nodes` 디렉토리로 들어갑니다: `cd ~/.n8n/nodes`.
3.  패키지를 설치합니다: `npm install n8n-nodes-mediafx`.
4.  n8n 인스턴스를 다시 시작합니다.

## 노드: MediaFX

모든 미디어 처리 작업을 위한 메인 노드입니다. `리소스` 유형을 선택한 다음 해당 리소스에 대해 수행할 `작업`을 선택합니다.

### 리소스 및 작업

#### **비디오** 리소스
-   `병합`: 여러 비디오 파일을 하나로 결합합니다.
-   `자르기`: 비디오를 특정 시작 및 종료 시간으로 자릅니다.
-   `오디오 믹싱`: 비디오의 기존 오디오 트랙에 오디오 파일을 믹싱합니다.
-   `텍스트 추가`: 비디오에 텍스트 오버레이를 추가합니다.
-   `자막 파일 추가`: `.srt` 파일에서 자막을 추가합니다.
-   `이미지 스탬프`: 비디오에 이미지(워터마크)를 오버레이합니다.

#### **오디오** 리소스
-   `추출`: 비디오 파일에서 오디오 트랙을 지정된 형식(예: mp3, aac)으로 추출합니다.
-   `오디오 믹싱`: 기본 비디오의 오디오를 보조 오디오 소스와 믹싱합니다. 특정 시간 구간에 반복 재생하는 고급 옵션을 포함합니다.

#### **이미지** 리소스
-   `이미지를 비디오로`: 소스 이미지에서 비디오를 생성하고, 길이 및 출력 크기를 지정합니다.
-   `이미지 스탬프`: 위치 및 투명도 옵션을 사용하여 비디오에 이미지를 오버레이합니다.

#### **전환** 리소스
-   `적용`: 두 개 이상의 비디오 클립 사이에 전환 효과를 적용합니다.
-   `페이드`: 비디오 클립에 페이드 인 또는 페이드 아웃 효과를 적용합니다.

#### **글꼴** 리소스
-   `목록`: 사용 가능한 모든 시스템 및 사용자 업로드 글꼴 목록을 가져옵니다.
-   `업로드`: 텍스트 작업에 사용할 사용자 지정 글꼴 파일(`.ttf`, `.otf`)을 업로드합니다.
-   `삭제`: 이전에 업로드한 사용자 글꼴을 제거합니다.
-   `미리보기`: 특정 글꼴의 메타데이터를 가져옵니다.
-   `검증`: 업로드 전에 글꼴 키가 고유한지 확인합니다.

## 사용 예제

### 이미지를 비디오로 변환
단일 이미지에서 1920x1080 해상도의 10초짜리 비디오를 만듭니다.

```json
{
  "resource": "image",
  "operation": "imageToVideo",
  "sourceImage": {
    "source": { "sourceType": "binary", "binaryProperty": "data" }
  },
  "duration": 10,
  "videoSize": {
    "width": 1920,
    "height": 1080
  },
  "outputFormat": "mp4"
}
```

### 고급 오디오 믹싱
`main_video.mp4`의 15초 지점부터 30초 동안 `new_audio.mp3`를 믹싱하고, 새 오디오가 30초보다 짧으면 반복 재생합니다.

```json
{
  "resource": "audio",
  "operation": "mixAudio",
  "mixVideoSource": { "source": { "value": "/path/to/main_video.mp4" } },
  "mixAudioSource": { "source": { "value": "/path/to/new_audio.mp3" } },
  "videoVolume": 1.0,
  "audioVolume": 0.5,
  "advancedMixing": {
    "enablePartialMix": true,
    "startTime": 15,
    "duration": 30,
    "loop": true
  }
}
```

### 사용자 지정 글꼴로 텍스트 오버레이 추가
미리 업로드된 사용자 지정 글꼴을 사용하여 비디오에 텍스트를 추가합니다.

```json
{
  "resource": "video",
  "operation": "addText",
  "source": { "source": { "binaryProperty": "data" } },
  "text": "안녕하세요, 커스텀 폰트!",
  "textOptions": {
    "font": "my-custom-font",
    "size": 48,
    "color": "yellow",
    "position": { "x": "(w-text_w)/2", "y": "h-th-20" }
  }
}
```

## 요구 사항

-   n8n: 버전 1.0 이상 권장.
-   Node.js: 버전 16 이상.

## 개발

이 노드에 기여하고 싶다면:

1. 이 저장소를 복제(Clone)합니다.
2. `npm install`로 종속성을 설치합니다.
3. `npm run build`로 노드를 빌드합니다.
4. 개발 중에는 `npm run dev`를 사용하여 변경 사항을 감시하고 자동으로 다시 빌드합니다.
5. [로컬 저장소를 n8n 노드 디렉토리에 연결합니다.](https://docs.n8n.io/integrations/creating-nodes/test-node/#linking-the-node)

## 라이선스

MIT 