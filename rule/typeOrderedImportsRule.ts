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
        return this.applyWithWalker(new TypeOrderedWalker(sourceFile, this.getOptions()));
    }
}

type SourceType = 'user' | 'lib';

const sourceTypePriors: {[sourceType: string]: number} = {
    lib: 0,
    user: 1
};

// The walker takes care of all the work.
class TypeOrderedWalker extends Lint.RuleWalker {
    protected prevSourceTypes: Array<SourceType> = [];

    public visitImportDeclaration(node: ts.ImportDeclaration) {
        this.check(node, node.moduleSpecifier.getText());

        // call the base version of this visitor to actually parse this node
        super.visitImportDeclaration(node);
    }

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

    public visitCallExpression(node: ts.CallExpression) {
        if (node.arguments != null && node.expression != null) {
            const callExpressionText = node.expression.getText(this.getSourceFile());
            if (callExpressionText === "require" && typeof node.arguments[0] === 'object') {
                const moduleName: string =  node.arguments[0].getText();
                this.check(node, moduleName);
            }
        }
        super.visitCallExpression(node);
    }

    protected check(node: ts.Node, source: string) {
        source = this.removeQuotes(source);

        const sourceType: SourceType = this.getSourceType(source);

        console.log({sourceType, source });

        if (this.prevSourceTypes.length === 0) {
            this.prevSourceTypes.unshift(sourceType);
            return;
        }

        let prior: number = sourceTypePriors[sourceType];

        for (const prevSourceType of this.prevSourceTypes) {
            const prevPrior: number = sourceTypePriors[prevSourceType];

            console.log({prevSourceType, prior, prevPrior});

            if (prevPrior > prior) {
                this.addFailure(this.createFailure(node.getStart(), node.getWidth(), Rule.FAILURE_STRING));
                break;
            } else {
                prior = prevPrior;
            }
        }

        this.prevSourceTypes.unshift(sourceType);
    }

    protected getSourceType(source: string): SourceType {
        return source.trim().charAt(0) === '.' ? 'user' : 'lib';
    }

    protected removeQuotes(value: string): string {
        // strip out quotes
        if (value && value.length > 1 && (value[0] === "'" || value[0] === "\"")) {
            value = value.substr(1, value.length - 2);
        }
        return value;
    }
}

