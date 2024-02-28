import { ApiState } from '$components';
import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import { userDetailsStore } from '../../shared/stores/api.store';

export function ViewUsers() {
  const { userId } = useParams(); // Get route params for user ID

  const { state, data, get, reset } = userDetailsStore.useContext();
  const navigate = useNavigate();

  /** Stuff to do on load */
  useEffect(() => {
    // If no user ID, navigate to main users page
    if (!userId) {
      navigate('/users');
      return;
    }
    get({ apiUrlAppend: '/' + userId, refresh: true }); // Get new user data in store
    return () => reset(); // Clear store out on exit. Prevents previous content from showing on next page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div>
      <Helmet>
        <title> {'View user information for ' + data?.name}</title>
      </Helmet>
      <ApiState state={state}>
        <div style={{ maxWidth: '500px', margin: 'auto' }}>
          <h1>{data?.name}</h1>
          <table className="table table-bordered mb-0">
            <tbody>
              <tr>
                <td>
                  <strong>Username</strong>
                </td>
                <td>{data?.username}</td>
              </tr>
              <tr>
                <td>
                  <strong>Email</strong>
                </td>
                <td>{data?.email}</td>
              </tr>
              <tr>
                <td>
                  <strong>Phone</strong>
                </td>
                <td>{data?.phone}</td>
              </tr>
              <tr>
                <td>
                  <strong>Website</strong>
                </td>
                <td>{data?.website}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </ApiState>
    </div>
  );
}
