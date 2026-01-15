<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# LearnoTe AI Backend API Documentation

이 문서는 API 명세서입니다.
Base URL: `http://localhost:3000` (로컬 환경 기준)

## 📚 API 목록

### 1. 인증 (Authentication) - `/auth`

| Method | Endpoint       | 설명                    | Request Body / Params       | Response                               |
| :----- | :------------- | :---------------------- | :-------------------------- | :------------------------------------- |
| `POST` | `/auth/signup` | 회원가입                | `{ email, password, name }` | `{ id, email, name }`                  |
| `POST` | `/auth/login`  | 로그인                  | `{ email, password }`       | `{ access_token }`                     |
| `GET`  | `/auth/me`     | 내 정보 조회 (JWT 필수) | `Header: Bearer <token>`    | `{ message, user: { userId, email } }` |

### 2. 대시보드 (Dashboard) - `/dashboard`

| Method  | Endpoint               | 설명               | Request Body / Params                                  | Response              |
| :------ | :--------------------- | :----------------- | :----------------------------------------------------- | :-------------------- |
| `GET`   | `/dashboard`           | 대시보드 요약 조회 | Query: `?userId=1`                                     | `DashboardSummaryDto` |
| `GET`   | `/dashboard/todos`     | 투두 리스트 조회   | Query: `?userId=1`                                     | `LearningTodo[]`      |
| `POST`  | `/dashboard/todos`     | 투두 생성          | Body: `CreateTodoDto`, Query: `?userId=1`              | `LearningTodo`        |
| `PATCH` | `/dashboard/todos/:id` | 투두 수정          | Body: `UpdateTodoDto`, Param: `id`, Query: `?userId=1` | `LearningTodo`        |

**DTO 상세:**

- **CreateTodoDto**:
  - `content` (string, 필수): 투두 내용
  - `noteId` (number, 선택): 연결할 노트 ID - 노트와 연계되어서가 아닌 개인 목표 추가할때 사용
  - `dueDate` (string, 선택): 마감일 (ISO Date String)
  - `reason` (string, 선택): 생성 이유
  - `deadlineType` (enum, 선택): 'SHORT_TERM' | 'LONG_TERM'

### 3. 노트 (Notes) - `/notes` (JWT 필수)

모든 요청에 `Authorization: Bearer <token>` 헤더가 필요합니다.

| Method  | Endpoint              | 설명                     | Request Body / Params                 | Response                                  |
| :------ | :-------------------- | :----------------------- | :------------------------------------ | :---------------------------------------- |
| `POST`  | `/notes`              | 노트 생성 (AI 분석 시작) | `{ rawContent, title?, date? }`       | `{ noteId, status, message, rawContent }` |
| `GET`   | `/notes/:id/analysis` | 노트 분석 결과 조회      | Param: `id` (Note ID)                 | `NoteAnalysisResponse`                    |
| `POST`  | `/notes/:id/todos`    | 학습 투두 저장           | Param: `id`, Body: `{ todos: [...] }` | `SimpleMessageResponse`                   |
| `PATCH` | `/notes/:id`          | 노트 수정                | Param: `id`, Body: `UpdateNoteDto`    | `NoteEntity`                              |

**DTO 상세:**

- **CreateNoteDto**:
  - `rawContent` (string, 필수): 노트 원문 내용
  - `title` (string, 선택): 노트 제목
  - `date` (string, 선택): 노트 날짜

---

## 🛠 Project Setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
