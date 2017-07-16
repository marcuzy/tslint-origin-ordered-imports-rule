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
    "origin-ordered-imports": true
}
```

## Licensing

"The code in this project is licensed under MIT license."
