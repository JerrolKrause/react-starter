import { SET_GLOBAL_STATE } from '../types'
const INITIAL_STATE = {
  state: {
    ourValue: 'fred'
  }
}

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
  case SET_GLOBAL_STATE:
    return {
      ...state,
      ...action.payload
    }
  default:
    return INITIAL_STATE
  }
}
