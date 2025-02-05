import { Route, Routes } from 'react-router-dom';
import { ViewUsers } from './routes/modify-users/view-users.page';
import { usersUiStore } from './shared/stores/ui.store';
import { Users } from './users.page';

export default function UsersRoutes() {
  return (
    <usersUiStore.Provider>
      <Routes>
        <Route path="view/:userId" element={<ViewUsers />} />
        <Route path="view" element={<ViewUsers />} />
        <Route path="/" element={<Users />} />
      </Routes>
    </usersUiStore.Provider>
  );
}
