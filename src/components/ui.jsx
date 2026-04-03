import { forwardRef } from 'react'

export function Card({ className = '', children, ...props }) {
  return (
    <div className={`stm-card ${className}`} {...props}>
      {children}
    </div>
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`stm-btn stm-btn-${variant} stm-btn-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      className={`stm-iconbtn stm-iconbtn-${variant} stm-iconbtn-${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="stm-field">
      {label ? <div className="stm-field-label">{label}</div> : null}
      {children}
      {hint ? <div className="stm-field-hint">{hint}</div> : null}
    </label>
  )
}

export const TextInput = forwardRef(function TextInput(
  { className = '', ...props },
  ref
) {
  return (
    <input ref={ref} className={`stm-input ${className}`} {...props} />
  )
})

export const SelectInput = forwardRef(function SelectInput(
  { className = '', ...props },
  ref
) {
  return (
    <select ref={ref} className={`stm-input ${className}`} {...props} />
  )
})

export function TextArea({ className = '', ...props }) {
  return <textarea className={`stm-input stm-textarea ${className}`} {...props} />
}

export function Modal({ open, title, onClose, children }) {
  if (!open) return null
  return (
    <div className="stm-modal-overlay" role="dialog" aria-modal="true">
      <button className="stm-modal-backdrop" onClick={onClose} aria-label="Close" />
      <div className="stm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stm-modal-header">
          <div className="stm-modal-title">{title}</div>
          <button className="stm-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="stm-modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Pill({ children, tone = 'neutral', className = '' }) {
  return (
    <span className={`stm-pill stm-pill-${tone} ${className}`}>
      {children}
    </span>
  )
}

export function ProgressBar({ value01, label }) {
  return (
    <div className="stm-progress" aria-label={label ?? 'Progress'}>
      <div
        className="stm-progress-fill"
        style={{ width: `${Math.round(value01 * 100)}%` }}
      />
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="stm-empty">
      <div className="stm-empty-title">{title}</div>
      {description ? <div className="stm-empty-desc">{description}</div> : null}
      {action ? <div className="stm-empty-action">{action}</div> : null}
    </div>
  )
}

