import axios from 'axios';
import { useCallback, useState } from 'react';

export interface ApiState<t> {
  data: t | null;
  loading: boolean;
  error: string | null;
}

/**
 * Make http request and store the result
 * @returns
 */
export const useHttp = <t = unknown,>(apiUrl: string) => {
  const stateInitial: ApiState<t> = {
    data: null,
    loading: false,
    error: null,
  };

  const [state, setState] = useState<ApiState<t>>(stateInitial);

  /**
   * Change state of http request. This allows partial updates via deltas
   */
  const stateChange = useCallback((stateNew: Partial<ApiState<t>>) => setState(stateOld => ({ ...stateOld, stateNew })), []);

  /**
   * Make a GET request
   * @apiUrlOverride - Override the default API URL
   */
  const get = useCallback(
    (apiUrlOverride?: string | null): Promise<t | null> => {
      stateChange({ loading: true });
      return axios.get<t>(apiUrlOverride ?? apiUrl).then(
        response => {
          stateChange({ loading: false, data: response.data });
          return response.data as t;
        },
        error => {
          stateChange({ loading: false, error: error.message });
          return error;
        },
      );
    },
    [apiUrl, stateChange],
  );

  return { state, get };
};
