export namespace NtsState {
  export type ApiStore<t, isEntity extends boolean> = {
    /** The current state of the API store */
    state: isEntity extends true ? NtsState.EntityApiState<t[]> : NtsState.ApiState<t>;

    /** The actual data stored */
    data: isEntity extends true ? t[] | null : t | null;

    /** Fetches data from the API and stores it */
    get: (optionsOverride?: NtsState.Options) => Promise<void>;

    /** Sends a request payload to the API and stores the response */
    request: <p = unknown>(payload: p, optionsOverride?: NtsState.Options) => Promise<void>;

    /** Creates a new record via a POST request */
    post: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;

    /** Updates an existing record via a PUT request */
    put: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;

    /** Partially updates a record via a PATCH request */
    patch: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;

    /** Deletes a record via a DELETE request */
    remove: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;

    /** Refreshes the store by re-fetching data from the API */
    refresh: () => Promise<void>;

    /** Resets the store to its initial state */
    reset: () => void;
  };

  interface State<e> {
    [key: string]: any;
    loading: boolean;
    modifying: boolean;
    error: null | e;
    errorModify: null | e;
  }

  /** Contains both the api state and any data */
  export interface ApiState<t = any, e = any> extends State<e> {
    data: t | null;
  }

  export interface EntityApiState<t = any, e = any> extends State<e> {
    data: t | null;
    /** If api response type is an array of objects, create record here. Will be null otherwise */
    entities: Record<string | number, t>;
  }

  export type EitherState<t = any, e = any> = EntityApiState<t, e> | ApiState<t, e>;

  export type ApiUrlCallback = <t>(x: t) => string;

  /** Different methods to pass the api url string to the store */
  export type ApiUrl = string | ApiUrlCallback;

  export interface ApiUrlOverride {
    get?: ApiUrl;
    request?: ApiUrl;
    post?: ApiUrl;
    put?: ApiUrl;
    patch?: ApiUrl;
    delete?: ApiUrl;
  }

  export interface Options {
    /** Path to webapi. Assumes restful conventions for verbs */
    apiUrl?: string;
    /** Prepend this string to all api requests. Useful for defining the base domain url for api calls */
    apiUrlBase?: string;
    /** Append this string to api call. Useful for rest endpoints that require a unique ID */
    apiUrlAppend?: string;
    /** Override the default webapi url for a specific verb. Optionally supports a callback function that returns a string */
    apiUrlOverride?: ApiUrlOverride;
    /** Force the store to refresh the data from the remote url. Otherwise if the store has data subsequent get calls are ignored */
    refresh?: boolean;
    /** If true, will empty out the store of data prior to completing the operation */
    reset?: boolean;
    /** If true, replace the entire entity in the store on a POST/PUT/PATCH instead of performing a deep merge */
    replace?: boolean;
  }

  export interface Config extends Options {
    /** If the store has a subscriber but no data, automatically perform a get request. Default true */
    autoLoad?: boolean;
    /** TODO: If autoload is true and the last GET request returned an error, automatically make another request for subsequent subscriptions. Default true  */
    // reloadOnError?: boolean;
    /** Disable automatically appending the unique ID For PUT, PATCH & DELETE requests.
     * If true the url to the web api must added manually via the apiUrl property */
    disableAppendId?: {
      put?: true;
      patch?: true;
      delete?: true;
    };

    /** Define the initial state of the store */
    // initialState?: Record<string, any>;
    /** A unique name or id for this store. Only necessary if communication between stores is required */
    storeId?: string;
    /** Options for managing offline mode */
    // offlineMode?: {
    /** Store the last successful api response in local storage and in the event of an api error, return that instead */
    // saveLastSuccess?: boolean;
    /** Use this model instead */
    // model: any;
    // };
    /**
     * TODO Features
     */
    /** Remove items from the store cache based on a TTL. Default is false
            cache?: {
              ttl: number;
            };
             */
  }

