**SPEAK2DESIGN**

_User Manual & Technical Guide_

_"Transform Your Voice Into Stunning Websites"_

**AI-Powered Voice-to-UI Design Platform**

Final Year Project

# **1\. Introduction**

Speak2Design is an AI-powered, voice-driven web UI builder that lets designers and developers generate professional website layouts by speaking or typing natural-language commands. Powered by Groq's Llama 3.3 70B language model and Whisper speech recognition, the platform converts spoken intent into production-ready HTML/CSS components in real time.

## **1.1 Project Overview**

The application targets two primary pain points in modern web development: the complexity of design tools and the time required to translate ideas into working prototypes. By making natural language the primary input method, Speak2Design democratises UI creation for both technical and non-technical users.

## **1.2 Core Capabilities**

- Voice-to-UI Generation: Speak any UI description and watch components appear instantly on the canvas
- Bilingual Support: Full English and Urdu voice command support
- AI Canvas: Drag, reorder, inspect, duplicate and edit every generated component
- Template Library: 30+ professionally designed section templates
- Multi-Page Projects: Manage multiple pages within a single project
- Marketplace: Buy, sell and publish design templates with Stripe payments
- Export: One-click HTML/CSS ZIP export for any web project
- Public Sharing: Generate shareable read-only links for designs
- Premium Design UI: Dark glassmorphism aesthetic with Framer Motion animations

## **1.3 Technology Stack**

| **Layer**    | **Technology**                                                             |
| ------------ | -------------------------------------------------------------------------- |
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS v4, Framer Motion                |
| ---          | ---                                                                        |
| **Backend**  | Node.js (ES Modules), Express.js, Mongoose                                 |
| ---          | ---                                                                        |
| **Database** | MongoDB (Atlas)                                                            |
| ---          | ---                                                                        |
| **AI / NLP** | Groq SDK - Whisper large-v3 (transcription), Llama 3.3 70B (UI generation) |
| ---          | ---                                                                        |
| **Auth**     | JWT , Google OAuth 2.0, GitHub OAuth                                       |
| ---          | ---                                                                        |
| **Payments** | Stripe Checkout Sessions (redirect flow)                                   |
| ---          | ---                                                                        |
| **Storage**  | AWS S3 (optional)                                                          |
| ---          | ---                                                                        |
| **Email**    | SMTP via Gmail App Password (password reset)                               |
| ---          | ---                                                                        |

# **2\. System Requirements & Installation**

## **2.1 Prerequisites**

| **Software**   | **Minimum Version**    | **Notes**                   |
| -------------- | ---------------------- | --------------------------- |
| **Node.js**    | v20 LTS                | v26 recommended             |
| ---            | ---                    | ---                         |
| **MongoDB**    | v6+                    | Local or Atlas free tier    |
| ---            | ---                    | ---                         |
| **npm / pnpm** | npm 9+ / pnpm 8+       | pnpm preferred              |
| ---            | ---                    | ---                         |
| **Browser**    | Chrome 120+, Edge 120+ | Microphone access required  |
| ---            | ---                    | ---                         |
| **Microphone** | Any device mic         | Required for voice features |
| ---            | ---                    | ---                         |

## **2.2 Environment Configuration**

Create the file backend/.env with the following variables (required entries marked with \*):

_PORT=5000 # Server port_

_\# MongoDB Connection String \*_

_\# For Local:  
MONGODB_URI=mongodb://127.0.0.1:27017/speak2design_

_\# For Production (Atlas):_

_MONGODB_URI=mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster-name.xxxxx.mongodb.net/speak2design_

_JWT_SECRET=&lt;64-char-random-string&gt; # \* (Min 32 characters)_

_GROQ_API_KEY=&lt;key from console.groq.com&gt; # \*(AI voice & UI generator key from console.groq.com)_

_\# Application URLs (Ensure HTTPS is used for cloud deployments)_

_FRONTEND_URL=<https://d1khpu1t6zzts5.cloudfront.net> # CloudFront/Vercel URL_

_BACKEND_URL=<https://speak2design.onrender.com> # Render production URL_

_\# OAuth Login Configuration_

_GOOGLE_CLIENT_ID=&lt;Google OAuth client&gt; # OAuth login_

