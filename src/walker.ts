import * as ts from 'typescript';
import * as Lint from 'tslint';
import * as tsutils from 'tsutils';

import ModulesOrder from './modulesOrder';
import { BlankLinesOption } from './originOrderedImportsRule';

type AnyImportDeclaration = ts.ImportDeclaration | ts.ImportEqualsDeclaration;

const anyImportSyntaxKind = new Set([ts.SyntaxKind.ImportDeclaration, ts.SyntaxKind.ImportEqualsDeclaration]);

export default class Walker extends Lint.AbstractWalker<{ blankLines: BlankLinesOption, modulesOrder: ModulesOrder}> {
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
        this.checkOrder(node, source);
        
        if (this.options.blankLines !== BlankLinesOption.AnyNumber) {
            this.checkEmptyLine(node, source);
        }
    }
    
    protected checkOrder(node: AnyImportDeclaration, source: string): void {
        if (!this.options.modulesOrder.check(source)) {
            const current = this.options.modulesOrder.findImportGroup(source);
            const prev = this.options.modulesOrder.getCurrentImportGroup();

            this.addFailureAtNode(node, `Check imports order (Import of "${ current.getTitle() }" must be higher than import of "${ prev.getTitle() }")`);
        }
    }
    
    protected checkEmptyLine(node: AnyImportDeclaration, source: string): void {
        const orderItemIndex = this.options.modulesOrder.findOrderItemIndex(source);

        const nodeLine = ts
            .getLineAndCharacterOfPosition(
                this.getSourceFile(),
                node.getEnd()
            )
            .line;
        
        const nextNode = tsutils.getNextStatement(node);
    
        if (!nextNode || !anyImportSyntaxKind.has(nextNode.kind)) {
            return;
        }

        const nextSource = this.getModuleName(<AnyImportDeclaration>nextNode);
        const nextOrderItemIndex = this.options.modulesOrder.findOrderItemIndex(nextSource);

        if (nextOrderItemIndex <= orderItemIndex) {
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
            case BlankLinesOption.One:
                failed = blankLinesCount !== 1;
                whyFailed = 'One blank line required between node_modules import and custom import';
                
                break;
            case BlankLinesOption.No:
                failed = blankLinesCount !== 0;
                whyFailed = 'Blank lines between node_modules import and custom import';
                
                break;
            case BlankLinesOption.AtLeastOne:
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

    protected removeQuotes(value: string): string {
        if (value && value.length > 1 && (value[0] === `'` || value[0] === `"`)) {
            value = value.substr(1, value.length - 2);
        }

        return value;
    }
}
