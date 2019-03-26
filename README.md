[![Build Status](https://travis-ci.com/marcuzy/tslint-origin-ordered-imports-rule.svg?branch=master)](https://travis-ci.com/marcuzy/tslint-origin-ordered-imports-rule)

# TSLint Origin Ordered Imports Rule
> Custom rule for tslint

Strict order for imports ("Lib import" must be higher than "User import") + your own import groups defined by regexps.

🚀 This plugin needs minimum configuration to start:

```shell
npm i -D tslint-origin-ordered-imports-rule
```

*tslint.json*
```json
"rulesDirectory": [
    "node_modules/tslint-origin-ordered-imports-rule/dist"
],
"rules": {
    "origin-ordered-imports": [ true ]
}
```

*Wrong:*
```ts
import MyClass from './my-class';
import * as _ from 'lodash';
```
*Right:*
```ts
import * as _ from 'lodash';
import MyClass from './my-class';
```

Then you might set `one-blank-line` option to require a blank line between import groups.
In such a case, the previous code becomes wrong.

*Right:*
```ts
import * as _ from 'lodash';

import MyClass from './my-class';
```
Apart from `one-blank-line`, there are a few other options:
* `no-blank-lines`
* `at-least-one-blank-line`
* `any-number-of-blank-lines`

This plugin was created to be as simple as possible, with zero-configuration. It could still be used in that way, but if you need more configurable tool just define the array which describes your own order.

*tsconfig.json*
```json
"rules": {
    "origin-ordered-imports": [ 
        true, 
        "one-blank-line",
        [
            "lib",
            "^@custom/.+",
            "user"
        ] 
    ]
}
```
*Wrong:*
```ts
import * as _ from 'lodash';
import * as moment from 'moment';

import MyClass from './my-class';
import MyClass2 from './my-class2';

import Foo from '@custom/foo';
import Bar from '@custom/bar';
```
*Right:*
```ts
import * as _ from 'lodash';
import * as moment from 'moment';

import Foo from '@custom/foo';
import Bar from '@custom/bar';

import MyClass from './my-class';
import MyClass2 from './my-class2';
```

Actually, you can omit `lib` and `user` items as they will be added automatically to the beginning and the ending respectively.

## Testing

To test the rule just run:

```sh
npm run compile
npm run test
```

## Licensing

The code in this project is licensed under MIT license.
