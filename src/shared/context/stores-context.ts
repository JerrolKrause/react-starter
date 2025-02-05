import { useCreateEntityStore, useApiStoreCreator } from './api';

const apiConfigGlobal = { apiUrlBase: 'https://jsonplaceholder.typicode.com' };

/**
 * An instance of the entity store creator with this apps API configuration already set
 */
export const appEntityStoreCreator = useCreateEntityStore({ ...apiConfigGlobal, uniqueId: 'id' });

/**
 * An instance of a non-entity store creator with this apps API configuration already set
 */
export const appApiStoreCreator = useApiStoreCreator({ ...apiConfigGlobal });
