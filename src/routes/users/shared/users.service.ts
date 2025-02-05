/**
import { BehaviorSubject } from 'rxjs';

function ApiService() {
  const _state$ = new BehaviorSubject(null);
  const state$ = _state$.pipe();

  const get = () => {};

  return {
    state$,
    get,
  };
}

export const usersService = ApiService();

const { state$, get } = usersService;
state$.subscribe(state => {});
 */
