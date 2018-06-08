import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as tsutils from 'tsutils';

function values(obj: object): Array<string> {
    const res = [];
    
    for(const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        
        res.push(obj[key]);
    }
    
    return res;
}

enum BlankLinesOption {
    anyNumber = 'any-number-of-blank-lines',
    no = 'no-blank-lines',
    one = 'one-blank-line',
    atLeastOne = 'at-least-one-blank-line'
}

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = `Import of node_modules must be higher than custom import.`;

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'origin-ordered-imports',
        description: 'Strict order of imports (node_modules imports should be higher than custom imports).',
        rationale: 'Helps maintain a readable style in your codebase.',
        optionsDescription: Lint.Utils.dedent`
            You can require having a blank line between node_modules and custom imports.
            It's \`${BlankLinesOption.anyNumber}\` by default, you can use next options: ${values(BlankLinesOption).map(_ => `\`${_}\``).join(', ')}
        `,
        options: {
            type: 'string',
            enum: values(BlankLinesOption)
        },
        optionExamples: [ [ true ], [ true, "one-blank-line" ] ],
        type: 'typescript',
        typescriptOnly: false,
        hasFix: false
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new OriginOrderedImportWalker(sourceFile, this.ruleName, { blankLines: this.blankLines  }));
    }
    
    private get blankLines(): BlankLinesOption {
        if (this.ruleArguments[0] !== undefined) {
            return this.ruleArguments[0];
        }
        
        return BlankLinesOption.anyNumber;
    }
}

type AnyImportDeclaration = ts.ImportDeclaration | ts.ImportEqualsDeclaration;

enum SourceType {
    USER,
    LIB
}

const flowRules = {
    [SourceType.LIB]: [SourceType.USER, SourceType.LIB],
    [SourceType.USER]: [SourceType.USER]
};

const anyImportSyntaxKind = new Set([ts.SyntaxKind.ImportDeclaration, ts.SyntaxKind.ImportEqualsDeclaration]);

class OriginOrderedImportWalker extends Lint.AbstractWalker<{ blankLines: BlankLinesOption }> {
    protected nextSourceTypeMayBe: Array<SourceType> = flowRules[SourceType.LIB];
    
    public walk(sourceFile: ts.SourceFile) {
        const cb = (node: ts.Node): void => {
            if (node.kind === ts.SyntaxKind.ImportDeclaration) {
                this.visitImportDeclaration(node as ts.ImportDeclaration);
            }
    
            if (node.kind === ts.SyntaxKind.ImportEqualsDeclaration) {
                this.visitImportEqualsDeclaration(node as ts.ImportEqualsDeclaration);
            }
            
            return ts.forEachChild(node, cb);
        };
        return ts.forEachChild(sourceFile, cb);
    }

    /**
     * For expressions like: import { A, B } from 'foo'
     */
    public visitImportDeclaration(node: ts.ImportDeclaration) {
        this.check(node, this.getModuleName(node));
    }

    /**
     * For expressions like: import foo = require('foo')
     */
    public visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        this.check(node, this.getModuleName(node));
    }
    
    protected getModuleName(node: AnyImportDeclaration): string {
        if (node.kind === ts.SyntaxKind.ImportDeclaration) {
            return this.removeQuotes(node.moduleSpecifier.getText());
        }
        
        if ((<ts.ImportEqualsDeclaration>node).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference) {
            const moduleRef: ts.ExternalModuleReference = <ts.ExternalModuleReference>node.moduleReference;
            
            if (moduleRef.expression.kind === ts.SyntaxKind.StringLiteral) {
                return this.removeQuotes((<ts.StringLiteral>moduleRef.expression).text);
            }
        }
        
        return this.removeQuotes((<ts.ImportEqualsDeclaration>node).moduleReference.getText());
    }

    protected check(node: AnyImportDeclaration, source: string): void {
        const sourceType: SourceType = this.getSourceType(source);
    
        this.checkOrder(node, sourceType);
        
        if (this.options.blankLines !== BlankLinesOption.anyNumber) {
            this.checkEmptyLine(node, sourceType);
        }
    }
    
    protected checkOrder(node: AnyImportDeclaration, sourceType: SourceType): void {
        if (this.nextSourceTypeMayBe.indexOf(sourceType) === -1) {
            this.addFailureAtNode(node, Rule.FAILURE_STRING);
        } else {
            this.nextSourceTypeMayBe = flowRules[sourceType];
        }
    }
    
    protected checkEmptyLine(node: AnyImportDeclaration, sourceType: SourceType): void {
        if (sourceType === SourceType.USER) {
            return;
        }
    
        const nodeLine = ts
            .getLineAndCharacterOfPosition(
                this.getSourceFile(),
                node.getStart(this.getSourceFile())
            )
            .line;
        
        const nextNode = tsutils.getNextStatement(node);
    
        if (!nextNode || !anyImportSyntaxKind.has(nextNode.kind)) {
            return;
        }
    
        const nextSourceType = this.getSourceType(this.getModuleName(<AnyImportDeclaration>nextNode));
    
        if (nextSourceType === SourceType.LIB) {
            return;
        }
    
        const nextNodeLine = ts
            .getLineAndCharacterOfPosition(
                this.getSourceFile(),
                nextNode.getStart(this.getSourceFile())
            )
            .line;
    
        const totalLinesCountBetweenNodes = nextNodeLine - nodeLine - 1;
    
        const blankLinesCount = totalLinesCountBetweenNodes - this.getNodeLeadingCommentedLinesCount(<AnyImportDeclaration>nextNode);
        
        let failed = false;
        let whyFailed = '';
        
        switch (this.options.blankLines) {
            case BlankLinesOption.one:
                failed = blankLinesCount !== 1;
                whyFailed = 'One blank line required between node_modules import and custom import';
                
                break;
            case BlankLinesOption.no:
                failed = blankLinesCount !== 0;
                whyFailed = 'Blank lines between node_modules import and custom import';
                
                break;
            case BlankLinesOption.atLeastOne:
                failed = blankLinesCount === 0;
                whyFailed = 'At least one blank line required between node_modules import and custom import';
        }
    
        if (failed) {
            this.addFailureAtNode(node, whyFailed);
        }
    }
    
    protected getNodeLeadingCommentedLinesCount(node: AnyImportDeclaration): number {
        const comments = ts.getLeadingCommentRanges(this.getSourceFile().text, node.pos);
        
        if (!comments) return 0;
        
        return comments
            .reduce((count, comment) => {
                const startLine = ts.getLineAndCharacterOfPosition(this.getSourceFile(), comment.pos).line;
                const endLine = ts.getLineAndCharacterOfPosition(this.getSourceFile(), comment.end).line;
                
                return count + (endLine - startLine + 1);
            }, 0);
    }

    protected getSourceType(source: string): SourceType {
        return source.trim().charAt(0) === '.'
            ? SourceType.USER
            : SourceType.LIB;
    }

    protected removeQuotes(value: string): string {
        if (value && value.length > 1 && (value[0] === `'` || value[0] === `"`)) {
            value = value.substr(1, value.length - 2);
        }

        return value;
    }
}
