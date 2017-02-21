import * as ts from "typescript";
import * as Lint from "tslint";

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = "import of node_modules must be both then user's import";

    public static metadata: Lint.IRuleMetadata = {
        ruleName: "type-ordered-imports",
        description: "Disallows `/// <reference path=>` imports (use ES6-style imports instead).",
        rationale: Lint.Utils.dedent`
            Using \`/// <reference path=>\` comments to load other files is outdated.
            Use ES6-style imports to reference other files.`,
        optionsDescription: "Not configurable.",
        options: null,
        optionExamples: ["true"],
        type: "typescript",
        typescriptOnly: false,
    };

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new TypeOrderedImportWalker(sourceFile, this.getOptions()));
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

// The walker takes care of all the work.
class TypeOrderedImportWalker extends Lint.RuleWalker {
    protected nextSourceTypeMayBe: Array<SourceType> = flowRules[SourceType.LIB];

    /**
     * For expressions like: import { A, B } from 'foo'
     */
    public visitImportDeclaration(node: ts.ImportDeclaration) {
        this.check(node, node.moduleSpecifier.getText());

        // call the base version of this visitor to actually parse this node
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

    /**
     * For expressions like: const foo = require('foo')
     */
    // public visitCallExpression(node: ts.CallExpression) {
    //     if (node.arguments != null && node.expression != null) {
    //         const callExpressionText = node.expression.getText(this.getSourceFile());
    //         if (callExpressionText === "require" && typeof node.arguments[0] === 'object') {
    //             const moduleName: string = node.arguments[0].getText();
    //             this.check(node, moduleName);
    //         }
    //     }
    //     super.visitCallExpression(node);
    // }

    // General deal
    protected check(node: ts.Node, source: string) {
        const sourceType: SourceType = this.getSourceType(
            this.removeQuotes(source)
        );

        if (this.nextSourceTypeMayBe.indexOf(sourceType) === -1) {
            this.addFailureAtNode(node, Rule.FAILURE_STRING, null);
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
        if (value && value.length > 1 && (value[0] === "'" || value[0] === "\"")) {
            value = value.substr(1, value.length - 2);
        }

        return value;
    }
}

