export type AppView = 'sessions' | 'changes' | 'teachers' | 'forum';

interface MainNavProps {
  activeView: AppView;
  unreadChangeCount: number;
  onChangeView: (view: AppView) => void;
}

const navItems: Array<{ view: AppView; label: string }> = [
  { view: 'sessions', label: 'Calendrier / Cours' },
  { view: 'changes', label: 'Modifications récentes' },
  { view: 'forum', label: 'Forum' },
  { view: 'teachers', label: 'Professeurs' },
];

export function MainNav({ activeView, unreadChangeCount, onChangeView }: MainNavProps) {
  return (
    <nav className="main-nav" aria-label="Navigation principale">
      {navItems.map((item) => (
        <button
          className={activeView === item.view ? 'nav-button nav-button--active' : 'nav-button'}
          key={item.view}
          type="button"
          onClick={() => onChangeView(item.view)}
        >
          <span>{item.label}</span>
          {item.view === 'changes' && unreadChangeCount > 0 ? (
            <span className="nav-notification-count" aria-label={`${unreadChangeCount} non lues`}>
              {unreadChangeCount > 99 ? '99+' : unreadChangeCount}
            </span>
          ) : null}
        </button>
      ))}
    </nav>
  );
}