_GOOGLE_CLIENT_SECRET=&lt;secret&gt;_

_GITHUB_CLIENT_ID=&lt;GitHub OAuth App&gt; # OAuth login_

_GITHUB_CLIENT_SECRET=&lt;secret&gt;_

_\# Stripe Payments Configuration (Optional)_

_STRIPE_SECRET_KEY=sk_test_... # Marketplace payments\_

_STRIPE_WEBHOOK_SECRET=whsec_... # Stripe webhook\_

_\# SMTP Configuration (For Password Reset Emails)_

_SMTP_HOST=smtp.gmail.com # Password reset emails_

_SMTP_PORT=587_

_SMTP_USER=your@gmail.com_

_SMTP_PASS=&lt;16-char Gmail App Password&gt;_

_SMTP_FROM="Speak2Design &lt;<your@gmail.com>&gt;"_

_\# AWS Configuration (For Thumbnail Uploads)_

_AWS_REGION=us-east-1_

_AWS_ACCESS_KEY_ID=..._

_AWS_SECRET_ACCESS_KEY=..._

_S3_BUCKET_NAME=speak2design-thumbnail_

## **2.3 Installation Steps**

- Clone or open the project folder in VS Code
- Install backend dependencies: cd backend && npm install
- Install frontend dependencies: cd .. && pnpm install (or npm install)
- Start MongoDB (mongodb --dbpath /data/db or use Atlas)
- Start the backend: cd backend && npm run dev
- Start the frontend: pnpm dev (from project root)
- Open <http://localhost:5173> (or the port Vite selects) in Chrome

# **3\. Authentication**

Speak2Design uses JWT-based authentication with a 7-day token lifetime stored in localStorage under the key speak2design_token. Three sign-in methods are supported.

## **3.1 Email / Password**

### **Registration**

- Open the app - the Sign In / Sign Up screen is shown by default
- Click Sign Up on the toggle pill
- Enter Full Name, Email Address, and Password (min 6 characters)
- Click Create Account
- On success you are taken directly to the Dashboard

### **Login**

- Select Sign In from the toggle
- Enter your Email and Password
- Click Sign In or press Enter

### **Forgot Password**

- Click Forgot password? below the password field
- Enter your registered email and click Send Reset Link
- Open the link in the email (or the dev link shown when SMTP is not configured)
- Enter and confirm your new password, then click Set New Password
- Sign in with your new credentials

## **3.2 Google OAuth**

- Click the Google button on the auth screen
- Approve the Google consent screen
- You are redirected back and automatically signed in

_Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET set in backend/.env_

## **3.3 GitHub OAuth**

- Click the GitHub button on the auth screen
- Approve the GitHub OAuth application
- You are redirected back and signed in

_Requires GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET set in backend/.env_

## **3.4 Session Management**

- Sessions last 7 days from last login
- Logging out clears the token from localStorage
- Deactivated accounts are automatically reactivated on next login

# **4\. Dashboard**

The Dashboard is your central hub. It shows all your projects, quick-action shortcuts, AI usage statistics, and project management controls.

## **4.1 Stats Bar**

Four stat cards appear below the page header (populated from the /api/dashboard aggregation endpoint):

| **Stat**          | **Description**                                                              |
| ----------------- | ---------------------------------------------------------------------------- |
| **Total Designs** | Total number of projects in your account                                     |
| ---               | ---                                                                          |
| **Published**     | Templates you have listed on the Marketplace                                 |
| ---               | ---                                                                          |
| **Purchased**     | Templates bought from the Marketplace                                        |
| ---               | ---                                                                          |
| **Voice Today**   | Voice commands used today vs. daily limit (free: 10/day, premium: unlimited) |
| ---               | ---                                                                          |

## **4.2 Quick Actions**

- Voice Design - creates a new project and opens the Voice Canvas immediately
- Templates - creates a new project and opens the Template Library panel
- AI Generate - creates a new project ready for text commands

## **4.3 Project Cards**

Each project card shows a dark-themed wireframe preview, the project title, last-modified time, and layer count. Hovering reveals an Open in Canvas arrow and a delete (trash) button.

## **4.4 Search & Filter**

