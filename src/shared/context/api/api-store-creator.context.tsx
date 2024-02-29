import axios, { AxiosResponse } from 'axios';
import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStorage } from '../../hooks';
import { contextDefault, contextEntities } from './api-store.defaults';
import { NtsState } from './api.models';
import { apiUrlGet, deleteEntities, is, mergeConfig, mergeDedupeArrays, mergePayloadWithApiResponse } from './api.utils';

/**
 * Automatically create an api store to manage interaction between a local store and a remote api
 * @example
 * // How to rename props with object destructuring
 * const { get, data: usersData, state: usersState } = users;
 */
export function apiStoreCreator<t, contextType>(config: NtsState.ConfigApi<t> | NtsState.ConfigEntity<t>, isEntityStore: boolean) {
  // Initialize Axios with base url
  const api = axios.create({ baseURL: config.apiUrlBase });

  // Get interceptor
  api.interceptors.request.use(config => {
    const { getItem } = useStorage();
    const token = getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  function getStateSrc(): NtsState.ApiState<t> {
    return {
      loading: false,
      modifying: false,
      error: false,
      errorModify: false,
      data: null,
    };
  }

  function getStateEntitySrc(): NtsState.EntityApiState<t> {
    return {
      loading: false,
      modifying: false,
      error: false,
      errorModify: false,
      data: null,
      entities: {},
    };
  }

  let loading = false;

  // TODO: Fix any
  // NtsState.Context<t> | NtsState.ContextEntities<t>
  const contextSrc: any = isEntityStore ? contextEntities<t>() : contextDefault<t>();

  const Context = createContext<contextType>(contextSrc);

  /** Global UI State Context */
  const useApiContext = () => useContext(Context);

  /** Global UI State Provider */
  const Provider = ({ children }: { children?: ReactNode | null }) => {
    const [state, setState] = useState(isEntityStore ? getStateEntitySrc() : getStateSrc());

    /**
     *
     * @param optionsOverride
     * @param postPayload - Some API requests need to use POST instead of GET to return data. Providing a payload will use POST to load the store
     * @returns
     */
    const _get = useCallback(
      (optionsOverride?: NtsState.Options, postPayload?: unknown) => {
        const options = mergeConfig(config, optionsOverride);
        if ((state.data === null || options.refresh) && !state.loading) {
          const url = apiUrlGet(options, 'get', null);

          setState(stateSrc => ({ ...stateSrc, loading: true, error: null }));

          const httpRequest = postPayload ? api.post<unknown>(url, postPayload) : api.get(url);

          httpRequest
            .then(r => {
              const result = config.map && config.map.get ? config.map.get(r.data) : r.data;
              const state: Partial<NtsState.ApiState> = { loading: false, data: result, errorModify: null };
              let entities: Record<string, t> | null = null;

              if (isEntityStore && is.entityConfig(config) && config.uniqueId && Array.isArray(result)) {
                entities = result.reduce(
                  (a, b) => ({
                    ...a,
                    [b[String(config.uniqueId)]]: b,
                  }),
                  {},
                );
                state.entities = entities;
              }
              setState(stateSrc => ({ ...stateSrc, ...state }));
            })
            .catch((error: unknown) => {
              setState(stateSrc => ({ ...stateSrc, loading: false, error }));
            });
          // We do not want users returning data directly from the request which violates unidirection data flow
          // Return empty promise instead so that the app still knows when it completed
          return new Promise<void>((resolve, reject) => {
            httpRequest.then(() => resolve()).catch(error => reject(error));
          });
        }
        return Promise.resolve();
      },
      [state],
    );

    /**
     * Perform a get request to load data into the store
     * @param optionsSrct
     */
    const get = useCallback(
      (optionsOverride?: NtsState.Options) => {
        return _get(optionsOverride);
      },
      [_get],
    );

    /**
     * Perform a get request to load data into the store
     * @param optionsSrct

    function get(optionsOverride?: NtsState.Options) {
      return _get(optionsOverride);
    }
      */

    /**
     * Request is a POST operation that functions a GET. A payload body is passed and the response is loaded into the store
     *
     * Useful for things like search requests that need parameters not in a query string
     * @param payload
     * @param optionsOverride
     */
    const request = useCallback(
      <p = unknown,>(payload: p, optionsOverride?: NtsState.Options) => {
        return _get({ refresh: true, ...optionsOverride }, payload);
      },
      [_get],
    );

    /**
     * Consolidates all POST/PUT/PATCH requests into a single UPSERT function
     * @param apiRequest
     * @param data
     * @param mapFn
     * @returns
     */
    const upsert = useCallback(
      (apiRequest: Promise<AxiosResponse<t, unknown>>, data: Partial<t>, mapFn?: <t>(x: t | null) => unknown) => {
        setState(stateSrc => ({ ...stateSrc, modifying: true, errorModify: null }));
        return apiRequest
          .then(r => {
            // If a map function was provided, modify the data before executing anything else
            const resMapped = mapFn ? mapFn(r.data) : r.data;
            // Merge the api response with the payload
            const resMerged = mergePayloadWithApiResponse(data, resMapped) as t;
            // If this is an entity store
            if (isEntityStore && is.entityConfig(config) && !!state?.data && Array.isArray(state.data)) {
              const delta = mergeDedupeArrays(state.data, resMerged, config.uniqueId as keyof t);
              setState(stateSrc => ({ ...stateSrc, modifying: false, ...delta }));
            } else {
              setState(stateSrc => ({ ...stateSrc, modifying: false, resMerged }));
            }
          })
          .catch(error => {
            setState(stateSrc => ({ ...stateSrc, modifying: false, error }));
          });
      },
      [state],
    );

    /**
     * Perform a POST request
     * @param data
     * @param optionsOverride
     * @returns
     */
    const post = useCallback(
      (data: Partial<t>, optionsOverride?: NtsState.Options) => {
        const options = mergeConfig(config, optionsOverride);
        const url = apiUrlGet(options, 'post', null);
        return upsert(api.post(url, data), data, config.map?.post);
      },
      [upsert],
    );

    /**
     * Perform a PUT request
     * @param data
     * @param optionsOverride
     * @returns
     */
    const put = useCallback(
      (data: Partial<t>, optionsOverride?: NtsState.Options) => {
        const options = mergeConfig(config, optionsOverride);
        const url = apiUrlGet(options, 'put', data);
        return upsert(api.put(url, data), data, config.map?.put);
      },
      [upsert],
    );

    /**
     * Perform a PATCH request
     * @param data
     * @param optionsOverride
     * @returns
     */
    const patch = useCallback(
      (data: Partial<t>, optionsOverride?: NtsState.Options) => {
        const options = mergeConfig(config, optionsOverride);
        const url = apiUrlGet(options, 'patch', data);
        return upsert(api.patch(url, data), data, config.map?.patch);
      },
      [upsert],
    );

    /**
     * Perform a DELETE request
     * @param data
     * @param optionsOverride
     * @returns
     */
    const remove = useCallback(
      (data: Partial<t>, optionsOverride?: NtsState.Options) => {
        const options = mergeConfig(config, optionsOverride);
        const url = apiUrlGet(options, 'delete', data);
        setState(stateSrc => ({ ...stateSrc, modifying: true, errorModify: null }));
        return api
          .delete<t>(url)
          .then(r => {
            // Check if this is an entity store
            if (isEntityStore && is.entityConfig(config) && !!state?.data && Array.isArray(state.data)) {
              // Delete entities from store
              const updated = deleteEntities<t>(state.data, data, config.uniqueId as keyof t);
              setState(stateSrc => ({ ...stateSrc, modifying: false, ...updated }));
            } else {
              // Delete on a non entity format
              setState(stateSrc => ({ ...stateSrc, modifying: false, data: r.data || null }));
            }
          })
          .catch(error => setState(stateSrc => ({ ...stateSrc, modifying: false, error })));
      },
      [state],
    );

    /**
     * Refresh the data in the store
     */
    const refresh = useCallback(
      (optionsOverride?: NtsState.Options) => {
        return get({ ...optionsOverride, refresh: true });
      },
      [get],
    );

    /**
     * Reset store to its initial state
     */
    const reset = useCallback(() => {
      setState(isEntityStore ? getStateEntitySrc : getStateSrc);
    }, []);

    /** On load */
    useEffect(() => {
      if (!config.autoLoad && state.data === null && !state.loading && !loading) {
        loading = true;
        get();
      }
      return () => {
        setTimeout(() => {
          loading = false;
        }, 1);
      };
    }, [state, get]);

    // TODO: Figure out how to type this so that the provider does not throw an error
    const value: any = {
      state,
      data: state.data,
      get,
      post,
      patch,
      put,
      request,
      refresh,
      reset,
      remove,
    };

    return <Context.Provider value={value}>{children}</Context.Provider>;
  };

  return {
    useContext: useApiContext,
    Provider,
  };
}
