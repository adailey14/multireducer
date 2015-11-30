import expect from 'expect';
import multireducerBindActionCreators, {multireducerWrapAction, multireducerWrapActionCreator, multireducerWrapActionCreators} from '../src/multireducerBindActionCreators';
import key from '../src/key';

const testBoundAction = (action, boundAction, multireducerKey) => {
  const result = action();
  const boundResult = boundAction();
  const type = multireducerWrapAction(result, multireducerKey).type;

  expect(boundResult)
    .toBeA('object')
    .toEqual({
      ...result,
      type
    });
};

describe('multireducerWrapActionCreator', () => {
  it('should wrap a single action function', () => {
    const multireducerKey = 'foo';
    const actionCreator = () => ({
      type: 'testaction',
      dog: 7,
      cat: 'Felix'
    });
    testBoundAction(actionCreator, multireducerWrapActionCreator(actionCreator, multireducerKey), multireducerKey);
  });
});

describe('multireducerWrapActionCreators', () => {
  it('should bind an object of action functions', () => {
    const multireducerKey = 'bar';
    const actions = {
      a: () => ({
        type: 'testaction',
        dog: 7,
        cat: 'Felix'
      }),
      b: () => ({
        type: 'testaction',
        age: 69,
        name: 'Bobby Tables'
      })
    };
    const result = multireducerWrapActionCreators(actions, multireducerKey);
    testBoundAction(actions.a, result.a, multireducerKey);
    testBoundAction(actions.b, result.b, multireducerKey);
  });
});
