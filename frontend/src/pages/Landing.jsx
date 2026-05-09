import { Link } from 'react-router-dom'
import { Check, ArrowRight, LayoutGrid, BellRing, CalendarClock, ListTodo } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'

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
  High: 'bg-red-500/15 text-red-300',
  Medium: 'bg-amber-500/15 text-amber-300',
  Low: 'bg-emerald-500/15 text-emerald-300',
}

const shellClass = 'mx-auto w-[min(1180px,calc(100%_-_24px))] sm:w-[min(1180px,calc(100%_-_40px))]'

export default function LandingPage() {
  const { user } = useAuth()
  const primaryLink = user ? '/dashboard' : '/register'
  const primaryLabel = user ? 'Go to Dashboard' : 'Get Started'

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#090b14] text-slate-100">
      <header className={`${shellClass} flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between lg:py-7`}>
        <Link to="/" className="inline-flex items-center gap-3 no-underline">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8b7cff] to-[#6ca9ff] text-white shadow-[0_14px_30px_rgba(139,124,255,0.28)]">
            <Check size={18} strokeWidth={3} />
          </span>
          <span className="font-bold text-[#9e93ff]">Smart Task Manager</span>
        </Link>

        <nav className="flex max-w-full items-center gap-3 overflow-x-auto text-sm sm:gap-6 sm:text-base" aria-label="Primary">
          <a className="shrink-0 text-slate-200/85 no-underline hover:text-white" href="#home">Home</a>
          <a className="shrink-0 text-slate-200/85 no-underline hover:text-white" href="#features">Features</a>
          <a className="shrink-0 text-slate-200/85 no-underline hover:text-white" href="#about">About</a>
          <Link to="/login" className="shrink-0 text-slate-200/85 no-underline hover:text-white">
            Login
          </Link>
          <Link
            to={user ? '/dashboard' : '/register'}
            className="shrink-0 rounded-xl bg-gradient-to-br from-[#8b7cff] to-[#7060ff] px-4 py-2.5 font-bold text-white no-underline shadow-[0_16px_32px_rgba(112,96,255,0.28)]"
          >
            {user ? 'Dashboard' : 'Register'}
          </Link>
        </nav>
      </header>

      <main>
        <section id="home" className={`${shellClass} grid grid-cols-1 items-center gap-9 py-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-14 lg:py-16`}>
          <div className="min-w-0">
            <span className="inline-flex rounded-full border border-[#8b7cff]/20 bg-[#8b7cff]/10 px-3.5 py-2 text-sm font-semibold text-[#d8d2ff]">
              Student-friendly task planning
            </span>
            <h1 className="mt-5 text-[clamp(2.6rem,12vw,4.9rem)] font-black leading-[1.04] tracking-[-0.04em] text-white sm:text-[clamp(3rem,7vw,4.9rem)]">
              Organize Your Tasks.
              <br />
              <span className="text-[#8b7cff]">Boost Your Productivity.</span>
            </h1>
            <p className="mt-5 max-w-[620px] text-base leading-7 text-slate-200/70 sm:text-lg">
              Smart Task Manager helps college students and beginners stay organized with
              a simple, modern workspace. Track tasks, set priorities, and keep every
              deadline under control.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link to={primaryLink} className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[#8b7cff] to-[#6f85ff] px-5 font-bold text-white no-underline shadow-[0_18px_36px_rgba(111,133,255,0.28)] transition hover:-translate-y-0.5">
                {primaryLabel}
                <ArrowRight size={18} />
              </Link>
              <a href="#features" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 font-bold text-slate-50 no-underline transition hover:-translate-y-0.5">
                View Demo
              </a>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4" aria-label="Task preview cards">
            {taskPreview.map((task) => (
              <article
                key={task.title}
                className="min-w-0 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_22px_44px_rgba(0,0,0,0.24)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#8b7cff]/25 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3.5">
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full border-2 border-[#8b7cff] shadow-[inset_0_0_0_4px_rgba(139,124,255,0.08)]" />
                    <div className="min-w-0">
                      <h3 className="m-0 break-words text-base font-bold text-slate-50">{task.title}</h3>
                      <p className="mt-1.5 break-words text-sm text-slate-200/65 sm:text-base">{task.detail}</p>
                    </div>
                  </div>
                  <span className={`inline-flex min-w-20 shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-sm font-bold ${priorityClassName[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
                  <span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-[#8b7cff] to-[#6ca9ff]" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className={`${shellClass} pb-16 lg:pb-24`}>
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="m-0 text-[clamp(2rem,8vw,3.2rem)] font-black leading-tight tracking-[-0.04em] text-white">
              Everything You Need to Stay <span className="text-[#8b7cff]">Organized</span>
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-200/70">
              Powerful features designed to help you manage your tasks efficiently.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-0.5 hover:border-[#8b7cff]/25">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#8b7cff]/20 bg-[#8b7cff]/15 text-[#8b7cff]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-50">{title}</h3>
                <p className="mt-2.5 leading-7 text-slate-200/70">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="about" className={`${shellClass} pb-16 lg:pb-20`}>
          <div className="rounded-3xl border border-white/10 bg-[#8b7cff]/10 px-5 py-10 text-center sm:px-7 sm:py-14">
            <h2 className="m-0 text-[clamp(2rem,8vw,3.2rem)] font-black leading-tight tracking-[-0.04em] text-white">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-200/70">
              Join students who want a cleaner way to manage deadlines, priorities, and daily focus.
            </p>
            <Link to={primaryLink} className="mt-7 inline-flex min-h-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8b7cff] to-[#6f85ff] px-5 font-bold text-white no-underline shadow-[0_18px_36px_rgba(111,133,255,0.28)]">
              {user ? 'Open Dashboard' : 'Create Free Account'}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-6">
        <div className={shellClass}>
          <p className="text-center text-slate-200/55">© 2026 Smart Task Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
