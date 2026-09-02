import { type ReactNode } from 'react';

/**
 * Sistema de diseño oscuro (replicado del repositorio original gestion-ventas).
 * Componentes: Button, Card, Field, Badge, Spinner, ErrorMsg, Modal, Table,
 * Empty, ConfirmDialog.
 */

export function Button({
  children, onClick, variant = 'primary', type = 'button', disabled, className = '', title,
}: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'danger' | 'ghost' | 'success' | 'warn';
  type?: 'button' | 'submit'; disabled?: boolean; className?: string; title?: string;
}) {
  const styles = {
    primary: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-500/30',
    warn: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/30',
    ghost: 'bg-transparent text-zinc-400 border border-zinc-700 hover:text-zinc-200 hover:border-zinc-500',
  }[variant];
  return (
    <button
      // eslint-disable-next-line react/button-has-type
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1.5 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '', title, actions, onClick, pad = true }: {
  children: ReactNode; className?: string; title?: string; actions?: ReactNode; onClick?: () => void; pad?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-zinc-900/50 border border-zinc-800 rounded-xl ${pad ? 'p-4' : ''} transition-colors hover:border-zinc-700 ${className}`}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-zinc-100">{title}</h3>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block mb-1 text-xs font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

export function Badge({ color, children }: { color: 'green' | 'red' | 'amber' | 'blue' | 'magenta' | 'gray'; children: ReactNode }) {
  const map = {
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    magenta: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    gray: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  }[color];
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[0.65rem] font-medium border ${map}`}>{children}</span>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-zinc-500 py-8 justify-center">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      <span className="text-xs">{label || 'Cargando…'}</span>
    </div>
  );
}

export function ErrorMsg({ msg, onRetry }: { msg: string; onRetry?: () => void }) {
  return (
    <div className="text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg p-3 text-xs flex items-center justify-between">
      <span>{msg}</span>
      {onRetry && <Button variant="ghost" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl' }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className={`bg-zinc-900 border border-zinc-800 rounded-xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto shadow-2xl shadow-black/40`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-sm text-zinc-100">{title}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 text-lg leading-none transition-colors">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-zinc-500 border-b border-zinc-800">
            {headers.map((h) => <th key={h} className="py-2 px-3 font-medium whitespace-nowrap">{h}</th>)}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Empty({ msg }: { msg: string }) {
  return <div className="text-zinc-500 text-xs text-center py-8">{msg}</div>;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Eliminar' }: {
  open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmText?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="font-semibold text-sm text-zinc-100">{title}</h2>
        </div>
        <div className="p-5 text-xs text-zinc-400">{message}</div>
        <div className="flex justify-end gap-2 px-5 pb-5">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}

/** Número seguro a int, con clamp entre mín y máx. */
export function clampInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}
