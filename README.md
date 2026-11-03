# DevConnect — Full-Stack MERN Developer Platform

DevConnect is an end-to-end community platform and project marketplace that connects students, developers, freelancers, startups, and enterprise clients to collaborate, showcase portfolios, apply to projects, manage workspaces, and participate in technical discussions.

---

## 1. Technology Stack (Strictly JavaScript MERN)

| Tier | Technology | Purpose |
| :--- | :--- | :--- |
| **Database** | MongoDB & Mongoose | Document datastore, schema modeling, indexes, and transactions |
| **Backend** | Node.js & Express.js | REST API, centralized error handling, and WebSocket real-time server |
| **Frontend** | React 18 & Vite | Responsive single-page application with modern JSX and Vanilla CSS |
| **Realtime** | Socket.IO | Bidirectional messaging, typing indicators, and workspace events |
| **Auth** | JWT & Bcrypt.js | Stateless bearer tokens, HTTP cookies, and salted password hashing |
| **Testing** | Node.js Test Runner | Native async test runner (`node:test`, `node:assert/strict`) |

> **Note**: This project uses **pure JavaScript (ES6+ and JSX) only**. No TypeScript compilation is required.

---

## 2. Project Directory Structure

```text
community/
├── client/                     # Frontend Application (React + Vite + JSX)
│   ├── src/
│   │   ├── components/         # Reusable UI components (cards, layout, ui)
│   │   ├── features/           # Feature pages (auth, profile wizards)
│   │   ├── pages/              # Primary views (LandingPage, Projects, Chat, etc.)
│   │   ├── routes/             # Client-side routing (AppRoutes.jsx)
│   │   ├── services/           # Axios API client & service layers
│   │   ├── store/              # Zustand global state stores
│   │   ├── styles/             # Global CSS and design tokens (index.css)
│   │   ├── App.jsx             # Root application component
│   │   └── main.jsx            # React DOM mounting entry point
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend API (Node.js + Express.js)
│   ├── src/
│   │   ├── config/             # Environment validation (env.js) & Database (db.js)
│   │   ├── controllers/        # Request controllers
│   │   ├── middleware/         # Centralized errorHandler, notFound, authMiddleware
│   │   ├── models/             # Mongoose schemas (User, Project, Post, etc.)
│   │   ├── routes/             # Express v1 route routers
│   │   ├── socket/             # Socket.IO event setup
│   │   ├── utils/              # Custom application error classes (errors.js)
│   │   ├── app.js              # Express app factory with middleware & health checks
│   │   └── server.js           # Server entry point & graceful shutdown
│   ├── tests/
│   │   ├── unit/               # Environment & error middleware unit tests
│   │   └── integration/        # Health check & bootstrap integration tests
│   ├── package.json
│   └── .env.example
├── docs/                       # Architecture & documentation
├── .env.example                # Root environment variables template
├── .gitignore                  # Git exclusions for secrets and builds
└── README.md
```

---

## 3. Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB community server (port `27017`) or free MongoDB Atlas cluster

---

## 4. Environment Configuration

Copy the example environment file to create your local `.env`:

```bash
# In the server directory:
cp server/.env.example server/.env
```

### Environment Variables

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for the Express backend server |
| `NODE_ENV` | `development` | Runtime mode: `development`, `test`, or `production` |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/devconnect` | MongoDB connection URI |
| `JWT_SECRET` | *(random 32-char string)* | Signing secret for JSON Web Tokens |
| `CLIENT_URL` | `http://localhost:3000` | Allowed origin for CORS & cookies |

---

## 5. Quick Start Guide

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 2: Start the Backend Server

```bash
cd server
npm run dev
```

The backend server starts on `http://localhost:5000` with hot-reloading (`node --watch`).
- Health Check: `http://localhost:5000/api/health` or `http://localhost:5000/api/v1/health`

### Step 3: Start the Frontend Client

In a separate terminal:

