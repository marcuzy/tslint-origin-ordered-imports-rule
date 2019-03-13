import * as ts from 'typescript';
import * as Lint from 'tslint';

import ModulesOrder, { ModuleType } from './modulesOrder';
import Walker from './walker';
import { values } from './utils';

export enum BlankLinesOption {
    AnyNumber = 'any-number-of-blank-lines',
    No = 'no-blank-lines',
    One = 'one-blank-line',
    AtLeastOne = 'at-least-one-blank-line'
}

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'origin-ordered-imports',
        description: 'Strict order of imports (node_modules imports should be higher than custom imports).',
        rationale: 'Helps maintain a readable style in your codebase.',
        optionsDescription: Lint.Utils.dedent`
            You can require having a blank line between node_modules and custom imports.
            It's \`${BlankLinesOption.AnyNumber}\` by default, you can use next options: ${values(BlankLinesOption).map(_ => `\`${_}\``).join(', ')}
        `,
        options: [
            {
                type: 'string',
                enum: values(BlankLinesOption)
            },
            {
                type: 'array',
                items: {
                    type: 'string',
                    items: {
                        oneOf: [
                            {
                                type: 'string',
                                enum: values(ModuleType)
                            },
                            {
                                type: 'string' // regexp
                            }
                        ]
                    }
                }
            }
        ],
        optionExamples: [ 
            [ true ], 
            [ true, BlankLinesOption.One ],
            [ 
                true, 
                [
                    '^@.+',
                ]
            ],
            [ 
                true, 
                BlankLinesOption.One,
                [
                    ModuleType.Lib,
                    '^@.+',
                    ModuleType.User
                ]
            ],
        ],
        type: 'typescript',
        typescriptOnly: false,
        hasFix: false
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const [arg1, arg2] = this.ruleArguments;

        const blankLines: BlankLinesOption = (() => {
            if (typeof arg1 === 'string') {
               return arg1 as any;
            }

            return BlankLinesOption.AnyNumber
        })();

        const modulesOrder: ModulesOrder = (() => {
            if (Array.isArray(arg1)) {
                return new ModulesOrder(arg1);
            }

            if (Array.isArray(arg2)) {
                return new ModulesOrder(arg2);
            }

            return new ModulesOrder([
                ModuleType.Lib,
                ModuleType.User
            ]);
        })();

        const walker = new Walker(sourceFile, this.ruleName, { 
            blankLines, 
            modulesOrder
        });

        return this.applyWithWalker(walker);
    }
}

