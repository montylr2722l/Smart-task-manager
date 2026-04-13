import { Link } from 'react-router-dom'
import { Check, ArrowRight, LayoutGrid, BellRing, CalendarClock, ListTodo } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import '../styles/Landing.css'

const taskPreview = [
  { title: 'Complete DSA assignment', detail: 'Due tomorrow at 11:59 PM', priority: 'High' },
  { title: 'Prepare DBMS notes', detail: 'Lecture recap and revision', priority: 'Medium' },
  { title: 'Plan weekend study sprint', detail: 'Break big goals into simple tasks', priority: 'Low' },
]

const features = [
  {
    icon: ListTodo,
    title: 'Add & Manage Tasks',
    description: 'Quickly create and organize your tasks with an intuitive interface.',
  },
  {
    icon: CalendarClock,
    title: 'Priority & Deadlines',
    description: 'Set priorities and due dates so important work never slips away.',
  },
  {
    icon: BellRing,
    title: 'Smart Reminders',
    description: 'Stay ahead of deadlines with timely reminders and better planning.',
  },
  {
    icon: LayoutGrid,
    title: 'Clean Dashboard',
    description: 'See your workload, progress, and priorities at a glance.',
  },
]

const priorityClassName = {
  High: 'landing-badge high',
  Medium: 'landing-badge medium',
  Low: 'landing-badge low',
}

export default function LandingPage() {
  const { user } = useAuth()
  const primaryLink = user ? '/dashboard' : '/register'
  const primaryLabel = user ? 'Go to Dashboard' : 'Get Started'

  return (
    <div className="landing-page">
      <header className="landing-shell landing-nav">
        <Link to="/" className="landing-brand">
          <span className="landing-brand-mark">
            <Check size={18} strokeWidth={3} />
          </span>
          <span className="landing-brand-text">Smart Task Manager</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Primary">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login" className="landing-login-link">
            Login
          </Link>
          <Link to={user ? '/dashboard' : '/register'} className="landing-register-link">
            {user ? 'Dashboard' : 'Register'}
          </Link>
        </nav>
      </header>

      <main>
        <section id="home" className="landing-shell landing-hero">
          <div className="landing-copy">
            <span className="landing-kicker">Student-friendly task planning</span>
            <h1>
              Organize Your Tasks.
              <br />
              <span>Boost Your Productivity.</span>
            </h1>
            <p>
              Smart Task Manager helps college students and beginners stay organized with
              a simple, modern workspace. Track tasks, set priorities, and keep every
              deadline under control.
            </p>

            <div className="landing-actions">
              <Link to={primaryLink} className="landing-primary-btn">
                {primaryLabel}
                <ArrowRight size={18} />
              </Link>
              <a href="#features" className="landing-secondary-btn">
                View Demo
              </a>
            </div>
          </div>

          <div className="landing-preview" aria-label="Task preview cards">
            {taskPreview.map((task, index) => (
              <article key={task.title} className="landing-task-card" style={{ animationDelay: `${index * 120}ms` }}>
                <div className="landing-task-top">
                  <div className="landing-task-main">
                    <span className="landing-task-check" />
                    <div>
                      <h3>{task.title}</h3>
                      <p>{task.detail}</p>
                    </div>
                  </div>
                  <span className={priorityClassName[task.priority]}>{task.priority}</span>
                </div>
                <div className="landing-progress">
                  <span />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="landing-shell landing-features">
          <div className="landing-section-head">
            <h2>
              Everything You Need to Stay <span>Organized</span>
            </h2>
            <p>Powerful features designed to help you manage your tasks efficiently.</p>
          </div>

          <div className="landing-feature-grid">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="landing-feature-card">
                <div className="landing-feature-icon">
                  <Icon size={20} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className="landing-shell landing-cta-wrap">
          <div className="landing-cta">
            <h2>Ready to Get Started?</h2>
            <p>Join students who want a cleaner way to manage deadlines, priorities, and daily focus.</p>
            <Link to={primaryLink} className="landing-primary-btn">
              {user ? 'Open Dashboard' : 'Create Free Account'}
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell">
          <p>© 2026 Smart Task Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
