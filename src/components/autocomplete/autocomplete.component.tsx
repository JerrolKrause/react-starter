import { Models } from '$shared';
import React, { useEffect, useRef, useState } from 'react';
import { ApiState, useHttp } from './use-http.hook';

interface AutoCompleteState<t, y> {
  textValue: string | null;
  users: t | null;
  posts: y | null;
}

type AutoCompleteStateTyped = AutoCompleteState<Models.User[], Models.Post[]>;

export const AutoComplete: React.FC = () => {
  const { state: usersState, get: getUsers } = useHttp<Models.User[]>('https://jsonplaceholder.typicode.com/users');
  const { state: postsState, get: getPosts } = useHttp<Models.Post[]>('https://jsonplaceholder.typicode.com/posts');

  const [searchValue, setSearchValue] = useState('');
  const [users, setUsers] = useState<null | Models.User[]>(null);
  const [posts, setPosts] = useState<null | Models.Post[]>(null);

  // State management
  // const [state, setState] = useState(initialState);
  // Is component mounted, use to prevent async operations when unmounted
  const isMounted = useRef(false);
  // Clear up and running debounce operation
  const timeoutIdRef = useRef<number | null>(null);

  console.log('Initing');

  /**
   * Debounce an input
   */
  let isDebouncing = false;
  let value = '';
  const debounceInputChanges = (e: React.ChangeEvent<HTMLInputElement>) => {
    value = e.target.value;
    setSearchValue(value);

    if (!isDebouncing) {
      isDebouncing = true;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = window.setTimeout(() => {
        // Update users after debounce
        Promise.all([getUsers(), getPosts()]).then(([users, posts]) => {
          // Update Users
          setUsers(
            !searchValue
              ? users
              : (users ?? [])?.filter(user =>
                  JSON.stringify(user)
                    .toLowerCase()
                    .replace(/[^a-zA-Z ]/g, '')
                    .includes((value ?? '').toLowerCase().replace(/[^a-zA-Z ]/g, '')),
                ),
          );
          // Update Posts
          setPosts(
            !searchValue
              ? posts
              : (posts ?? [])?.filter(post =>
                  JSON.stringify(post)
                    .toLowerCase()
                    .replace(/[^a-zA-Z ]/g, '')
                    .includes((value ?? '').toLowerCase().replace(/[^a-zA-Z ]/g, '')),
                ),
          );
        });
      }, 1000);
    }
  };

  useEffect(() => {
    console.log('useEffect');
    isMounted.current = true;

    // Hydrate app on load
    getUsers();
    getPosts();

    // On unmount
    return () => {
      isMounted.current = false;
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [getUsers, getPosts]);

  return (
    <div>
      <input value={searchValue ?? ''} onChange={debounceInputChanges} />
      <ApiStateComponent loading={usersState.loading} error={usersState.error}></ApiStateComponent>
      <hr />
      <DisplayOutput users={users} posts={posts}></DisplayOutput>
    </div>
  );
};

/**
 * Display users and posts
 * @param param0
 * @returns
 */
export const DisplayOutput: React.FC<Partial<AutoCompleteStateTyped>> = ({ users, posts }) => {
  // export const DisplayOutput: React.FC<{ state: AutoCompleteStateTyped }> = ({ state }) => {
  // const { users, posts }: AutoCompleteStateTyped = state;
  return (
    <>
      <h2>Users</h2>
      {users?.length ? users?.map(user => <div key={user.id}>{user.name}</div>) : <div>No users found</div>}
      <hr />
      <h2>Posts</h2>
      {posts?.length ? posts?.map(post => <div key={post.id}>{post.title}</div>) : <div>No posts found</div>}
    </>
  );
};

/**
 * Display API state
 * @param param0
 * @returns
 */
function ApiStateComponent<t>({ loading, error }: Partial<ApiState<t>>) {
  return (
    <>
      {loading && <div>Loading</div>}
      {!!error && <div>Error:{error}</div>}
    </>
  );
}
