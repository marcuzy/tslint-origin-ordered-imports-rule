import * as ts from 'typescript';
import * as Lint from 'tslint';

import ModulesOrder, { ModuleType } from './modulesOrder';
import Walker from './walker';
import { values } from './utils';

export enum BlankLinesOption {
    anyNumber = 'any-number-of-blank-lines',
    no = 'no-blank-lines',
    one = 'one-blank-line',
    atLeastOne = 'at-least-one-blank-line'
}

export class Rule extends Lint.Rules.AbstractRule {
    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'origin-ordered-imports',
        description: 'Strict order of imports (node_modules imports should be higher than custom imports).',
        rationale: 'Helps maintain a readable style in your codebase.',
        optionsDescription: Lint.Utils.dedent`
            You can require having a blank line between node_modules and custom imports.
            It's \`${BlankLinesOption.anyNumber}\` by default, you can use next options: ${values(BlankLinesOption).map(_ => `\`${_}\``).join(', ')}
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
            [ true, BlankLinesOption.one ],
            [ 
                true, 
                BlankLinesOption.one,
                [
                    ModuleType.Lib,
                    '^@.+',
                    ModuleType.User
                ]
            ] 
        ],
        type: 'typescript',
        typescriptOnly: false,
        hasFix: false
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new Walker(sourceFile, this.ruleName, { 
            blankLines: this.blankLines, 
            modulesOrder: this.modulesOrder
        }));
    }
    
    private get blankLines(): BlankLinesOption {
        if (this.ruleArguments[0] !== undefined) {
            return this.ruleArguments[0];
        }
        
        return BlankLinesOption.anyNumber;
    }

    private get modulesOrder(): ModulesOrder { // TODO: change type
        if (this.ruleArguments[1] !== undefined) {
            
        }

        const optionsItems = this.ruleArguments[1] !== undefined
            ? this.ruleArguments[1]
            : [
                ModuleType.Lib,
                ModuleType.User
            ];

        return new ModulesOrder(optionsItems);
    }
}