- Type in the search box to instantly filter projects by title
- Use the language filter (All / English / Urdu) to narrow by canvas language

## **4.5 Creating a New Project**

- Click New Project (top right) or any Quick Action card
- A project titled "Untitled Project" is created via POST /api/projects
- The Voice Canvas opens automatically

# **5\. Voice Canvas**

The Voice Canvas is the core design environment. It consists of three panels: the Left Control Panel, the central Canvas, and the right Inspector Panel.

## **5.1 Left Control Panel**

### **Voice Language**

Toggle between English and Urdu. This controls both the speech recognition language and the language of the generated UI components.

### **Voice Command (Hold to Speak)**

- Hold the microphone button (or the Hold to Speak card on an empty canvas)
- Speak your UI description clearly into the microphone
- Release the button to send the audio to Whisper for transcription
- The transcribed text is shown, then sent to Llama 3.3 70B for UI generation
- The generated component appears on the canvas

_Free accounts: 10 voice commands per day. The daily counter resets at midnight. Premium accounts have unlimited commands._

### **Text Command**

- Type any UI description in the text box (e.g. "add a hero section with blue gradient and CTA button")
- Press Enter or click Generate
- The component is generated and added to the canvas

_Clicking the "Type a Command" card on an empty canvas focuses this text box automatically._

### **Layers Panel**

- All canvas components are listed here by name
- Use the search box to filter layers by name
- Click a layer to select it in the Inspector
- Drag the grip handle to reorder layers
- Click the eye icon to toggle visibility

### **Command History**

- Every voice or text command is logged with its timestamp
- Click any history entry to re-apply that command

### **My Component Library**

- Save any selected component as a reusable snippet (stored in localStorage)
- Apply saved components to future projects in one click

## **5.2 Canvas Area**

### **Component Interaction**

- Click a component to select it (blue border appears)
- Drag components up or down to reorder
- Use the Move Up / Move Down arrow buttons in the toolbar strip above each component
- The drag-handle icon (left edge) allows free reordering

### **Zoom Controls**

The floating zoom bar at the bottom of the canvas provides:

- Zoom In (− / + buttons) - range 50% to 150%
- Reset (100%) - click the percentage pill
- Fullscreen expand button

### **Auto-Save**

The canvas auto-saves to MongoDB every 3 seconds when changes are detected. A status indicator ("Saving..." / "Saved ✓") appears in the top toolbar.

## **5.3 Top Toolbar**

| **Button**       | **Function**                                                      |
| ---------------- | ----------------------------------------------------------------- |
| **← Back**       | Return to the Dashboard (auto-saves first)                        |
| ---              | ---                                                               |
| **Premium**      | Upgrade account to remove daily voice limit                       |
| ---              | ---                                                               |
| **Undo / Redo**  | Step backward or forward through canvas history (Ctrl+Z / Ctrl+Y) |
| ---              | ---                                                               |
| **Audio toggle** | Enable or mute voice command audio feedback                       |
| ---              | ---                                                               |
| **Theme**        | Apply a global colour palette to all components at once           |
| ---              | ---                                                               |
| **Font**         | Change the canvas-wide typeface (Google Fonts)                    |
| ---              | ---                                                               |
| **Share**        | Open the Share Modal to create a public read-only link            |
| ---              | ---                                                               |
| **Preview**      | Open the full WebsitePreview in a modal overlay                   |
| ---              | ---                                                               |
| **Templates**    | Open the 30+ section Template Library                             |
| ---              | ---                                                               |
| **Save**         | Force-save the current canvas state (Ctrl+S)                      |
| ---              | ---                                                               |
| **Export Code**  | Download a ZIP of the complete HTML/CSS project                   |
| ---              | ---                                                               |

## **5.4 Inspector Panel (Right)**

Select any component to open its Inspector. The Inspector provides:

### **Style Controls**

- Background colour, text colour, font size, font weight
- Padding (top/right/bottom/left)
- Border radius, border colour, border width
- Flex alignment, flex direction, gap
- Width, height, margin controls

### **HTML Editor**

- Direct inline HTML editing of the selected component
- Click Edit HTML, modify the markup, then click Apply

_All HTML is sanitised through DOMPurify before rendering to prevent XSS._

