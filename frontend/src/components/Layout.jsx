import { Outlet } from 'react-router-dom';
import Sidebar, { SidebarToggle } from './Sidebar';
import { useSidebarVisibility } from '../hooks/useSidebarVisibility';

export default function Layout() {
  const { hidden, toggle } = useSidebarVisibility();

  return (
    <div className={`app-shell ${hidden ? 'sidebar-hidden' : ''}`}>
      <Sidebar hidden={hidden} onToggle={toggle} />
      <main className="main">
        <div className="content-toolbar">
          <SidebarToggle hidden={hidden} onToggle={toggle} />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
