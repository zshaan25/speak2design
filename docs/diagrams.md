# Speak2Design — Architecture & Required Diagrams

Diagrams for the FYP Phase-II document. All are Mermaid (render on GitHub or any Mermaid viewer; export to PNG for pasting into the Word document).

---

## 1. System Architecture

```mermaid
flowchart LR
  subgraph Client["Client (Browser)"]
    SPA["React + Vite SPA<br/>Tailwind CSS"]
    MR["MediaRecorder API<br/>(voice capture)"]
    TTS["Web Speech Synthesis<br/>(voice feedback)"]
    LS["localStorage<br/>(JWT token)"]
  end

  subgraph Server["Backend API (Render)"]
    API["Express REST API"]
    AUTH["Auth + JWT middleware"]
    VOICE["Voice / AI controller"]
    MKT["Marketplace controller"]
    SAN["DOMPurify sanitizer<br/>+ schema validation"]
  end

  subgraph External["External Services"]
    GEM["Google Gemini 2.0 Flash<br/>(transcribe + generate UI)"]
    STR["Stripe API<br/>(test-mode payments)"]
  end

  DB[("MongoDB Atlas")]

  SPA -->|HTTPS / JSON + JWT| API
  MR --> SPA
  SPA --> TTS
  SPA <--> LS
  API --> AUTH
  AUTH --> VOICE
  AUTH --> MKT
  VOICE --> SAN
  VOICE -->|audio + prompt| GEM
  MKT -->|PaymentIntent| STR
  API --> DB
```

---

## 2. Use-Case Diagram

```mermaid
flowchart TB
  Free(("Free User"))
  Prem(("Premium User"))

  subgraph S["Speak2Design"]
    UC1["Register / Login"]
    UC2["Give voice command"]
    UC3["Give text command"]
    UC4["Edit canvas<br/>(resize / reorder / delete)"]
    UC5["Undo / Redo"]
    UC6["Save project"]
    UC7["Copy exported code"]
    UC8["Download HTML/CSS files"]
    UC9["Browse marketplace"]
    UC10["Purchase template"]
    UC11["Publish template"]
    UC12["Upgrade to Premium"]
  end

  Free --- UC1
  Free --- UC2
  Free --- UC3
  Free --- UC4
  Free --- UC5
  Free --- UC6
  Free --- UC7
  Free --- UC9
  Free --- UC10
  Free --- UC12

  Prem --- UC8
  Prem --- UC11
  Prem --- UC2
  Prem --- UC10

  UC2 -. "extends" .-> UC4
  UC10 -. "includes" .-> UC10
```

> Free users are limited (10 commands/window, copy-only export, no publishing). Premium unlocks unlimited commands, file downloads (UC8) and publishing (UC11).

---

## 3. Class Diagram

```mermaid
classDiagram
  class User {
    +ObjectId _id
    +String name
    +String email
    +String passwordHash
    +String tier
    +Number usageCount
    +Date usageResetAt
    +ObjectId[] ownedTemplates
    +register()
    +login()
    +upgradeToPremium()
  }

  class Project {
    +ObjectId _id
    +ObjectId user
    +String title
    +String language
    +CanvasComponent[] canvasState
    +Array historyStack
    +Number historyPointer
    +save()
    +updateCanvas()
  }

  class CanvasComponent {
    +String id
    +String type
    +String name
    +Map styles
    +String htmlContent
  }

  class Template {
    +ObjectId _id
    +String title
    +String description
    +Number price
    +String author
    +Number sales
    +String lang
    +publish()
    +purchase()
  }

  class VoiceController {
    +transcribeAudioAndGenerateUI()
    +processTextIntent()
    +sanitizeCanvas()
    +detectOverrideNotice()
  }

  User "1" --> "0..*" Project : owns
  User "1" --> "0..*" Template : purchases
  Project "1" *-- "0..*" CanvasComponent : contains
  VoiceController ..> Project : updates canvas
  VoiceController ..> User : checks quota
```

---

## 4. ER Diagram

```mermaid
erDiagram
  USER ||--o{ PROJECT : creates
  USER }o--o{ TEMPLATE : owns
  PROJECT ||--o{ CANVAS_COMPONENT : contains

  USER {
    ObjectId _id PK
    string name
    string email UK
    string passwordHash
    string tier
    int usageCount
    date usageResetAt
  }
  PROJECT {
    ObjectId _id PK
    ObjectId user FK
    string title
    string language
    int historyPointer
  }
  CANVAS_COMPONENT {
    string id
    string type
    string name
    string htmlContent
  }
  TEMPLATE {
    ObjectId _id PK
    string title
    string description
    int price
    string author
    int sales
    string lang
  }
```

---

## 5. Sequence Diagram — Voice Command

```mermaid
sequenceDiagram
  actor U as User
  participant FE as Frontend (Workspace)
  participant API as Express API
  participant G as Gemini API
  participant DB as MongoDB

  U->>FE: Hold mic and speak
  FE->>FE: Capture audio (MediaRecorder)
  U->>FE: Release mic
  FE->>API: POST /api/voice/transcribe-and-generate (audio + canvas + JWT)
  API->>API: Auth + quota check (free tier)
  API->>G: Transcribe audio
  G-->>API: Transcribed text
  API->>G: Generate UI (structured prompt + current canvas)
  G-->>API: JSON component array
  API->>API: Validate schema + DOMPurify sanitize + detect override
  API-->>FE: updatedCanvas + overrideNotice + usageCount
  FE->>FE: Render canvas + push history
  FE->>U: Toast + TTS confirmation
  U->>FE: Save
  FE->>API: PUT /api/projects/:id (canvasState)
  API->>DB: Persist project
```

---

## 6. Data-Flow Diagram

```mermaid
flowchart LR
  A["Voice / Text command<br/>(EN / UR / mixed)"] --> B{Voice or Text?}
  B -->|Voice| C["Gemini transcription"]
  B -->|Text| D["Raw text"]
  C --> E["Structured prompt"]
  D --> E
  E --> F["Gemini UI generation"]
  F --> G["JSON component array"]
  G --> H["Schema validation<br/>+ DOMPurify sanitize"]
  H --> I["Canvas state (React)"]
  I --> J["Render (dangerouslySetInnerHTML)"]
  I --> K["Save to MongoDB"]
  I --> L["Export HTML + Tailwind"]
```
