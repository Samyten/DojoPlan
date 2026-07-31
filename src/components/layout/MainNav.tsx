export type AppView = 'sessions' | 'changes' | 'teachers' | 'forum';

interface MainNavProps {
  activeView: AppView;
  unreadChangeCount: number;
  unreadForumCount: number;
  onChangeView: (view: AppView) => void;
}

const navItems: Array<{ view: AppView; label: string }> = [
  { view: 'sessions', label: 'Calendrier / Cours' },
  { view: 'changes', label: 'Modifications récentes' },
  { view: 'forum', label: 'Forum' },
  { view: 'teachers', label: 'Professeurs' },
];

export function MainNav({
  activeView,
  unreadChangeCount,
  unreadForumCount,
  onChangeView,
}: MainNavProps) {
  return (
    <nav className="main-nav" aria-label="Navigation principale">
      {navItems.map((item) => {
        const unreadCount =
          item.view === 'changes' ? unreadChangeCount : item.view === 'forum' ? unreadForumCount : 0;

        return (
          <button
            className={activeView === item.view ? 'nav-button nav-button--active' : 'nav-button'}
            key={item.view}
            type="button"
            onClick={() => onChangeView(item.view)}
          >
            <span>{item.label}</span>
            {unreadCount > 0 ? (
              <span
                className="nav-notification-count"
                aria-label={`${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
