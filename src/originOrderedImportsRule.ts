import * as ts from 'typescript';
import * as Lint from 'tslint';

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = `Import of node_modules must be higher than custom import.`;

    public static metadata: Lint.IRuleMetadata = {
        ruleName: 'origin-ordered-imports',
        description: 'Strict order of imports (node_modules imports higher than custom imports).',
        rationale: 'Helps maintain a readable style in your codebase.',
        optionsDescription: 'Not configurable.',
        options: null,
        optionExamples: ['true'],
        type: 'typescript',
        typescriptOnly: false,
        hasFix: false
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new OriginOrderedImportWalker(sourceFile, this.getOptions()));
    }
}

enum SourceType {
    USER,
    LIB
}

const flowRules = {
    [SourceType.LIB]: [SourceType.USER, SourceType.LIB],
    [SourceType.USER]: [SourceType.USER]
};

class OriginOrderedImportWalker extends Lint.RuleWalker {
    protected nextSourceTypeMayBe: Array<SourceType> = flowRules[SourceType.LIB];

    /**
     * For expressions like: import { A, B } from 'foo'
     */
    public visitImportDeclaration(node: ts.ImportDeclaration) {
        this.check(node, node.moduleSpecifier.getText());

        super.visitImportDeclaration(node);
    }

    /**
     * For expressions like: import foo = require('foo')
     */
    public visitImportEqualsDeclaration(node: ts.ImportEqualsDeclaration) {
        let moduleName: string = '';

        if (node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference) {
            const moduleRef: ts.ExternalModuleReference = <ts.ExternalModuleReference>node.moduleReference;
            if (moduleRef.expression.kind === ts.SyntaxKind.StringLiteral) {
                moduleName = (<ts.StringLiteral>moduleRef.expression).text;
            }
        } else if (node.moduleReference.kind === ts.SyntaxKind.QualifiedName) {
            moduleName = node.moduleReference.getText();
        }

        this.check(node, moduleName);

        super.visitImportEqualsDeclaration(node);
    }

    protected check(node: ts.Node, source: string) {
        const sourceType: SourceType = this.getSourceType(
            this.removeQuotes(source)
        );

        if (this.nextSourceTypeMayBe.indexOf(sourceType) === -1) {
            this.addFailureAtNode(node, Rule.FAILURE_STRING);
        } else {
            this.nextSourceTypeMayBe = flowRules[sourceType];
        }
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
