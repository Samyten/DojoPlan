export type AppView = 'sessions' | 'changes' | 'teachers';

interface MainNavProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
}

const navItems: Array<{ view: AppView; label: string }> = [
  { view: 'sessions', label: 'Calendrier / Cours' },
  { view: 'changes', label: 'Modifications récentes' },
  { view: 'teachers', label: 'Professeurs' },
];

export function MainNav({ activeView, onChangeView }: MainNavProps) {
  return (
    <nav className="main-nav" aria-label="Navigation principale">
      {navItems.map((item) => (
        <button
          className={activeView === item.view ? 'nav-button nav-button--active' : 'nav-button'}
          key={item.view}
          type="button"
          onClick={() => onChangeView(item.view)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