  /** Config for entity stores */
  export interface ConfigEntity<t = any> extends Config {
    /** The uniqueID or guid or the entity format. Default is 'guid'. Setting this value will enable an entity store */
    uniqueId: keyof t;
    map?: {
      get?: (x: any) => t[];
      post?: (x: any) => any;
      put?: (x: any) => any;
      patch?: (x: any) => any;
    };
  }

  /** Config for api stores */
  export interface ConfigApi<t = any> extends Config {
    /** Map the webapi response before it is passed to the store on a per verb basis */
    map?: {
      get?: (x: any) => t;
      post?: (x: any) => any;
      put?: (x: any) => any;
      patch?: (x: any) => any;
    };
  }

  export interface UIStoreOptions {
    /** A unique ID for this store that if set, will save and reload it's contents from localstorage */
    localStorageId?: string;
  }

  /** Select model for UI store */
  export type Select<t> = keyof t;

  /** Select callback function for UI store */
  export type Callback<t> = <R>(store: t) => R;

  /** A callback function that works on an array of entities and returns a subset of that information */
  export type SelectEntities<t> = (entities: t[] | null) => t[] | null;

  /** Actions to perform against the store */
  export interface Action<t = unknown, y = unknown> {
    type: string;
    payload: t | null;
    meta?: y;
  }

  /** Actions specifically for the api store */
  export interface ApiAction<t = any> extends Action<t> {
    /** Target api store that needs to receive this action. Note that the target store must have an assigned store ID which is optional by default */
    storeId: string;
    /** Any store options, will override default store options */
    options?: Options;
  }

  /** Create actions with type safe payloads */
  export interface ActionCreator<t = any> {
    type: string;
    /**
     * Match an action against this action creator
     * @example
     * if (actionCreator.match(action)) {
     *    console.log(action.payload); // Properly typed
     * }
     */
    match: (action: NtsState.Action) => action is NtsState.Action<t, unknown>;
    (payload: t, meta?: unknown): Action<t>;
  }

  export type StoreType = 'api' | 'ui' | 'all';

  export interface Context<t> {
    get: (optionsOverride?: Options, postPayload?: unknown) => Promise<void>;
    request: (payload: unknown, optionsOverride?: Options) => Promise<void>;
    post: (data: Partial<t>, optionsOverride?: Options) => Promise<void>;
    put: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;
    patch: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;
    remove: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;
    refresh: () => Promise<void>;
    reset: () => void;
    state: EitherState<t>;
    data: t | null;
  }

  export interface ContextEntities<t> {
    get: (optionsOverride?: Options, postPayload?: unknown) => Promise<void>;
    request: (payload: unknown, optionsOverride?: Options) => Promise<void>;
    post: (data: Partial<t>, optionsOverride?: Options) => Promise<void>;
    put: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;
    patch: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;
    remove: (data: Partial<t>, optionsOverride?: NtsState.Options) => Promise<void>;
    refresh: () => Promise<void>;
    reset: () => void;
    entities: Record<string, t>;
    state: EitherState<t>;
    data: t[] | null;
  }

  /**
  export interface NtsApiStoreCreator<t> {
    new (config: NtsState.ConfigApi | NtsState.ConfigEntity, isEntityStore?: boolean): {
      get(optionsOverride?: NtsState.Options): Observable<any>;
      request<p = unknown>(payload: p, optionsOverride?: NtsState.Options): Observable<any>;
      post(data: Partial<t>, optionsOverride?: NtsState.Options): Observable<Partial<t>>;
      put(data: Partial<t>, optionsOverride?: NtsState.Options): Observable<Partial<t>>;
      patch(data: Partial<t>, optionsOverride?: NtsState.Options): Observable<Partial<t>>;
      delete(data: Partial<t>, optionsOverride?: NtsState.Options): Observable<any>;
      refresh(optionsOverride?: NtsState.Options): Observable<any>;
      reset(): void;
    };
  }
   */
}
