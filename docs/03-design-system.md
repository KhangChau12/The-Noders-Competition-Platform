# Design System & UI Guidelines

**Project**: AI Competition Platform
**Organization**: The Noders PTNK
**Version**: 1.0
**Last Updated**: 17/11/2025

---

## 1. Design Philosophy

### 1.1 Core Principles
This platform follows **The Noders PTNK Design Identity** with these core values:

- **Tech-First Aesthetic**: Design reflects AI/ML and developer culture
- **Modern Minimalism**: Clean, content-focused, no clutter
- **Dark Mode Identity**: Dark theme as primary (matches coding environments)
- **Performance Matters**: Fast loading, smooth interactions
- **Accessible by Default**: WCAG 2.1 AA compliance

### 1.2 Brand Personality
- Professional yet approachable
- Technical but not intimidating
- Competitive yet collaborative
- Modern and innovative

---

## 2. Design Tokens

### 2.1 Color Palette

#### Primary Identity Colors
```css
/* Core Brand Colors - Use these for key elements */
--color-primary-blue: #2563EB;    /* Main brand color */
--color-accent-cyan: #06B6D4;     /* Accent/highlight color */
--gradient-brand: linear-gradient(135deg, #2563EB 0%, #06B6D4 100%);
```

**Usage**:
- Primary buttons, links, active states
- Important headings (gradient text)
- Call-to-action elements
- Focus indicators

#### Dark Theme Foundation
```css
/* Backgrounds */
--color-bg-primary: #0F172A;      /* Main background (navy deep) */
--color-bg-surface: #1E293B;      /* Cards, panels, modals (navy light) */
--color-bg-elevated: #334155;     /* Elevated surfaces, dropdowns */

/* Borders */
--color-border-default: #334155;  /* Default borders */
--color-border-subtle: #475569;   /* Subtle dividers */
--color-border-focus: #2563EB;    /* Focus/active borders */
```

#### Text Hierarchy
```css
/* Text Colors */
--color-text-primary: #F8FAFC;    /* Main content (soft white) */
--color-text-secondary: #CBD5E1;  /* Supporting text (light gray) */
--color-text-tertiary: #94A3B8;   /* Metadata, captions (muted gray) */
--color-text-disabled: #64748B;   /* Disabled states */
```

#### Semantic Colors
```css
/* Status Colors */
--color-success: #059669;         /* Success messages, approvals */
--color-warning: #D97706;         /* Warnings, cautions */
--color-error: #DC2626;           /* Errors, destructive actions */
--color-info: #2563EB;            /* Info messages (same as primary) */
```

#### Competition Phase Colors
```css
/* Phase-specific colors */
--color-phase-registration: #8B5CF6;  /* Purple */
--color-phase-public: #2563EB;        /* Blue */
--color-phase-private: #06B6D4;       /* Cyan */
--color-phase-ended: #64748B;         /* Gray */
```

### 2.2 Typography

#### Font Families
```css
/* Primary Font - Nunito (UI and Content) */
--font-primary: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Display Font - Shrikhand (Optional for brand) */
--font-display: 'Shrikhand', cursive;

/* Monospace Font - JetBrains Mono (Code/Tech) */
--font-mono: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
```

**Import via Google Fonts**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&family=Shrikhand&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

#### Type Scale
```css
/* Font Sizes */
--text-xs: 0.75rem;      /* 12px - Small labels, captions */
--text-sm: 0.875rem;     /* 14px - Metadata, secondary text */
--text-base: 1rem;       /* 16px - Body text (base) */
--text-lg: 1.125rem;     /* 18px - Emphasized body */
--text-xl: 1.25rem;      /* 20px - Subheadings */
--text-2xl: 1.5rem;      /* 24px - Section headings */
--text-3xl: 1.875rem;    /* 30px - Page titles */
--text-4xl: 2.25rem;     /* 36px - Large headings */
--text-5xl: 3rem;        /* 48px - Hero headings */
--text-6xl: 4.5rem;      /* 72px - Extra large (desktop only) */

/* Font Weights */
--font-light: 300;
--font-regular: 400;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.25;   /* Headings */
--leading-snug: 1.375;   /* Large text */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.625; /* Long-form content */
```

### 2.3 Spacing System

Based on **4px** base unit:

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

