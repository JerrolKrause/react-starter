import axios, { AxiosResponse } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useStorage } from '../../hooks';
import { NtsState } from './api.models';
import { apiUrlGet, deleteEntities, is, mergeConfig, mergeDedupeArrays, mergePayloadWithApiResponse, deepMergeObjects } from './api.utils';

/**
 * Automatically create an api store to manage interaction between a local store and a remote api
 * @example
 * // How to rename props with object destructuring
 * const { get, data: usersData, state: usersState } = users;
 */
function useApiStoreCreatorSrc<t, isEntity extends boolean>(
  config: NtsState.ConfigApi<t> | NtsState.ConfigEntity<t>,
  isEntityStore: boolean,
): NtsState.ApiStore<t, isEntity> {
  // Initialize Axios with base url
  const api = axios.create({ baseURL: config.apiUrlBase });
  const { getItem } = useStorage();

  // Get interceptor
  api.interceptors.request.use(config => {
    const token = getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Determine initial state dynamically
  const initialState = isEntityStore
    ? ({
        loading: false,
        modifying: false,
        error: false,
        errorModify: false,
        data: null,
        entities: {},
      } as NtsState.EntityApiState<t[]>)
    : ({
        loading: false,
        modifying: false,
        error: false,
        errorModify: false,
        data: null,
      } as NtsState.ApiState<t>);

  const [state, setState] = useState({ ...initialState });

  let loading = false;

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
  function request<p = unknown>(payload: p, optionsOverride?: NtsState.Options) {
    return _get({ refresh: true, ...optionsOverride }, payload);
  }

  /**
   * Consolidates all POST/PUT/PATCH requests into a single UPSERT function
   * @param apiRequest
   * @param data
   * @param mapFn
   * @returns
   */
  function upsert(apiRequest: Promise<AxiosResponse<t, unknown>>, data: Partial<t>, mapFn?: <t>(x: t | null) => unknown) {
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
  }

  /**
   * Perform a POST request
   * @param data
   * @param optionsOverride
   * @returns
   */
  function post(data: Partial<t>, optionsOverride?: NtsState.Options) {
    const options = mergeConfig(config, optionsOverride);
    const url = apiUrlGet(options, 'post', null);
    return upsert(api.post(url, data), data, config.map?.post);
  }

  /**
   * Perform a PUT request
   * @param data
   * @param optionsOverride
   * @returns
   */
  function put(data: Partial<t>, optionsOverride?: NtsState.Options) {
    const options = mergeConfig(config, optionsOverride);
    const url = apiUrlGet(options, 'put', data);
    return upsert(api.put(url, data), data, config.map?.put);
  }

  /**
   * Perform a PATCH request
   * @param data
   * @param optionsOverride
   * @returns
   */
  function patch(data: Partial<t>, optionsOverride?: NtsState.Options) {
    const options = mergeConfig(config, optionsOverride);
    const url = apiUrlGet(options, 'patch', data);
    return upsert(api.patch(url, data), data, config.map?.patch);
  }

  /**
   * Perform a DELETE request
   * @param data
   * @param optionsOverride
   * @returns
   */
  function remove(data: Partial<t>, optionsOverride?: NtsState.Options) {
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
  }

  /**
   * Refresh the data in the store
   */
  function refresh(optionsOverride?: NtsState.Options) {
    return get({ ...optionsOverride, refresh: true });
  }

  /**
   * Reset store to its initial state
   */
  function reset() {
    setState({ ...initialState });
  }

  /** On load */
  useEffect(() => {
    if (!config.autoLoad && state.data === null && !state.loading && !loading) {
      loading = true;
      get();
    }
    return () => {
      setTimeout(() => (loading = false), 1);
    };
  }, [state, get]);

  return {
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
  } as NtsState.ApiStore<t, isEntity>;
}

/**
 * Create a standalone non-entity based api store. Use the creator methods for shared config.
 * @param config Configuration for this store
 * @returns
 */
export const useCreateApiStore = <t,>(config: NtsState.ConfigApi<t>) => {
  return useApiStoreCreatorSrc<t, false>(config, false); // ✅ Now this is inside a hook
};

/**
 * Create a standalone entity based api store. Use the creator methods for shared config.
 * @param config Configuration for this store
 * @returns
 */
export const useCreateEntityStore = <t,>(config: NtsState.ConfigEntity<t>) => {
  return useApiStoreCreatorSrc<t, true>(config, true); // ✅ Now this is inside a hook
};

/**
 * Create a curried instance of a non-entity api store creator. This method allows the usage of shared config between stores. Individual stores can override base settings
 * @param configBase Default configuration for all store instances used by this creator. Will be overwritten by individual store properties
 * @example
 * const store = apiStoreCreator({ apiUrlBase: '//jsonplaceholder.typicode.com' });
 * // A non-entity store
 * const post = store<Models.Post>({ apiUrl: '/posts/1' });
 * @returns
 */
export const useApiStoreCreator =
  (configBase: NtsState.ConfigApi) =>
  <t,>(config: NtsState.ConfigApi<t>) => {
    // Merge base config with specific store config
    const c = deepMergeObjects(configBase, config);
    return useCreateApiStore<t>(c);
  };

/**
 * Create a curried instance of a non-entity api store creator. This method allows the usage of shared config between stores. Individual stores can override base settings
 * @param configBase Default configuration for all store instances used by this creator. Will be overwritten by individual store properties
 * @example
 * const store = apiStoreCreator({ apiUrlBase: '//jsonplaceholder.typicode.com' });
 * // A non-entity store
 * const post = store<Models.Post>({ apiUrl: '/posts/1' });
 * @returns
 */
export const useEntityStoreCreator =
  (configBase: NtsState.ConfigEntity) =>
  <t,>(config: NtsState.ConfigEntity<t>) => {
    // Merge base config with specific store config
    const c = deepMergeObjects(configBase, config);
    return useCreateEntityStore<t>(c);
  };
