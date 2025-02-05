import { ApiState } from '$components';
import { Models } from '$shared';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserForm } from './components/user-form';
import { UserList } from './components/user-list';
import { usersStore } from './shared/stores/api.store';
import { usersUiStore } from './shared/stores/ui.store';
import './users.page.scss';

export function Users() {
  const { data: usersData, state: usersState, refresh, reset, post, put, remove } = usersStore;

  const { state: uiState, update } = usersUiStore.useContext();
  /** Stuff to do on load */
  // useEffect(() => {}, []);

  const [user, setUser] = useState<Models.User | null>(uiState || null);

  const editUser = (user: Models.User) => {
    setUser(user);
    update(user);
  };

  /**
   * Delete a user
   * @param user
   */
  const deleteUser = (user: Models.User) => {
    const c = confirm(`Are you sure you want to remove ${user.name}?`);
    if (c) {
      remove(user);
      update(null);
    }
  };

  /**
   * Add/update a user
   * @param userUpdated
   */
  const upsertUser = (userUpdated: Models.User) => {
    userUpdated.id ? put(userUpdated) : post(userUpdated);
    update(null);
  };

  // UI Store
  // const { state, update } = routeUiStore.useContext();
  // const [username, setUsername] = useState(state.username);

  return (
    <div id="users-page">
      <Helmet>
        <title>Manage Users</title>
        <meta name="description" content="Starter Application for React projects" />
      </Helmet>
      <div className="page-content">
        <div className="container-fluid">
          <div style={{ float: 'right' }}>
            <Button onClick={() => refresh()}>Refresh</Button> <Button onClick={() => reset()}>Reset</Button>
          </div>
          <h1>Current Users</h1>
          <div className="row">
            <div className="col col-12 col-md-8">
              <ApiState state={usersState}>
                <UserList users={usersData} editUser={editUser} deleteUser={deleteUser}></UserList>
              </ApiState>
            </div>
            <div className="col col-12 col-md-4">
              <Card>
                <UserForm user={user} userUpdated={upsertUser} userReset={() => update(null)}></UserForm>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