**Usage Guidelines**:
- **Gap between small elements**: 8-12px (`space-2` to `space-3`)
- **Padding inside cards**: 24-32px (`space-6` to `space-8`)
- **Section spacing**: 64-80px (`space-16` to `space-20`)
- **Hero padding**: 80-96px (`space-20` to `space-24`)

### 2.4 Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - Small elements */
--radius-md: 0.5rem;     /* 8px - Buttons, badges */
--radius-lg: 0.75rem;    /* 12px - Cards, inputs */
--radius-xl: 1rem;       /* 16px - Large cards */
--radius-2xl: 1.25rem;   /* 20px - Modals */
--radius-full: 9999px;   /* Pills, avatars, rounded buttons */
```

### 2.5 Shadows

```css
/* Elevation Shadows */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

/* Blue Glow (for tech aesthetic) */
--glow-blue-sm: 0 0 10px rgba(37, 99, 235, 0.3);
--glow-blue-md: 0 0 20px rgba(37, 99, 235, 0.4);
--glow-cyan-sm: 0 0 10px rgba(6, 182, 212, 0.3);
```

### 2.6 Animations

```css
/* Durations */
--duration-fast: 150ms;      /* Color changes */
--duration-normal: 200ms;    /* Hover effects (most common) */
--duration-medium: 300ms;    /* Transforms, shadows */
--duration-slow: 500ms;      /* Page transitions */

/* Easing Functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);      /* Most common */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 3. Component Library

### 3.1 Buttons

#### Variants

**Primary Button** (Main CTA):
```tsx
<button className="btn-primary">
  Submit Solution
</button>
```
```css
.btn-primary {
  background: var(--gradient-brand);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: var(--font-semibold);
  transition: transform var(--duration-normal) var(--ease-out);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--glow-blue-md);
}
```

**Secondary Button**:
```tsx
<button className="btn-secondary">
  View Details
</button>
```
```css
.btn-secondary {
  background: var(--color-bg-surface);
  color: var(--color-primary-blue);
  border: 1px solid var(--color-border-default);
  padding: 12px 24px;
  border-radius: var(--radius-md);
}

.btn-secondary:hover {
  border-color: var(--color-primary-blue);
  background: rgba(37, 99, 235, 0.1);
}
```

**Ghost Button**:
```css
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 12px 24px;
}

.btn-ghost:hover {
  background: var(--color-bg-surface);
  color: var(--color-text-primary);
}
```

**Danger Button**:
```css
.btn-danger {
  background: var(--color-error);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-md);
}
```

#### Sizes
```css
.btn-sm { padding: 8px 16px; font-size: var(--text-sm); }
.btn-md { padding: 12px 24px; font-size: var(--text-base); } /* Default */
.btn-lg { padding: 16px 32px; font-size: var(--text-lg); }
```

#### States
```css
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-loading::after {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

### 3.2 Cards

**Standard Card**:
```tsx
<div className="card">
  <h3>Competition Title</h3>
  <p>Description goes here...</p>
</div>
```
```css
.card {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all var(--duration-normal) var(--ease-out);
}

.card:hover {
  border-color: var(--color-primary-blue);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg), var(--glow-blue-sm);
}
```

**Card with Image**:
```tsx
<div className="card-with-image">
  <img src="..." alt="..." />
  <div className="card-content">
    <h3>Title</h3>
    <p>Description</p>
  </div>
</div>
```

**Elevated Card** (for important info):
```css
.card-elevated {
  background: var(--color-bg-elevated);
  box-shadow: var(--shadow-md);
}
```

### 3.3 Badges

**Phase Badge**:
```tsx
<span className="badge badge-registration">Registration</span>
<span className="badge badge-public">Public Test</span>
<span className="badge badge-private">Private Test</span>
<span className="badge badge-ended">Ended</span>
```
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  font-family: var(--font-mono);
}

.badge-registration {
  background: rgba(139, 92, 246, 0.2);
  color: #A78BFA;
}

.badge-public {
  background: rgba(37, 99, 235, 0.2);
  color: #60A5FA;
}

.badge-private {
  background: rgba(6, 182, 212, 0.2);
  color: #22D3EE;
}

.badge-ended {
  background: rgba(100, 116, 139, 0.2);
  color: #94A3B8;
}
```

