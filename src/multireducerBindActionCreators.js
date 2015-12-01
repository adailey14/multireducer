import key from './key';
import {bindActionCreators} from 'redux';

export function multireducerWrapAction(action, multireducerKey) {
  return {
    ...action,
    type: (action.type || '') + key + multireducerKey
  };
}

export default function multireducerBindActionCreators(actionCreators, multireducerKey, dispatch) {
  const wrappingDispatch = (action) => {
    // hmm we could wrap all actions (which could be returning a function) in an object with the key
    if (typeof action === 'function') {
      const wrappedThunk = (ignoredDispatch, getState) => action(wrappingDispatch, getState);
      dispatch(wrappedThunk);
    } else if (typeof action === 'object') {
      dispatch(multireducerWrapAction(action, multireducerKey));
    }
  };

  return bindActionCreators(actionCreators, wrappingDispatch);
}
