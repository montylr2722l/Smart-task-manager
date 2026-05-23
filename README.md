# Smart-task-manager

A React + Vite task management dashboard built to organize tasks, schedules, habits, and productivity.

## Features

- Dashboard overview with task summaries
- Tasks with **subtasks**, **tags**, and **AI breakdown**
- **Calendar** view for due dates
- **Weekly goals** and progress reports
- **Achievements / badges** for streaks and focus
- **Team shared lists** (create/join with share code)
- **Cloud sync** across devices (MongoDB + JWT)
- **Dark / light / system** theme
- **Push reminders** (browser notifications)
- **Export** tasks & analytics (CSV, PDF print, .ics for Google Calendar)
- **Offline PWA** — install on mobile/desktop
- Scheduler, Pomodoro, Habits, Analytics
- Authentication with Login/Register and protected routes

## Getting Started

1. `cd frontend && npm install`
2. `npm run dev`
3. Open http://localhost:5173

For the API: `cd backend && npm install && npm run dev`

## Mobile refresh / 404 on reload

This app uses client-side routing (`/login`, `/dashboard/tasks`, etc.). On refresh, the host must serve `index.html` for those paths (not look for a real file). Netlify, Vercel, and `vite preview` are configured via `public/_redirects`, `vercel.json`, and `netlify.toml`. If you deploy elsewhere, add the same SPA fallback rule for all routes.

## Tech Stack

- React 19
- Vite
- React Router DOM
- Recharts
- ESLint