**Status Badge**:
```tsx
<span className="badge badge-success">Approved</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Rejected</span>
```

**Tech Badge** (for displaying technologies):
```css
.badge-tech {
  font-family: var(--font-mono);
  background: rgba(37, 99, 235, 0.15);
  color: var(--color-accent-cyan);
  border: 1px solid rgba(37, 99, 235, 0.3);
}
```

### 3.4 Forms

#### Input Field
```tsx
<div className="form-group">
  <label htmlFor="email" className="form-label">Email</label>
  <input
    type="email"
    id="email"
    className="form-input"
    placeholder="you@example.com"
  />
  <p className="form-helper">We'll never share your email</p>
</div>
```
```css
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--color-text-primary);
}

.form-input {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--color-text-primary);
  font-size: var(--text-base);
  transition: all var(--duration-normal);
}

.form-input:focus {
  outline: none;
  border-color: transparent;
  box-shadow: 0 0 0 2px var(--color-primary-blue);
}

.form-helper {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
```

#### Error State
```tsx
<input className="form-input form-input-error" />
<p className="form-error">Please enter a valid email</p>
```
```css
.form-input-error {
  border-color: var(--color-error);
}

.form-input-error:focus {
  box-shadow: 0 0 0 2px var(--color-error);
}

.form-error {
  font-size: var(--text-sm);
  color: var(--color-error);
}
```

#### File Upload (Drag & Drop)
```tsx
<div className="file-upload">
  <div className="file-upload-icon">📁</div>
  <p className="file-upload-text">Drag & drop CSV file here</p>
  <p className="file-upload-subtext">or click to browse</p>
  <input type="file" accept=".csv" hidden />
</div>
```
```css
.file-upload {
  border: 2px dashed var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-12);
  text-align: center;
  cursor: pointer;
  transition: all var(--duration-normal);
}

.file-upload:hover {
  border-color: var(--color-primary-blue);
  background: rgba(37, 99, 235, 0.05);
}

.file-upload.drag-over {
  border-color: var(--color-accent-cyan);
  background: rgba(6, 182, 212, 0.1);
}
```

### 3.5 Tables

**Leaderboard Table**:
```tsx
<table className="table">
  <thead>
    <tr>
      <th>Rank</th>
      <th>User</th>
      <th>Score</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row-highlight">
      <td>1</td>
      <td>user123</td>
      <td>0.9234</td>
    </tr>
  </tbody>
</table>
```
```css
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  background: var(--color-bg-surface);
  padding: var(--space-4);
  text-align: left;
  font-weight: var(--font-semibold);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border-default);
}

.table td {
  padding: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.table tr:hover {
  background: var(--color-bg-surface);
}

.table-row-highlight {
  background: rgba(37, 99, 235, 0.1);
  border-left: 3px solid var(--color-primary-blue);
}
```

### 3.6 Modals

```tsx
<div className="modal-overlay">
  <div className="modal">
    <div className="modal-header">
      <h2>Confirm Submission</h2>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      <p>Are you sure you want to submit?</p>
    </div>
    <div className="modal-footer">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-2xl);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-6);
  border-bottom: 1px solid var(--color-border-default);
}

.modal-body {
  padding: var(--space-6);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-6);
  border-top: 1px solid var(--color-border-default);
}
```

### 3.7 Navigation

**Desktop Header**:
```tsx
<header className="header">
  <div className="header-container">
    <a href="/" className="logo">
      <span className="logo-text">The Noders</span>
      <span className="logo-accent">Competition</span>
    </a>

    <nav className="nav">
      <a href="/competitions" className="nav-link">Competitions</a>
      <a href="/leaderboard" className="nav-link nav-link-active">Leaderboard</a>
      <a href="/about" className="nav-link">About</a>
    </nav>

    <div className="header-actions">
      <button className="btn-secondary">Login</button>
      <button className="btn-primary">Sign Up</button>
    </div>
  </div>
</header>
```
```css
.header {
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--color-border-default);
  position: sticky;
  top: 0;
  z-index: 40;
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-text {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav {
  display: flex;
  gap: var(--space-6);
}

.nav-link {
  color: var(--color-text-secondary);
  font-weight: var(--font-semibold);
  transition: color var(--duration-fast);
}

.nav-link:hover {
  color: var(--color-text-primary);
}

.nav-link-active {
  color: var(--color-primary-blue);
  position: relative;
}

.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-brand);
}
```

