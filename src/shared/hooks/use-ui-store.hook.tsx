import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { NtsState } from '../context/api/api.models';

/** Default UI state */
interface UiState<t> {
  state: t;
  update: (state: Partial<t>) => void;
  reset: () => void;
}
// State Initial is fed initially do the createContext hook even though null is standard
// This will allow strict null checks to work.
// Without this if the context API hook is implemented wrong it will cause a nil error on runtime
const stateInitial = <t,>(state: t): UiState<t> => ({ state, update: _state => {}, reset: () => {} });

/**
*  Hook to generate a UI store which is used to manage UI state
*  @template t The type of the state.
*  @param {t} initialState The initial state of the hook.
*  @param {NtsState.UIStoreOptions} [options] Optional options to configure the hook.
*  @returns {Object} Returns an object containing the UI context and provider.
*  @example
import { Models, useUiStore } from '../../shared';
import { Users } from './users';

export const usersUiStore = useUiStore<Models.User>({ username: 'test@test.com' }, { persistId: 'usersUiStore' });

export function UsersRoute() {
  return (
    <usersUiStore.Provider>
      <Users></Users>
    </usersUiStore.Provider>
  );
}
// In a lower order component:
import { usersUiStore } from './users.route';

export function Users() {
  const { state, update, reset } = usersUiStore.useContext();
}
*/
export const useUiStore = <t extends object>(initialState: t, options?: NtsState.UIStoreOptions) => {
  const Context = createContext<UiState<t>>(stateInitial(initialState));

  /** Global UI State Context */
  const useUiContext = () => useContext(Context);

  /** Global UI State Provider */
  const Provider = ({ children }: { children?: ReactNode | null }) => {
    // Global UI State defaults
    const [uiState, setUiState] = useState<t>(() => {
      if (!options?.persistId) {
        return initialState;
      }
      // Check localStorage for any saved state first
      const savedState = localStorage.getItem(options.persistId);
      return savedState ? JSON.parse(savedState) : initialState;
    });

    // On Changes to uiState, update localstorage
    useEffect(() => {
      if (options?.persistId) {
        window.localStorage.setItem(options?.persistId, JSON.stringify(uiState));
      }
    }, [uiState]);

    /** Change global UI state. Accepts a partial of the UI state object */
    const update = (state: Partial<t>) => setUiState(stateSrc => ({ ...stateSrc, ...state }));
    /** Reset state */
    const reset = () => setUiState(initialState);
    return <Context.Provider value={{ state: uiState, update, reset }}>{children}</Context.Provider>;
  };

  return {
    useContext: useUiContext,
    Provider,
  };
};