```bash
cd client
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 6. Running Automated Tests

DevConnect uses the native Node.js Test Runner. Tests run directly with zero transpilation:

```bash
cd server
npm test
```

### Test Suite Summary

- **Unit Tests**:
  - `tests/unit/env.test.js`: Validates environment configuration parsing, port boundary checks, URI validation, and production secret checks (4 tests).
  - `tests/unit/error.test.js`: Validates malformed JSON formatting (400), Mongoose CastError (404), duplicate key error (400), Mongoose validation errors (400), and JWT expiration (401) (6 tests).
  - `tests/unit/user_model.test.js`: Validates User model schema requirements, username regex constraints, allowed role enums, `toJSON`/`toObject` password exclusion, and `toPublicProfile()` privacy redactions (5 tests).
  - `tests/unit/project_model.test.js`: Validates Project & Application schema limits, required fields, and unidirectional status transition rules (5 tests).
- **Integration Tests**:
  - `tests/integration/health.test.js`: Validates `GET /api/health`, `GET /api/v1/health`, root `GET /`, 404 structured fallback, and security headers (5 tests).
  - `tests/integration/auth_and_profiles.test.js`: Comprehensive Phase 2 test suite covering registration, login, token authentication, logout, profile reading/editing, mass-assignment defense, public profile sanitation, password changes, and crypto reset tokens (26 tests).
  - `tests/integration/projects_and_applications.test.js`: Comprehensive Phase 3 test suite covering project posting, discovery filters, pagination, unauthorized edit rejection, proposal submission, duplicate blocking, deadline enforcement, owner accept/reject decision lifecycle, and atomic team capacity concurrency enforcement (28 tests).
  - `tests/integration/workspace_membership.test.js`: Comprehensive Phase 4 test suite covering application acceptance to membership integration, idempotency, team capacity enforcement, unauthenticated & non-member rejection (401/403), active member workspace access, safe public member projection, role updates, voluntary member departures, owner removal of members, departure workspace access revocation (403), and immutable activity audit trails (22 tests).

**Result**: **101 / 101 tests passing across 23 suites (100% pass rate, ~12.4s duration)**.

---

## 7. Core API Endpoints

### System & Health
- `GET /api/health` — Primary health ping & database connection status
- `GET /api/v1/health` — v1 health endpoint
- `GET /` — API welcome message

### Authentication & Sessions (`/api/auth` & `/api/v1/auth`)
- `POST /register` — Register a new account (`name`, `username`, `email`, `password`, `role`).
- `POST /login` — Authenticate using email or username identifier and password.
- `POST /logout` — Invalidate session and clear `token` HttpOnly cookie.
- `GET /me` — Retrieve currently authenticated user identity and account status.
- `PATCH /change-password` — Change password for authenticated user (verifies current password).
- `POST /forgot-password` — Generate cryptographically secure single-use reset token hash.
- `POST /reset-password` — Consume single-use token to securely reset password with reuse prevention.

### User Profiles (`/api/users` & `/api/v1/users`)
- `GET /me` — Retrieve own user and companion profile record.
- `PATCH /me` — Update permitted profile fields with mass assignment defense.
- `GET /me/applications` — Retrieve current user's submitted proposal pipeline.
- `GET /:username` — Public profile by username or ID with privacy redaction.
- `GET /developers` — Browse active verified developer directory.

### Projects (`/api/projects` & `/api/v1/projects`)
- `GET /` — Paginated discovery feed with filters (`q`, `category`, `projectType`, `experienceLevel`, `skills`, `minBudget`, `maxBudget`, `sort`, `page`, `limit`).
- `POST /` — Create and publish a new project (initializes explicit owner membership and creation audit activity).
- `GET /my-projects` — Retrieve projects owned by the currently authenticated user.
- `GET /my-applications` — Retrieve proposals submitted by the currently authenticated user.
- `GET /:id` — Detailed project view with real-time applicant counts and visibility authorization.
- `PATCH /:id` (and `PUT /:id`) — Update permitted project fields with lifecycle status transition validation.
- `DELETE /:id` — Soft-cancel active project (preserving application audit history) or hard delete empty draft.

### Applications & Proposals (`/api/projects` & `/api/applications`)
- `POST /api/projects/:id/applications` — Submit application proposal with cover letter and proposed rate (blocks owner self-apply, duplicates, and closed/expired projects).
- `GET /api/projects/:id/applications/me` — Retrieve applicant's own submission status for the project.
- `DELETE /api/projects/:id/applications/me` — Withdraw applicant's proposal cleanly with owner notification.
- `GET /api/projects/:id/applications` — Project owner view of all submitted candidate proposals.
- `GET /api/applications/:id` — View application details (restricted to applicant, project owner, or admin).
- `PATCH /api/applications/:id/status` — Owner decision endpoint (`accepted` | `rejected`). Features atomic conditional capacity checking, creates active `ProjectMember` record, logs audit activities, and notifies applicant.
- `DELETE /api/applications/:id` — Withdraw application.

### Team Membership & Protected Workspace (`/api/projects`)
- `GET /api/projects/:id/workspace` — Protected workspace endpoint for authorized team members. Returns project overview, active team members, user's membership role, activity audit trail, and Phase 5/6 placeholders.
- `GET /api/projects/:id/members` — Safe public list of active team members (projections exclude password hashes, emails, reset tokens, or verification flags).
- `GET /api/projects/:id/members/me` — Retrieve current user's membership status and role for the project.
- `DELETE /api/projects/:id/members/me` — Voluntary departure from project team (blocked for project owner). Decrements accepted count and logs activity.
- `DELETE /api/projects/:id/members/:userId` — Project owner removes a team member (blocked if target is owner). Revokes workspace access, records reason, and notifies member.
- `PATCH /api/projects/:id/members/:userId/role` — Project owner updates member role (`member` <-> `manager`).
- `GET /api/projects/:id/activities` — Chronological audit trail of project lifecycle events.
- `GET /api/projects/:id/progress` — Authoritative project progress metrics derived from tasks and milestones.

### Tasks & Milestones (`/api/tasks`, `/api/milestones`, `/api/projects/:id`)
- `POST /api/projects/:projectId/tasks` — Create new task within project (authorized workspace members only; validates assignees are active members; rejects cross-project milestones).
- `GET /api/projects/:projectId/tasks` — Paginated task list with database-level filtering (`status`, `priority`, `assignee`, `milestone`, `q`, `isArchived`) and sorting.
- `GET /api/tasks/:taskId` — Single task details with populated project, creator, assignees, and milestone (restricted to active project members).
- `PATCH /api/tasks/:taskId` (and `PUT /:taskId`) — Update allowed task fields with field-level role permissions and assignee validation.
- `PATCH /api/tasks/:taskId/status` — Controlled status transitions (`todo` -> `in_progress` -> `in_review` -> `completed` / `blocked`). Enforces formal review approval: only project owner, manager, or creator can approve completion.
- `DELETE /api/tasks/:taskId` — Soft-delete task (restricted to owner, manager, or task creator).
- `GET /api/tasks/my-tasks` — List all active tasks assigned to the authenticated user across projects.
- `POST /api/projects/:projectId/milestones` — Create project milestone with target deliverables and due dates (owner and manager only).
- `GET /api/projects/:projectId/milestones` — List project milestones with live progress calculation derived dynamically from active tasks.
- `GET /api/milestones/:milestoneId` — Detailed milestone view with linked tasks and progress statistics.
- `PATCH /api/milestones/:milestoneId` — Update milestone deliverables, dates, order, or status (owner and manager only).
- `PATCH /api/milestones/:milestoneId/status` — Update milestone status lifecycle (`upcoming`, `in_progress`, `completed`, `cancelled`).
- `DELETE /api/milestones/:milestoneId` — Soft-delete milestone and automatically unlink associated tasks without orphan data.
- `GET /api/milestones/:milestoneId/tasks` — List tasks linked to a specific milestone.

### Community & Moderation
- `GET /api/v1/community/posts` — Retrieve community feed with filtering & pagination
- `POST /api/v1/community/posts` — Create a discussion, showcase, or question post
- `POST /api/v1/community/posts/:id/reactions` — Upvote / react to a post
- `POST /api/v1/community/reports` — Report inappropriate content
- `GET /api/v1/moderation/reports` — Admin moderation queue

### Messaging & Realtime
- `GET /api/v1/chats/conversations` — User conversation threads
- `GET /api/v1/chats/messages/:recipientId` — Fetch chat message history
- `POST /api/v1/chats/messages` — Send message (broadcasted via Socket.IO)

---

## 8. Current Implementation Status

- [x] **Phase 1: Foundation & Architecture Setup**
  - [x] Pure JavaScript MERN architecture established (zero TypeScript).
  - [x] Centralized error-handling middleware (`errorHandler.js`, `notFound.js`).
  - [x] Environment validation (`env.js`) and resilient MongoDB connection manager (`db.js`).
  - [x] Health check endpoints (`/api/health`, `/api/v1/health`).
  - [x] Security headers and request limiters configured.
  - [x] Responsive React + Vite frontend running purely with JSX and CSS.
- [x] **Phase 2: Authentication & User Profiles**
  - [x] Extended Mongoose User model with unique normalized usernames, status, email verification, and password reset tokens.
  - [x] Password hashing with bcrypt (10 rounds) and password redaction from JSON responses.
  - [x] Protected registration endpoint with input validation, username rules, and privilege escalation prevention.
  - [x] Flexible login by username or email with generic enumeration-safe error responses.
  - [x] Dual-authentication support: HttpOnly session cookie and Authorization Bearer header.
  - [x] Reusable authentication and account status middleware (`protect`, `authorize`).
  - [x] User profile endpoints (`GET /me`, `PATCH /me`, `GET /:username`) with mass-assignment defense.
  - [x] Password management with current password verification and single-use crypto reset tokens.
  - [x] Frontend route protection with `ProtectedRoute.jsx` and session restoration via `checkAuth()`.
- [x] **Phase 3: Projects & Applications**
  - [x] Robust Mongoose Project model with team capacity limits, budgeting, deadline checks, and status lifecycle.
  - [x] Dedicated Application model with compound unique indexing (`{ project: 1, applicant: 1 }`).
  - [x] Paginated project discovery feed with search, category, experience, skills, and budget filtering.
  - [x] Secure proposal submission with owner self-apply prevention, duplicate blocking, and deadline verification.
  - [x] Owner proposal review lifecycle with atomic conditional capacity checking (`409 Conflict` on overflow).
  - [x] Safe application withdrawal with in-app notifications.
  - [x] Dedicated frontend views: `ProjectsFeedPage`, `ProjectDetailsPage`, `CreateProjectPage`, `MyProjectsPage`, `MyApplicationsPage`.
- [x] **Phase 4: Project Acceptance, Team Membership & Secure Workspace Access**
  - [x] Dedicated `ProjectMember` Mongoose model with compound unique index `{ project: 1, user: 1 }`, roles (`owner`, `manager`, `member`), statuses (`active`, `left`, `removed`), and audit timestamps.
  - [x] Centralized workspace authorization middleware (`requireWorkspaceMember`, `requireWorkspaceOwner`) ensuring server-side access enforcement for REST endpoints and future Socket.IO rooms.
  - [x] Seamless application acceptance integration: accepting a proposal automatically creates or reactivates active `ProjectMember` document and creates explicit owner record.
  - [x] Atomic team capacity enforcement eliminating race conditions and duplicate memberships under concurrent requests.
  - [x] Team management endpoints: list members (`GET /members`), check membership (`GET /members/me`), voluntary departure (`DELETE /members/me`), owner member removal (`DELETE /members/:userId`), and role updates (`PATCH /members/:userId/role`).
  - [x] Data sanitization: member listings project only safe public fields (`_id`, `name`, `username`, `avatar`, `headline`, `skills`, `role`, `joinedAt`), strictly omitting sensitive credentials or tokens.
  - [x] Protected frontend workspace view (`/projects/:id/workspace` & `/projects/:projectId/workspace`) with project overview, team member directory, departure/removal modals, activity trail, and Phase 5/6 integration placeholders.
  - [x] Project details integration (`ProjectDetailsPage.jsx`) featuring active team members showcase and contextual workspace entry button for authorized members.
  - [x] Immutable activity history audit trail (`ProjectActivity` model) recording project creation, application decisions, member joins, departures, removals, and role updates.
- [x] **Phase 5: Tasks, Milestones & Team Collaboration Workflow**
  - [x] Dedicated `Task` Mongoose model with project reference, assignees array, review workflow statuses (`todo`, `in_progress`, `in_review`, `completed`, `blocked`), priorities (`low`, `medium`, `high`, `urgent`), milestone linking, estimated effort, labels, and compound indexes.
  - [x] Dedicated `Milestone` Mongoose model for project-level goal tracking (`upcoming`, `in_progress`, `completed`, `cancelled`), target deliverables checklist, derived `isOverdue` virtual state, and task association.
  - [x] Controlled task workflow lifecycle (`todo` -> `in_progress` -> `in_review` -> `completed` / `blocked`) with server-side validation, completion timestamp tracking (`completedAt`), and formal review approval restricted to project owner, manager, or task creator.
  - [x] Workspace assignee validation ensuring tasks can only be assigned to verified, active project members (rejects non-members with 400).
  - [x] Cross-project boundary protection preventing tasks from linking to milestones belonging to other projects.
  - [x] Safe unassignment policy: when a team member departs or is removed by the owner, they are automatically unassigned from all active project tasks without corrupting task state or transferring responsibilities arbitrarily.
  - [x] Dynamic milestone progress formula: $\text{Milestone Progress} = \text{round}\left(\frac{\text{completed eligible tasks}}{\text{total eligible tasks}} \times 100\right)$ (returns 0% if no tasks exist, preventing division by zero).
  - [x] Comprehensive project progress overview API (`GET /api/projects/:id/progress`) delivering authoritative counts for total, in-progress, in-review, completed, blocked, overdue tasks, and milestone statistics.
  - [x] Extended `ProjectActivity` audit trail tracking `task_created`, `task_updated`, `task_assigned`, `task_reassigned`, `task_unassigned`, `task_status_changed`, `task_reopened`, `task_deleted`, `milestone_created`, `milestone_updated`, `milestone_completed`, `milestone_deleted`.
  - [x] In-app notification integration alerting members on task assignment, review submission, completion approval, and milestone completion.
  - [x] Rich frontend workspace UI in `ProjectWorkspacePage.jsx`: interactive Kanban board, alternative table list view, task creation/editing modal, task detail modal, milestone management section, and live project velocity widget.
  - [x] 139 / 139 automated unit and integration tests passing with 100% success rate.
- [x] **Phase 6: Real-Time Chat, Notifications & Project Communication**
  - [x] **Secure Socket.IO Server**:
    - Connection handshake authentication middleware (`io.use`) strictly verifying JWT bearer tokens from client handshake auth (`socket.handshake.auth.token`) or authorization headers.
    - Server-side identity validation: client identity is always resolved from verified JWT payload (`socket.user = user`), never trusting client-supplied user identifiers.
    - Personal rooms (`user:<userId>`) automatically joined upon connection for individual targeted notifications and message pushes.
    - Project room isolation (`project:<projectId>` and `conversation:<conversationId>`) with server-side authorization checks (`verifyProjectWorkspaceAccess`, `verifyConversationAccess`).
    - Robust handling of reconnections, disconnected sockets, and in-memory rate limiting (max 15 messages per 5 seconds).
  - [x] **Database Models & Indexing**:
    - `Conversation` model supporting project-linked rooms (`project` ref with sparse unique indexing) and direct 1-on-1 conversations (`type: 'direct'`), participants array, latest message preview, and per-user read cursor array (`readState`).
    - `Message` model supporting conversation and sender refs, text content (max 4000 characters), optional attachments metadata, soft deletion (`isDeleted`, `deletedForEveryone`, `deletedForMe`), edit tracking (`isEdited`, `editedAt`), and read receipts tracking (`readBy: [{ user, readAt }]`).
    - Compound indexes: `{ conversation: 1, createdAt: -1 }` for rapid chronological message history queries, and `{ project: 1 }` for project conversations.
    - `Notification` model with recipient indexing, types (`message`, `project`, `team`, `task`, `milestone`), and real-time Socket.IO emission (`notification:new`, `notification:unread_count`).
  - [x] **REST API Endpoints**:
    - `GET /api/v1/chats/conversations`: Returns all available project and direct conversations with unread message counts, participant details, and latest message preview.
    - `GET /api/v1/chats/unread-count`: Computes global unread message count across all conversations.
    - `GET /api/v1/chats/project/:projectId`: Retrieves or initializes project conversation for authorized workspace members.
    - `GET /api/v1/projects/:id/conversation`: Project workspace alias for team chat conversation.
    - `POST /api/v1/chats/direct`: Retrieves or creates direct 1-on-1 conversation.
    - `GET /api/v1/chats/conversations/:id/messages`: Paginated message history in chronological order with `limit` and `before` cursor support.
    - `POST /api/v1/chats/conversations/:id/messages`: Reliable REST fallback message sender with real-time room broadcast.
    - `PATCH /api/v1/chats/messages/:id`: Edits user's own message within policy limits.
    - `DELETE /api/v1/chats/messages/:id`: Soft deletes user's own message (or project owner deleting in project workspace).
    - `POST /api/v1/chats/conversations/:id/read`: Marks conversation read and syncs read state.
    - `GET /api/v1/notifications`: Paginated notifications list for caller with unread count.
    - `GET /api/v1/notifications/unread-count`: Returns active unread notifications count.
    - `PATCH /api/v1/notifications/:id/read`: Marks individual notification read.
    - `PATCH /api/v1/notifications/read-all`: Marks all notifications read.
  - [x] **Socket.IO Event Specifications**:
    - `join_conversation` / `conversation:join` (payload: `{ conversationId }`) -> `conversation:joined`
    - `leave_conversation` (payload: `{ conversationId }`) -> `conversation:left`
    - `join_project_workspace` (payload: `{ projectId }`) -> `workspace_joined`
    - `send_message` (payload: `{ conversationId, content, attachments }`) -> broadcasts `message:new` & `receive_message` to room
    - `message:edit` (payload: `{ messageId, content }`) -> broadcasts `message:updated` to room
    - `message:delete` (payload: `{ messageId, deleteForEveryone }`) -> broadcasts `message:deleted` to room
    - `typing:start` / `typing:stop` (payload: `{ conversationId }`) -> broadcasts `typing:status` (ephemeral, never persisted to DB)
    - `message:read` (payload: `{ conversationId }`) -> broadcasts `conversation:read` to room
    - `notification:new` (payload: populated notification object emitted to `user:<userId>`)
  - [x] **Frontend Real-Time Experience**:
    - Singleton Socket.IO client (`client/src/services/socket.js`) with auto-reconnection, token auth from Zustand, and automatic room re-subscription.
    - `ConversationList.jsx`: Searchable list of project and direct conversations with unread badges and latest message previews.
    - `ChatWindow.jsx`: Interactive message thread, delivery/read receipts, typing indicator bar, message composer, and connection status indicator.
    - `MessageBubble.jsx`: Message bubble with inline edit mode, deletion, timestamp, and read receipts.
    - `MessageComposer.jsx`: Keyboard navigation (Enter to send, Shift+Enter for newline) with debounced typing indicators.
    - `NotificationBell.jsx`: Navbar bell with live unread badge, real-time push listener, mark-as-read, and direct links.
    - Project Workspace Integration: Embedded Team Chat tab directly into `ProjectWorkspacePage.jsx`.
    - Full-page chat experience in `ChatPage.jsx` with mobile responsive drawer layout.
  - [x] **173 / 173 Automated Tests Passing**:
    - 28 Phase 6 integration tests verifying socket auth, room access authorization, non-member rejection, message validation, cursor pagination, editing/deletion permissions, read receipts, notifications, typing indicators, and REST fallback.
    - 6 Phase 6 model unit tests verifying schema validations, attachments, length limits, and enum constraints.
    - 100% test pass rate across all phases (173 tests, 43 test suites, 0 failures).

---

## 12. Phase 9: Developer Portfolios, Skills, Search & Discovery

Phase 9 introduces a complete developer discovery platform, categorized skills taxonomy, showcase portfolios with verified DevConnect project linking, and saved developer bookmarks.

### Key Capabilities & Architectural Highlights

1. **Developer Portfolios & Visibility Controls**:
   - Public vs. authenticated vs. private profile visibility enforcement at database query level.
   - Strict server-side field sanitization: public endpoints never expose emails, passwords, reset tokens, or private settings.
   - Profile settings support headline, bio, experience level (`junior`, `mid`, `senior`, `lead`), availability (`available`, `open_to_offers`, `busy`, `not_available`), preferred roles, preferred project types, hourly rates, languages, location, and timezone.
   - Live portfolio preview prior to publishing.

2. **Skills & Expertise Taxonomy**:
   - 11 canonical skill categories:
     - Frontend development
     - Backend development
     - Full-stack development
     - Mobile development
     - UI/UX design
     - Data science and AI
     - DevOps and cloud
     - Cybersecurity
     - Quality assurance and testing
     - Civil and other engineering disciplines
     - Product management and related professional skills
   - Normalization and deduplication pipeline reduces case, spacing, and punctuation variations.
   - Rich proficiency levels (`beginner`, `intermediate`, `advanced`, `expert`) and user-reported years of experience.

3. **Project Portfolio & Showcase**:
   - Showcase completed or active projects with title, description, role, technologies used, live URL, GitHub URL, and media.
   - **DevConnect Project Verification**: Verifies authorized participation before allowing a DevConnect project to be linked with a verified badge. Non-members or outsiders cannot claim unauthorized projects.

4. **Experience, Education & Achievements**:
   - Work experience timeline with company, role, dates, and responsibilities.
   - Education history with school, degree, and field of study.
   - Professional certifications with issuing organization, credential IDs, and expiration dates.

5. **Developer Discovery Directory**:
   - Search by name, username, or professional headline.
   - Filter by skill, skill category, experience level, availability, and preferred role.
   - Server-side stable pagination (`page`, `limit`, `total`, `totalPages`, `hasMore`).
   - Sorted by relevance, rating, completed projects, or recently updated.

6. **Project & Collaboration Discovery**:
   - Dedicated project recruitment discovery filtering open projects by required skills, category, and budget ranges (`minBudget`, `maxBudget`).
   - Excludes completed, cancelled, or archived projects automatically.

7. **Saved Developers & Bookmarks**:
   - Bookmark developers with compound unique database constraint `{ user: 1, developer: 1 }`.
   - Rejects self-bookmarking (`400 Bad Request`).
   - Saved developers list is private to the owner.

8. **Following & Connection System**:
   - Atomic follower and following counts with duplicate prevention.
   - Self-follow rejection and follower/following list retrieval with pagination.

### Phase 9 API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/portfolios/:username` | View public developer portfolio (respects visibility) | Optional |
| `GET` | `/api/users/:userId/portfolio` | View portfolio by user ID | Optional |
| `GET` | `/api/v1/portfolios/me` | Get authenticated user's portfolio and settings | Yes |
| `PATCH` | `/api/v1/portfolios/me` | Update portfolio settings and mirror profile | Yes |
| `POST` | `/api/v1/portfolios/me/projects` | Add independent or verified DevConnect project | Yes |
| `PATCH` | `/api/v1/portfolios/me/projects/:id` | Update showcase project | Yes |
| `DELETE` | `/api/v1/portfolios/me/projects/:id` | Remove showcase project | Yes |
| `POST` | `/api/v1/portfolios/me/skills` | Add or update skill with proficiency | Yes |
| `DELETE` | `/api/v1/portfolios/me/skills/:skillName` | Remove skill from portfolio | Yes |
| `GET` | `/api/v1/skills/categories` | List all 11 canonical skill categories | No |
| `GET` | `/api/v1/skills/suggest` | Search and autocomplete normalized skills | No |
| `GET` | `/api/v1/discovery/developers` | Search and filter public developer directory | Optional |
| `GET` | `/api/v1/discovery/projects` | Discover open projects by skills, category, and budget | No |
| `GET` | `/api/v1/bookmarks` | Get current user's bookmarked developers | Yes |
| `POST` | `/api/v1/bookmarks/developers/:id` | Bookmark a developer profile | Yes |
| `DELETE` | `/api/v1/bookmarks/developers/:id` | Remove developer from bookmarks | Yes |
| `POST` | `/api/v1/users/:userId/follow` | Follow a developer | Yes |
| `DELETE` | `/api/v1/users/:userId/follow` | Unfollow a developer | Yes |
| `GET` | `/api/v1/users/:userId/followers` | List followers of a developer | No |
| `GET` | `/api/v1/users/:userId/following` | List users followed by a developer | No |

### Frontend Components & Pages

- `DeveloperDirectoryPage.jsx`: Filterable, searchable developer discovery grid.
- `ProjectDiscoveryPage.jsx`: Project collaboration discovery with category and budget filters.
- `SavedDevelopersPage.jsx`: Private bookmarks dashboard for saved candidates.
- `DeveloperSearchBar.jsx` & `DeveloperFilterPanel.jsx`: Reusable query and filter controls.
- `DeveloperCard.jsx` & `SaveDeveloperButton.jsx`: Responsive developer preview cards with instant bookmarking.
- `PortfolioEditor.jsx` & `SkillsEditor.jsx`: Real-time portfolio management and skill proficiency assignment.
- `PortfolioProjectCard.jsx`: Project showcase with verified DevConnect badge and media thumbnails.
- `ExperienceSection.jsx`, `EducationSection.jsx`, `CertificationSection.jsx`: Structured credentials.

### Test Execution

Run the complete Phase 9 test suite:

```bash
cd server
node --test tests/integration/portfolios_and_discovery.test.js
```

All 22 integration tests pass, covering privacy, visibility, authorization, skills normalization, discovery queries, bookmarks, and following.

# devquox-community-
# devquox-community-
# DevQuox-community
