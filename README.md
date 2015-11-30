#multireducer

[![NPM Version](https://img.shields.io/npm/v/multireducer.svg?style=flat-square)](https://www.npmjs.com/package/multireducer)
[![NPM Downloads](https://img.shields.io/npm/dm/multireducer.svg?style=flat-square)](https://www.npmjs.com/package/multireducer)
[![Build Status](https://img.shields.io/travis/erikras/multireducer/master.svg?style=flat-square)](https://travis-ci.org/erikras/multireducer)

`multireducer` is a utility to wrap many copies of a single Redux reducer into a single key-based reducer.

## Installation

```
npm install --save multireducer
```

## Changes in this adailey version

I created this version of multireducer to solve a few issues with the original, and to provide semantics closer to connect() and bindActionCreators() provided by react-redux and react respectively. The three issues this solves are:

1. You can mount multireducer anywhere in your state tree, and use it more than once.
2. You can use this with react-thunk middleware (But see below for special care that must be taken in your Action Creators)
3. You don't have to wrap connectMultireducer components to pass in a multireducerKey, you can do it explicitly in the connectMultireducer call.


## Why?

There are times when writing a Redux application where you might find yourself needing multiple copies of the same reducer. For example, you might need more than one list of the same type of object to be displayed. Rather than make a big reducer to handle list `A`, `B`, and `C`, and have action creators either in the form `addToB(item)` or `addToList('B', item)`, it would be easier to write one "list" reducer, which is easier to write, reason about, and test, with a simpler `add(item)` API.

However, Redux won't let you do this:

```javascript
import list from './reducers/list';

const reducer = combineReducers({
  a: list,		// WRONG
  b: list,		// WRONG
  c: list		// WRONG
});
```

Each of those reducers is going to respond the same to every action.

This is where `multireducer` comes in. Multireducer lets you mount the same reducer any number of times in your Redux state tree, as long as you pass the key that you mounted it on to your connected component.

## How It Works

**STEP 1:** First you will need to wrap the reducer you want to copy.

```javascript
import multireducer from 'multireducer';
import list from './reducers/list';

const reducer = combineReducers({
  myLists: multireducer({ // may be mounted anywhere
    proposed  : list,
    scheduled : list,
    active    : list,
    complete  : list
  })
});
```

**STEP 2:** Now use `connectMultireducer()` instead of `react-redux`'s `connect()` to connect your component to the Redux store.

```javascript
import React, {Component, PropTypes} from 'react';
import {connectMultireducer, multireducerBindActionCreators} from 'multireducer';
import {add, remove} from './actions/list';

class ListComponent extends Component {
  static propTypes = {
    list: PropTypes.array.isRequired
  }

  render() {
    const {add, list, remove} = this.props;
    return (
      <div>
        <button onClick={() => add('New Item')}>Add</button>
        <ul>
          {list.map((item, index) =>
            <li key={index}>
              {item}
              (<button onClick={() => remove(item)}>X</button>)
            </li>)}
        </ul>
      </div>
    );
  }
}

// connectMultireducer has the same semantics as redux connect, except each function receives the multiReducer key as a second argument if it is passed in to the component as a prop
ListComponent = connectMultireducer(
  (state, key) => ({ list: state.lists[key] }),
  (dispatch, key) => multireducerBindActionCreators({add, remove}, key, dispatch)
)(ListComponent);

export default ListComponent;
```

**STEP 3:** Pass the appropriate `multireducerKey` prop to your decorated component.

```javascript
render() {
  return (
    <div>
      <h1>Lists</h1>
      <ListComponent multireducerKey="proposed"/>
      <ListComponent multireducerKey="scheduled"/>
      <ListComponent multireducerKey="active"/>
      <ListComponent multireducerKey="complete"/>
    </div>
  );
}
```

**STEP 3 Alternative:** Pass the appropriate `multireducerKey` in connectMultireducer explicitly, instead of passing it as a prop.

```javascript
ListComponent = connectMultireducer(
  (state) => ({ list: state.lists['proposed'] }),
  (dispatch) => multireducerBindActionCreators({add, remove}, 'proposed', dispatch)
)(ListComponent);
```

## Use with 'thunk' middleware
A common redux pattern is to use middleware that allows you to return a function from an action creator. `multireducerBindActionCreators` will not catch these 'thunks', so you will have to take care to pass in the multireducerKey to the action creator, and then wrap the resulting action using `multireducerWrapAction`. Here is an example:

```javascript
import React, {Component, PropTypes} from 'react';
import {connectMultireducer, multireducerBindActionCreators, multireducerWrapAction} from 'multireducer';
import {add, remove} from './actions/list';

class ListComponent extends Component {
  static propTypes = {
    list: PropTypes.array.isRequired
  }

  render() {
    const {add, list, remove, multireducerKey} = this.props;
    return (
      <div>
        <button onClick={() => add('New Item', multireducerKey)}>Add</button>
        <ul>
          {list.map((item, index) =>
            <li key={index}>
              {item}
              (<button onClick={() => remove(item, multireducerKey)}>X</button>)
            </li>)}
        </ul>
      </div>
    );
  }
}

// connectMultireducer has the same semantics as redux connect, except each function receives the multiReducer key as a second argument if it is passed in to the component as a prop
ListComponent = connectMultireducer(
  (state, key) => ({ list: state.lists[key] }),
  (dispatch, key) => multireducerBindActionCreators({add, remove}, key, dispatch)
)(ListComponent);


// Your Action Creator for Add (in a separate file)
const ADD = 'yourapp/list/ADD';

function add(name, multireducerKey) {
  // return a thunk to accomplish side effects
  return (getState, dispatch) => {
    // maybe make some API call
    // ...

    // Then dispatch your action, wrapping it with the multireducerKey
    dispatch(multireducerWrapAction({
      type: ADD,
      name
    }, multireducerKey));
  };
}
```



## API

### `multireducer(reducers:Object) : Function`

Wraps many reducers into one, much like Redux's `combineReducers()` does, except that the reducer that `multireducer` creates will filter your actions by a `multireducerKey`, so that the right reducer gets the action. The key is appended to each action.type, so your actions must have a 'type' property.

### `connectMultireducer(mapStateToProps:Function?, mapDispatchToProps:Function?, ...rest) : Function`

Creates a higher order component decorator, much like [`react-redux`](https://github.com/rackt/react-redux)'s [`connect()`](https://github.com/rackt/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options), the only difference is connectMultireducer will pass the multireducerKey prop to the mapStateToProps and mapDispatchToProps functions as a second argument.

##### -`mapStateToProps : Function`

> Similar to the `mapStateToProps` passed to `react-redux`'s [`connect()`](https://github.com/rackt/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options). The `mapStateToProps` function will receive the multireducerKey prop as a second argument if it was passed in to the component. You can also ignore this second argument, and pass in a hard-coded key here. This function is provided the global state exactly the same way as `connect()`.

##### -`mapDispatchToProps : Function`

> Similar to the `mapDispatchToProps` passed to `react-redux`'s [`connect()`](https://github.com/rackt/react-redux/blob/master/docs/api.md#connectmapstatetoprops-mapdispatchtoprops-mergeprops-options). The `mapDispatchToProps` function will receive the multireducerKey prop as a second argument if it was passed in to the component. You can also ignore this second argument, and pass in a hard-coded key here. This function is provided the global state exactly the same way as `connect()`.

### `multireducerBindActionCreators(actionCreators:Object, multireducerKey:string, dispatch:Function) : Object`

Acts much like [`react`](https://github.com/rackt/react)'s [`bindActionCreators()`](http://rackt.org/redux/docs/api/bindActionCreators.html), the only difference is multireducerBindActionCreators takes the multireducerKey as an argument, and adds the multireducerKey to actions generated by the returned actionCreators.

### `multireducerWrapAction(action:Object, multireducerKey:string) : Object`

Used to add the multireducerKey directly to an action object. Necessary for working with `thunk` middleware.



### Props to your decorated component

#### -`multireducerKey : String` [required]

> The key to the reducer in the `reducers` object given to `multireducer()`. This will limit its state and actions to the corresponding reducer.


## Working Example (Using the original multireducer!)

The [react-redux-universal-hot-example](https://github.com/erikras/react-redux-universal-hot-example) project uses `multireducer`. See its [`reducer.js`](https://github.com/erikras/react-redux-universal-hot-example/blob/master/src/redux/modules/reducer.js), which combines the plain vanilla [`counter.js`](https://github.com/erikras/react-redux-universal-hot-example/blob/master/src/redux/modules/counter.js) [duck](https://github.com/erikras/ducks-modular-redux), to a multireducer. The [`CounterButton.js`](https://github.com/erikras/react-redux-universal-hot-example/blob/master/src/components/CounterButton/CounterButton.js) connects to the multireducer, and the [`Home.js`](https://github.com/erikras/react-redux-universal-hot-example/blob/master/src/containers/Home/Home.js) calls `<CounterButton/>` with a `multireducerKey` prop.