### **Smart Regenerate**

- Type a natural-language modification (e.g. "make it dark with a gradient")
- Click Regenerate to send only the selected component for AI redesign
- The component is replaced in place without affecting other layers

### **Component Actions**

- Duplicate - clones the component with a new unique ID
- Delete - removes from canvas (Ctrl+D or Delete key)
- Move Up / Move Down - reorder within the canvas

## **5.5 Template Library**

Click Templates in the toolbar to open the library overlay. Three tabs are available:

- Templates - 30+ pre-built section templates across 8 categories (Navbar, Hero, Features, Cards, Testimonials, CTA, Forms, Footer)
- My Library - components saved from previous designs (localStorage)

Click any template card to insert it onto the canvas at the current position.

## **5.6 Multi-Page Support**

The Page Manager (bottom strip of the left panel) allows:

- Adding new pages to the current project
- Switching between pages - each page has its own independent canvas
- Renaming and deleting pages

_Each page is stored as a separate document in MongoDB linked to the parent project._

## **5.7 Share & Public View**

- Click Share in the toolbar
- Toggle "Make public" to generate a shareable link
- Copy the link (format: <http://localhost:5173/view/{token}>)
- Share the link - recipients see a read-only preview with no edit controls
- Click Regenerate Link to invalidate the old token and create a new one

# **6\. Keyboard Shortcuts**

| **Shortcut**           | **Action**                                                   |
| ---------------------- | ------------------------------------------------------------ |
| **Ctrl + Z**           | Undo last canvas change                                      |
| ---                    | ---                                                          |
| **Ctrl + Y**           | Redo (step forward in history)                               |
| ---                    | ---                                                          |
| **Ctrl + S**           | Force-save canvas to server                                  |
| ---                    | ---                                                          |
| **Ctrl + D**           | Duplicate selected component                                 |
| ---                    | ---                                                          |
| **Delete / Backspace** | Remove selected component (when not focused on a text input) |
| ---                    | ---                                                          |
| **Escape**             | Deselect component / close modals                            |
| ---                    | ---                                                          |
| **Ctrl + = (Plus)**    | Zoom in                                                      |
| ---                    | ---                                                          |
| **Ctrl + − (Minus)**   | Zoom out                                                     |
| ---                    | ---                                                          |
| **Ctrl + 0**           | Reset zoom to 100%                                           |
| ---                    | ---                                                          |

# **7\. Marketplace**

The Marketplace allows users to browse, purchase, and sell design templates. Access it from the sidebar or top navigation.

## **7.1 Browsing Templates**

- Templates are displayed as cards with title, price, category, and language tag
- Use the search bar to filter by keyword
- Filter by category (Navbar, Hero, Features, etc.) or language (English / Urdu)
- Free templates are marked Free; paid templates show a price in USD

## **7.2 Purchasing Templates**

### **Free Templates**

- Click Get Free on any free template card
- The template is immediately added to your library - no payment required

### **Paid Templates (Stripe Checkout)**

- Click Buy on a paid template card
- The Checkout screen shows the template details and payment options
- Click Pay with Card to initiate a Stripe Checkout Session
- You are redirected to the Stripe-hosted payment page
- Complete payment with any test or live card
- Stripe redirects back to the Dashboard with a ?purchase=success parameter
- A success toast confirms the purchase; the template appears in My Library

_Test card: 4242 4242 4242 4242, any future expiry, any 3-digit CVC._

## **7.3 Publishing Templates (Premium Users)**

- Open a project in the Voice Canvas
- Navigate to Marketplace → Sell tab
- Fill in Title, Description, Price (0 for free), Category, and Language
- The system generates an MD5 uniqueness hash to prevent duplicate listings
- A Stripe Product and Price are created automatically for paid templates
- The source design is marked as public in your project list
- Your template appears in the Marketplace for other users to purchase

## **7.4 My Published Templates**

- View all your published templates in the Sell tab → My Published section
- Click Unpublish to soft-delete a listing (it disappears from the marketplace but your project is preserved)

## **7.5 My Library**

- All purchased and free templates appear in the My Library tab
- Apply any library template directly to a new project canvas

# **8\. Settings**

Access Settings via the top-right user avatar or the sidebar navigation.

## **8.1 Profile Update**

- Change your display name
- Change your email address (duplicate check enforced)
- Change your password: enter current password, then new password (min 6 characters)
- Click Save Changes to apply

## **8.2 Account Deactivation**

Deactivation is reversible. Your data is preserved; you are simply signed out.

- Click Deactivate Account in the Danger Zone section
- Enter your current password to confirm
- Click Confirm Deactivation
- To reactivate, simply sign in again with your credentials

## **8.3 Account Deletion**

Deletion is permanent and irreversible. All projects, pages, and canvas data are deleted.

- Click Delete Account in the Danger Zone section
- Type DELETE in the confirmation field
- Enter your current password
- Click Delete My Account

_OAuth users (Google/GitHub) who have never set a password do not need to enter a password for deactivation or deletion._

# **9\. Export & Preview**

## **9.1 Website Preview**

Click Preview in the canvas toolbar to open a modal showing the rendered website exactly as it would look in a browser. The preview applies the current canvas font and theme.

## **9.2 Export Code (ZIP)**

- Click Export Code in the canvas toolbar
- A ZIP file is downloaded containing:

- index.html - the full page with all component HTML
- styles.css - reset + canvas font import + any global styles
- README.md - quick-start instructions

- Open index.html in any browser to see the result
- Deploy the folder to Vercel, Netlify, or any static host without modification

_The exported HTML uses inline styles from the component definitions. No build step is required._

# **10\. Backend API Reference**

All API endpoints are prefixed with /api and require a JWT Bearer token in the Authorization header unless noted otherwise.

## **10.1 Auth Endpoints**

| **Method** | **Endpoint**              | **Description**                                   |
| ---------- | ------------------------- | ------------------------------------------------- |
| **POST**   | /api/auth/register        | Create new account (name, email, password)        |
| ---        | ---                       | ---                                               |
| **POST**   | /api/auth/login           | Sign in with email & password → returns JWT token |
| ---        | ---                       | ---                                               |
| **GET**    | /api/auth/profile         | Get current user profile (requires token)         |
| ---        | ---                       | ---                                               |
| **PUT**    | /api/auth/profile         | Update name, email, or password                   |
| ---        | ---                       | ---                                               |
| **POST**   | /api/auth/forgot-password | Send password reset link to email                 |
| ---        | ---                       | ---                                               |
| **POST**   | /api/auth/reset-password  | Consume reset token and set new password          |
| ---        | ---                       | ---                                               |
| **POST**   | /api/auth/deactivate      | Soft-deactivate account (reversible)              |
| ---        | ---                       | ---                                               |
| **DELETE** | /api/auth/delete          | Permanently delete account + all projects         |
| ---        | ---                       | ---                                               |
| **GET**    | /api/auth/google          | Initiate Google OAuth flow                        |
| ---        | ---                       | ---                                               |
| **GET**    | /api/auth/github          | Initiate GitHub OAuth flow                        |
| ---        | ---                       | ---                                               |

## **10.2 Project Endpoints**

| **Method** | **Endpoint**                       | **Description**                              |
| ---------- | ---------------------------------- | -------------------------------------------- |
| **GET**    | /api/projects                      | List all user projects (sorted newest first) |
| ---        | ---                                | ---                                          |
| **POST**   | /api/projects                      | Create new project (title, language)         |
| ---        | ---                                | ---                                          |
| **GET**    | /api/projects/:id                  | Get project by ID                            |
| ---        | ---                                | ---                                          |
| **PUT**    | /api/projects/:id/canvas           | Save/update canvas state                     |
| ---        | ---                                | ---                                          |
| **POST**   | /api/projects/:id/share            | Toggle public sharing / get share token      |
| ---        | ---                                | ---                                          |
| **POST**   | /api/projects/:id/regenerate-share | Invalidate old token, generate new one       |
| ---        | ---                                | ---                                          |
| **GET**    | /api/projects/public/:token        | Get public project (no auth required)        |
| ---        | ---                                | ---                                          |
| **DELETE** | /api/projects/:id                  | Delete project and all its pages             |
| ---        | ---                                | ---                                          |

## **10.3 Voice / AI Endpoints**

| **Method** | **Endpoint**          | **Description**                               |
| ---------- | --------------------- | --------------------------------------------- |
| **POST**   | /api/voice/transcribe | Audio → Whisper transcription → Llama UI JSON |
| ---        | ---                   | ---                                           |
| **POST**   | /api/voice/generate   | Text command → Llama UI JSON                  |
| ---        | ---                   | ---                                           |

_Both endpoints return commandsRemaining (int or "unlimited") for the daily quota UI._

## **10.4 Marketplace Endpoints**

| **Method** | **Endpoint**                   | **Description**                                        |
| ---------- | ------------------------------ | ------------------------------------------------------ |
| **GET**    | /api/marketplace               | List active templates (filter: category, lang, search) |
| ---        | ---                            | ---                                                    |
| **POST**   | /api/marketplace/publish       | Publish a design as a marketplace template             |
| ---        | ---                            | ---                                                    |
| **POST**   | /api/marketplace/checkout/:id  | Create Stripe Checkout Session → returns redirect URL  |
| ---        | ---                            | ---                                                    |
| **POST**   | /api/marketplace/purchase/:id  | Direct purchase for free (price = 0) templates         |
| ---        | ---                            | ---                                                    |
| **DELETE** | /api/marketplace/unpublish/:id | Soft-delete a published template (seller only)         |
| ---        | ---                            | ---                                                    |
| **GET**    | /api/marketplace/library       | Get current user's purchased templates                 |
| ---        | ---                            | ---                                                    |
| **POST**   | /api/marketplace/webhook       | Stripe webhook (no auth - raw body)                    |
| ---        | ---                            | ---                                                    |

# **11\. Troubleshooting**

| **Problem**                             | **Solution**                                                                                                                                                                                                                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Login fails / "Invalid credentials"** | Ensure MongoDB is running. Check JWT_SECRET is set in backend/.env. If you recently added select:false to User model, the .select("+password") calls in authController.js handle this.                                      |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Voice not working**                   | Grant microphone permission in the browser. Check GROQ_API_KEY is valid. Confirm you have daily quota remaining (check the voice badge in the canvas toolbar).                                                              |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Port 5000 already in use**            | Run: netstat -ano \| findstr :5000, then taskkill /PID &lt;pid&gt; /F. Or set a different PORT in backend/.env.                                                                                                             |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Vite on wrong port**                  | Check terminal output - Vite auto-selects the next free port (e.g. 5174). Update FRONTEND_URL in backend/.env if needed for OAuth redirects.                                                                                |
| ---                                     | ---                                                                                                                                                                                                                         |
| **OAuth redirect fails**                | Verify GOOGLE_CLIENT_ID / GITHUB_CLIENT_ID are set. Add <http://127.0.0.1:5000/api/auth/google/callback> as an authorised redirect URI in the Google/GitHub developer console.                                              |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Password reset email not arriving**   | Check SMTP_PASS is a 16-character Gmail App Password (no spaces). Ensure 2-Step Verification is enabled on the Gmail account. In dev, the reset link is printed in the console and returned as devLink in the API response. |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Stripe payment not completing**       | Verify STRIPE*SECRET_KEY is set. For local testing use the test key (sk_test*...). The webhook requires STRIPE_WEBHOOK_SECRET; without it, purchases still appear as simulated.                                             |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Canvas not saving**                   | Check the auto-save indicator in the toolbar. If it shows "Error", verify MongoDB is running and the JWT token is valid (re-login if expired). Check the browser console for network errors.                                |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Export ZIP is empty**                 | Add at least one component to the canvas before exporting. The ZIP requires canvasState to have entries.                                                                                                                    |
| ---                                     | ---                                                                                                                                                                                                                         |
| **Dark UI looks wrong on Safari**       | The UI targets Chromium browsers. Safari may render backdrop-filter differently. Use Chrome or Edge for the best experience.                                                                                                |
| ---                                     | ---                                                                                                                                                                                                                         |

# **12\. Data Models**

## **12.1 User**

- name, email, password (bcrypt, select:false), role (user/admin)
- tier (free/premium), usageCount, usageResetAt
- voiceCommandsToday, voiceCommandsDate (daily quota tracking)
- stripeCustomerId, purchasedTemplates\[\], ownedTemplates\[\]
- googleId, githubId, authProvider (local/google/github)
- resetPasswordToken, resetPasswordExpires
- isDeactivated, deactivatedAt

## **12.2 Project**

- user (ref User), title, language (English/Urdu)
- canvasState \[\] - array of CanvasComponent objects
- historyStack \[\], historyPointer (client-managed undo/redo state)
- thumbnailUrl, isPublic, shareToken (sparse unique index)
- timestamps (createdAt, updatedAt)

## **12.3 Page**

- project (ref Project), title, order
- canvasState \[\] - same structure as Project.canvasState
- timestamps

## **12.4 Template (Marketplace)**

- title, description, price (USD), category, lang
- imageUrl, canvasSnapshot, sellerId (ref User)
- uniquenessHash (MD5 of canvasSnapshot - sparse unique to prevent duplicates)
- stripePriceId, stripeProductId
- buyers \[\] (ref User), rating, sales, downloads
- isPremiumOnly, isActive

# **13\. Security Notes**

- All AI-generated HTML is sanitised through DOMPurify (FORBID_TAGS: script, iframe, object, embed, link, meta, base) before rendering
- JWT tokens expire after 7 days; there is no refresh token (re-login required)
- Passwords are hashed with bcrypt (10 salt rounds) and never returned in API responses (select:false on the Mongoose schema)
- Rate limiting is applied to all API routes (express-rate-limit)
- OAuth client secrets and API keys must remain in backend/.env and must never be committed to git
- The Stripe webhook endpoint uses express.raw() and verifies the Stripe signature before processing
- S3 presigned URLs expire after 15 minutes (when S3 thumbnail upload is configured)
- All user routes require requireAuthentication middleware which validates the Bearer JWT on every request

# **14\. Voice & Text Command Examples**

The following examples demonstrate the range of commands Speak2Design understands. Both voice and text commands use identical natural-language processing.

## **Navigation / Structure**

- "Add a navbar with a logo on the left and navigation links on the right"
- "Add a sticky header with a hamburger menu for mobile"
- "Add a footer with three columns: about, links, and social media"

## **Hero Sections**

- "Add a hero section with a gradient background, large heading, subheading, and a Get Started button"
- "Create a full-screen hero with a background image, dark overlay, and centred white text"
- "Add a split hero - text on the left, product image on the right"

## **Content Sections**

- "Add a three-column features grid with icons, titles, and descriptions"
- "Create a pricing table with three tiers: Free, Pro, and Enterprise"
- "Add a testimonials section with customer quotes and star ratings"
- "Create a team section with profile cards, names, and roles"

## **Forms & CTAs**

- "Add a contact form with name, email, message fields and a Submit button"
- "Create a newsletter signup section with email input and a Subscribe button"
- "Add a call-to-action banner with a purple gradient background and a white button"

## **Urdu Commands (Urdu mode)**

- "ایک نیوی کارڈ سیکشن شامل کریں جس میں تین کالم ہوں" - Add a 3-column card section
- "ہیرو سیکشن شامل کریں نیلے بیک گراؤنڈ کے ساتھ" - Add a hero with blue gradient background

# **Appendix: Project Directory Structure**

_Speak2Design/_

_backend/_

_config/ db.js (MongoDB connection)_

_controllers/ authController, projectController, voiceController,_

_marketplaceController, pageController, dashboardController_

_middleware/ requireAuthentication, quota, role_

_models/ User, Project, Page, Template_

_routes/ authRoutes, projectRoutes, voiceRoutes,_

_marketplaceRoutes, pageRoutes, dashboardRoutes_

_services/ groq.js (Whisper + Llama), stripe.js, s3.js, mailer.js_

_server.js Express entry point_

_.env Secrets (git-ignored)_

_src/app/_

_components/ Layout, SignUp, Dashboard, Workspace, Marketplace,_

_Checkout, Settings, PublicView, PageManager,_

_TemplateLibrary, WebsitePreview_

_data/ templates.ts (30 built-in templates)_

_types/ index.ts_

_utils/ zipExport.ts_

_App.tsx Root component & router_

_package.json Frontend dependencies (Vite + React + Tailwind)_

_vite.config.ts_