**Mobile Menu** (Hamburger):
```tsx
<button className="mobile-menu-btn">
  <span className="hamburger-line"></span>
  <span className="hamburger-line"></span>
  <span className="hamburger-line"></span>
</button>
```

### 3.8 Countdown Timer

```tsx
<div className="countdown">
  <div className="countdown-item">
    <span className="countdown-value">03</span>
    <span className="countdown-label">Days</span>
  </div>
  <div className="countdown-separator">:</div>
  <div className="countdown-item">
    <span className="countdown-value">14</span>
    <span className="countdown-label">Hours</span>
  </div>
  <div className="countdown-separator">:</div>
  <div className="countdown-item">
    <span className="countdown-value">27</span>
    <span className="countdown-label">Minutes</span>
  </div>
</div>
```
```css
.countdown {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: center;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-6);
}

.countdown-value {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  font-family: var(--font-mono);
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.countdown-label {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.countdown-separator {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--color-text-tertiary);
}
```

### 3.9 Loading States

**Skeleton Loader**:
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg-surface) 0%,
    var(--color-bg-elevated) 50%,
    var(--color-bg-surface) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-text {
  height: 1em;
  margin-bottom: 0.5em;
}

.skeleton-card {
  height: 200px;
}
```

**Spinner**:
```tsx
<div className="spinner"></div>
```
```css
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-bg-elevated);
  border-top-color: var(--color-primary-blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## 4. Layout Patterns

### 4.1 Container System
```css
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.container-sm {
  max-width: 768px;
}

.container-lg {
  max-width: 1536px;
}
```

### 4.2 Grid System
```css
.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }

/* Responsive */
@media (min-width: 640px) {
  .sm\:grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
}
```

### 4.3 Hero Section
```tsx
<section className="hero">
  <div className="hero-content">
    <h1 className="hero-title">
      Compete in AI Challenges
    </h1>
    <p className="hero-subtitle">
      Test your machine learning skills against the best
    </p>
    <div className="hero-actions">
      <button className="btn-primary btn-lg">Get Started</button>
      <button className="btn-secondary btn-lg">Learn More</button>
    </div>
  </div>
  <div className="hero-decoration">
    {/* Neural network SVG or decorative elements */}
  </div>
</section>
```
```css
.hero {
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-20) var(--space-6);
  position: relative;
  overflow: hidden;
}

.hero-title {
  font-size: var(--text-5xl);
  font-weight: var(--font-extrabold);
  line-height: var(--leading-tight);
  background: var(--gradient-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: var(--space-6);
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}
```

### 4.4 Section Layout
```tsx
<section className="section">
  <div className="container">
    <div className="section-header">
      <h2 className="section-title">Active Competitions</h2>
      <p className="section-description">
        Join ongoing competitions and climb the leaderboard
      </p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3">
      {/* Competition cards */}
    </div>
  </div>
</section>
```
```css
.section {
  padding: var(--space-20) 0;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-title {
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin-bottom: var(--space-4);
}

.section-description {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}
```

---

## 5. AI/Tech Aesthetic Elements

### 5.1 Neural Network Background
```tsx
<svg className="neural-network-bg" viewBox="0 0 1000 1000">
  {/* SVG nodes and connections */}
  <circle cx="100" cy="100" r="4" className="node" />
  <line x1="100" y1="100" x2="200" y2="150" className="connection" />
  {/* More nodes... */}
</svg>
```
```css
.neural-network-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.1;
  z-index: -1;
}

.node {
  fill: var(--color-accent-cyan);
  animation: pulse 3s ease-in-out infinite;
}

.connection {
  stroke: var(--color-primary-blue);
  stroke-width: 1;
  opacity: 0.5;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
```

### 5.2 Glowing Card Effect
```css
.card-glow {
  position: relative;
}

.card-glow::before {
  content: '';
  position: absolute;
  inset: -1px;
  background: var(--gradient-brand);
  border-radius: var(--radius-lg);
  opacity: 0;
  transition: opacity var(--duration-normal);
  z-index: -1;
}

.card-glow:hover::before {
  opacity: 0.2;
}
```

### 5.3 Tech Grid Background
```css
.tech-grid-bg {
  background-image:
    linear-gradient(var(--color-border-default) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.1;
}
```

---

## 6. Responsive Design

### 6.1 Breakpoints
```css
/* Mobile: < 640px (default) */

/* Tablet: 640px - 1024px */
@media (min-width: 640px) {
  /* Styles */
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  /* Styles */
}

/* Wide: 1280px+ */
@media (min-width: 1280px) {
  /* Styles */
}
```

### 6.2 Typography Scaling
```css
/* Mobile */
.hero-title {
  font-size: var(--text-3xl); /* 30px */
}

/* Desktop */
@media (min-width: 1024px) {
  .hero-title {
    font-size: var(--text-5xl); /* 48px */
  }
}
```

### 6.3 Navigation Responsive
```css
/* Mobile: Hide desktop nav, show hamburger */
@media (max-width: 1023px) {
  .nav { display: none; }
  .mobile-menu-btn { display: block; }
}

/* Desktop: Show nav, hide hamburger */
@media (min-width: 1024px) {
  .nav { display: flex; }
  .mobile-menu-btn { display: none; }
}
```

---

## 7. Accessibility

### 7.1 Focus Indicators
```css
*:focus-visible {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--color-primary-blue);
  outline-offset: 2px;
}
```

### 7.2 Color Contrast
All text meets **WCAG 2.1 AA** standards:
- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio

### 7.3 ARIA Labels
```tsx
<button aria-label="Close modal">
  ×
</button>

<nav aria-label="Main navigation">
  {/* Links */}
</nav>

<div role="status" aria-live="polite">
  Submission successful!
</div>
```

---

## 8. Tailwind CSS Configuration

If using Tailwind CSS, configure with The Noders theme:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2563EB',
        'accent-cyan': '#06B6D4',
        'bg-primary': '#0F172A',
        'bg-surface': '#1E293B',
        'bg-elevated': '#334155',
        'border-default': '#334155',
        'text-primary': '#F8FAFC',
        'text-secondary': '#CBD5E1',
        'text-tertiary': '#94A3B8',
      },
      fontFamily: {
        'sans': ['Nunito', 'sans-serif'],
        'display': ['Shrikhand', 'cursive'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
      },
    },
  },
  plugins: [],
}
```

---

## 9. Design Checklist

### 9.1 Before Launch
- [ ] All colors match The Noders palette
- [ ] Gradient (blue-cyan) used for key CTAs
- [ ] Dark theme applied consistently
- [ ] Hover states on all interactive elements
- [ ] Focus indicators visible
- [ ] Responsive on mobile, tablet, desktop
- [ ] Typography scale consistent
- [ ] Loading states implemented
- [ ] Error states styled
- [ ] Empty states designed
- [ ] Keyboard navigation works
- [ ] Color contrast passes WCAG AA
- [ ] Alt text on all images
- [ ] ARIA labels where needed

### 9.2 Quality Assurance
- [ ] Test on Chrome, Firefox, Safari, Edge
- [ ] Test on iOS Safari, Chrome Android
- [ ] Test with screen reader (VoiceOver, NVDA)
- [ ] Test keyboard-only navigation
- [ ] Validate HTML (W3C Validator)
- [ ] Check performance (Lighthouse score)

---

## Appendix: Example Pages

### Competition Card (Browse Page)
```tsx
<div className="card card-competition">
  <div className="card-header">
    <span className="badge badge-public">Public Test</span>
    <span className="badge badge-tech">F1 Score</span>
  </div>

  <h3 className="card-title">Image Classification Challenge</h3>
  <p className="card-description">
    Classify images into 10 categories using deep learning
  </p>

  <div className="card-stats">
    <div className="stat">
      <span className="stat-value">127</span>
      <span className="stat-label">Participants</span>
    </div>
    <div className="stat">
      <span className="stat-value">5 days</span>
      <span className="stat-label">Remaining</span>
    </div>
  </div>

  <div className="card-footer">
    <button className="btn-primary btn-sm">View Details</button>
  </div>
</div>
```

---

**Document Status**: ✅ Ready for Implementation
**Next Steps**: Proceed to [04-project-structure.md](04-project-structure.md)
