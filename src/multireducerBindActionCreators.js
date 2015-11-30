import key from './key';
import mapValues from './mapValues';
import {bindActionCreators} from 'redux';

export function multireducerWrapAction(action, multireducerKey) {
  return {
    ...action,
    type: action.type + key + multireducerKey
  };
}

export function multireducerWrapActionCreator(actionCreator, multireducerKey) {
  return (...args) => {
    let result = actionCreator(...args);
    if (result && result.type) {
      result = multireducerWrapAction(result, multireducerKey);
    }
    return result;
  };
}

export function multireducerWrapActionCreators(actionCreators, multireducerKey) {
  return mapValues(actionCreators, value => multireducerWrapActionCreator(value, multireducerKey));
}

export default function multireducerBindActionCreators(actionCreators, multireducerKey, dispatch) {
  const wrappedActionCreators = multireducerWrapActionCreators(actionCreators, multireducerKey);
  return bindActionCreators(wrappedActionCreators, dispatch);
}
