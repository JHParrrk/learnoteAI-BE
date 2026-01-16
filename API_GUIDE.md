# 📝 API Update Guide: Learning Todos & Note Analysis

이 문서는 프론트엔드 개발를 위해 `POST /notes/:id/todos` 및 관련 API의 변경 사항, 사용법, 그리고 사용자 워크플로우를 설명합니다.

---

## 1. 🔄 변경 사항 (Before vs After)

| 기능                      | 변경 전 (Before)              | 변경 후 (After)                                                                    |
| :------------------------ | :---------------------------- | :--------------------------------------------------------------------------------- |
| **할 일 저장 (Save)**     | 단순히 내용(`content`)만 저장 | **`dueDate` (마감일) 설정 가능**, `deadlineType` 지원                              |
| **중복 처리**             | 중복된 내용도 계속 추가됨     | **중복 방지 로직 적용** (이미 해당 노트에 같은 내용의 Todo가 있다면 저장하지 않음) |
| **체크 상태 (isChecked)** | 기본값 정의 불명확            | **저장 시 기본적으로 `isChecked: true`로 설정됨**                                  |
| **분석 조회 (Analysis)**  | 제안된 Todo 목록만 반환       | **`isCreated` (DB 존재 여부)**와 **`isChecked` (체크 상태)**를 함께 반환           |

---

## 2. 🔌 API 사용 가이드

### 2.1. 필드 개념 이해 (중요)

- **`isCreated` (저장 여부)**: 분석 결과에서 제안된 '추천 항목'이 실제 DB(`learning_todos` 테이블)에 데이터로 생성되었는지 여부입니다. 이는 DB에 직접 저장된 컬럼이 아니라, 추천 항목의 내용이 실제 Todo 테이블에 존재하는지를 서버에서 동적으로 체크하여 반환하는 값입니다.
  - **상태 변화**: `POST /notes/:id/todos` API를 통해 항목을 저장하면, 이후 `GET /notes/:id/analysis` 호출 시 해당 항목의 `isCreated`가 `true`로 반환됩니다.

- **`isChecked` (체크 여부)**: 해당 할 일이 실제 '체크(선택)'되어 저장된 상태인지를 나타냅니다. DB의 `is_checked` 컬럼 값을 반영합니다.
  - **`isCreated: true`인 경우**: DB에 저장된 실제 `is_checked` 값을 반환합니다. (현재 로직상 저장 시 기본값이 `true`이므로, 새로 저장된 항목은 자동으로 `true`가 됩니다.)
  - **`isCreated: false`인 경우**: 아직 DB에 저장되지 않은 추천 단계이므로 항상 `false`입니다.

---

### 2.2. 학습 할 일 저장 (Save Learning Todos)

노트 분석 결과에서 사용자가 선택한 추천 할 일(Suggested Todos)을 실제 DB에 저장할 때 사용합니다. `isChecked`나 `isCreated`는 서버에서 자동으로 처리하므로 요청 본문에 포함할 필요가 없습니다.

**요청 (Request Body):**

```json
{
  "todos": [
    {
      "content": "React Hooks 심화 학습",
      "reason": "분석 결과에서 추천됨",
      "dueDate": "2026-01-20", // [New] 마감일 지정 가능 (YYYY-MM-DD)
      "deadlineType": "SHORT_TERM" // 단기/장기 목표 설정 (옵션, null 허용)
    },
    {
      "content": "NestJS 데코레이터 패턴 실습",
      "dueDate": "2026-02-01",
      "deadlineType": null
    }
  ]
}
```

**응답 (Response):**
_이미 존재하는 Todo는 제외되고, 새로 생성된 항목만 반환됩니다._

```json
[
  {
    "id": 15,
    "noteId": 3,
    "userId": 1,
    "content": "React Hooks 심화 학습",
    "dueDate": "2026-01-20",
    "status": "PENDING",
    "deadlineType": "SHORT_TERM",
    "createdAt": "2026-01-17T09:00:00.000Z",
    "isChecked": true // ✅ 중요: 저장되면서 '체크됨(True)' 상태로 반환됩니다.
  }
]
```

---

### 2.2. 노트 분석 결과 조회 (Get Analysis)

UI를 그릴 때 어떤 Todo가 이미 저장되어 있는지 확인하기 위해 사용합니다.

- **Endpoint:** `GET /notes/:id/analysis`

**응답 예시 (Response):**

```json
{
  "noteId": 3,
  "status": "COMPLETED",
  "suggestedTodos": [
    {
      "content": "React Hooks 심화 학습",
      "dueDate": "2026-01-15",
      "isCreated": true, // ✅ 이미 DB에 저장된 항목임 -> UI에서 '저장됨' 표시 또는 버튼 비활성화
      "isChecked": true // ✅ 저장된 항목이므로 체크 상태도 true
    },
    {
      "content": "새로운 추천 학습 주제",
      "isCreated": false, // ❌ 아직 저장 안 됨 -> '저장' 버튼 활성화 필요
      "isChecked": false
    }
  ]
  // ... 나머지 필드 (summary, validation 등)
}
```

---

## 3. 🖼 사용자 워크플로우 (Frontend Flow)

변경된 API를 바탕으로 한 권장 사용자 시나리오는 다음과 같습니다.

### Step 1: 노트 분석 결과 확인

1.  사용자가 노트 상세 페이지에 진입하여 **AI 분석 탭**을 엽니다.
2.  프론트는 `GET /notes/:id/analysis`를 호출합니다.
3.  **Suggested Todos** 섹션을 렌더링합니다.
    - `isCreated: true`인 항목: 이미 내 할 일 목록에 추가된 상태입니다. 체크 표시(✅)를 보여주거나 "저장됨"으로 표시하여 중복 저장을 막습니다.
    - `isCreated: false`인 항목: 아직 추가하지 않은 항목입니다. "추가하기" 버튼을 노출합니다.

### Step 2: 할 일 추가 (저장) 시도

1.  사용자가 `isCreated: false`인 항목의 **"추가하기"** 버튼을 클릭하거나, 여러 개를 선택합니다.
2.  (옵션) 모달창이나 인풋 필드를 통해 **마감일(Date Picker)**을 선택하게 할 수 있습니다. (`dueDate` 필드 활용)
3.  사용자가 "저장"을 누르면 `POST /notes/:id/todos` API를 호출합니다.

### Step 3: 저장 후 UI 업데이트

1.  API 응답으로 **새로 생성된 Todo 목록**이 돌아옵니다.
    - 이때 `isChecked: true` 상태로 돌아옵니다.
2.  프론트엔드는 방금 저장한 항목의 상태를 **'저장됨(Saved)'** 상태로 변경합니다.
3.  사용자에게 "할 일 목록에 추가되었습니다."라는 메시지를 보여줍니다.

---

## 4. 💡 개발 참고 사항

- **중복 방지:** 사용자가 실수로 같은 버튼을 두 번 눌러도 백엔드에서 중복 생성을 막아주지만, UI에서도 `isCreated` 값을 활용해 버튼을 비활성화(disabled) 처리하는 것이 UX상 좋습니다.
- **기본값:** 별도 설정을 안 하면 `isChecked: true`로 저장됩니다. 이는 "AI의 제안을 수락하여 내 목록에 넣었다"는 의미입니다.
