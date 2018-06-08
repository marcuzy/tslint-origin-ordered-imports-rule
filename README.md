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
Also, you can require having a blank line between node_modules and custom imports
in such a case the next code is wrong too (take a look at `example/tslint.json`):
```ts
import * as _ from 'lodash';
import MyClass from './my-class';
```

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

## Licensing

"The code in this project is licensed under MIT license."
