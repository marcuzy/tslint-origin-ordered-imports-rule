# TSLint Origin Ordered Imports Rule
> Custom rule for tslint

Strict order for imports (node_modules imports must be higher than custom imports).

*Right:*
```ts
import * as _ from 'lodash';

import MyClass from './my-class';
```

*Wrong:*
```ts
import MyClass from './my-class';

import * as _ from 'lodash';
```
Set `one-blank-line` option to require a blank line between node_modules and custom imports,
in such a case, the next code is wrong too:
```ts
import * as _ from 'lodash';
import MyClass from './my-class';
```
Apart from `one-blank-line`, there are a few other options:
* `no-blank-lines`
* `at-least-one-blank-line`
* `any-number-of-blank-lines`

I guess it's enough for most cases.

## Installing / Getting started

Install:
```shell
npm i -D tslint-origin-ordered-imports-rule
```

Edit your `tslint.json` file:
```json
"rulesDirectory": [
  "node_modules/tslint-origin-ordered-imports-rule/dist"
],
"rules": {
    "origin-ordered-imports": [ true, "one-blank-line" ]
}
```

## Testing

To test the rule just run:

```sh
npm run compile
npm run test
```

## Licensing

The code in this project is licensed under MIT license.
