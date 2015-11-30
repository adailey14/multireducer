import mapValues from './mapValues';
import key from './key';

export default function multireducer(reducers) {
  const initialState = mapValues(reducers, reducer => reducer());
  return (state = initialState, action) => {
    if (action && action.type && action.type.includes(key)) {
      const keyStart = action.type.indexOf(key);
      const keyOnward = action.type.substring(keyStart);
      const reducerKey = keyOnward.substring(key.length);
      const actionWithoutKey = {
        ...action,
        type: action.type.substring(0, keyStart)
      };
      const reducer = reducers[reducerKey];
      if (reducer) {
        return {
          ...state,
          [reducerKey]: reducer(state[reducerKey], actionWithoutKey)
        };
      }
    }
    return state;
  };
}
