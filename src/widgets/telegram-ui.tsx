import React from 'react';
import SlIcon from '@shoelace-style/shoelace/dist/react/icon';

export type IconName =
  | 'arrow-left' | 'menu' | 'person' | 'settings' | 'plus' | 'users'
  | 'link' | 'chevron' | 'receipt' | 'car' | 'building' | 'edit'
  | 'trash' | 'star' | 'check' | 'card' | 'currency' | 'lock'
  | 'phone' | 'share' | 'sparkles';

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const icons: Record<IconName, string> = {
    'arrow-left': 'chevron-left',
    menu: 'list',
    person: 'person-circle',
    settings: 'gear',
    plus: 'plus-lg',
    users: 'people-fill',
    link: 'link-45deg',
    chevron: 'chevron-right',
    receipt: 'receipt',
    car: 'car-front-fill',
    building: 'bank',
    edit: 'pencil',
    trash: 'trash3',
    star: 'star-fill',
    check: 'check-lg',
    card: 'credit-card-2-back',
    currency: 'currency-exchange',
    lock: 'lock-fill',
    phone: 'telephone',
    share: 'send',
    sparkles: 'stars',
  };

  return <SlIcon className="tg-icon" name={icons[name]} style={{ fontSize: `${size}px` }} aria-hidden="true" />;
}

export function TopBar({ title, onBack, left, right }: {
  title: string;
  onBack?: () => void;
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <header className="tg-topbar">
      <div className="tg-topbar-side tg-topbar-left">
        {onBack ? (
          <button className="tg-nav-button tg-nav-back" type="button" onClick={onBack} aria-label="Back">
            <Icon name="arrow-left" size={22} /><span>Back</span>
          </button>
        ) : left}
      </div>
      <h1>{title}</h1>
      <div className="tg-topbar-side tg-topbar-right">{right}</div>
    </header>
  );
}

const AVATAR_COLORS = ['blue', 'green', 'orange', 'violet', 'red', 'teal'];

export function Avatar({ name, size = 'md', icon }: { name: string; size?: 'sm' | 'md' | 'lg'; icon?: IconName }) {
  const hash = Array.from(name || '?').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const initials = (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return (
    <span className={`tg-avatar tg-avatar-${size} tg-avatar-${AVATAR_COLORS[hash % AVATAR_COLORS.length]}`} aria-hidden="true">
      {icon ? <Icon name={icon} size={size === 'lg' ? 24 : size === 'md' ? 19 : 15} /> : initials}
    </span>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="tg-section-title">{children}</h2>;
}

export function GroupedList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`tg-grouped-list ${className}`}>{children}</div>;
}

export function ListRow({ avatar, title, subtitle, value, valueTone, onClick, chevron = false, leading, trailing, className = '' }: {
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  valueTone?: 'positive' | 'negative' | 'accent' | 'muted';
  onClick?: () => void;
  chevron?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
}) {
  const content = (
    <>
      {leading}
      {avatar}
      <span className="tg-row-copy">
        <span className="tg-row-title">{title}</span>
        {subtitle && <span className="tg-row-subtitle">{subtitle}</span>}
      </span>
      {value !== undefined && <span className={`tg-row-value ${valueTone ? `is-${valueTone}` : ''}`}>{value}</span>}
      {trailing}
      {chevron && <span className="tg-chevron"><Icon name="chevron" size={17} /></span>}
    </>
  );

  return onClick ? <button type="button" className={`tg-list-row ${className}`} onClick={onClick}>{content}</button> : <div className={`tg-list-row ${className}`}>{content}</div>;
}

export function PrimaryButton({ children, onClick, disabled = false, outline = false, destructive = false, className = '', type = 'button' }: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  outline?: boolean;
  destructive?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return <button type={type} className={`tg-primary-button ${outline ? 'is-outline' : ''} ${destructive ? 'is-destructive' : ''} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function Modal({ open, title, children, onClose, footer }: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="tg-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="tg-modal-sheet" role="dialog" aria-modal="true" aria-labelledby="tg-modal-title">
        <div className="tg-modal-handle" />
        <header className="tg-modal-header">
          <h2 id="tg-modal-title">{title}</h2>
        </header>
        <div className="tg-modal-body">{children}</div>
        {footer && <footer className="tg-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return <div className="tg-grouped-list tg-skeleton-list">{Array.from({ length: count }).map((_, index) => <div className="tg-skeleton-row" key={index}><span /><div><i /><i /></div></div>)}</div>;
}

export function EmptyState({ title, message, icon = 'receipt' }: { title: string; message: string; icon?: IconName }) {
  return <div className="tg-empty"><span className="tg-empty-icon"><Icon name={icon} size={30} /></span><strong>{title}</strong><p>{message}</p></div>;
}

export function toneForAmount(amount: number): 'positive' | 'negative' | 'muted' {
  return amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'muted';
}

export function personName(first: string, last: string) {
  return [first, last].filter(Boolean).join(' ') || 'Member';
}
