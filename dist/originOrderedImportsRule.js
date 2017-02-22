"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ts = require("typescript");
var Lint = require("tslint");
var Rule = (function (_super) {
    __extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new OriginOrderedImportWalker(sourceFile, this.getOptions()));
    };
    return Rule;
}(Lint.Rules.AbstractRule));
Rule.FAILURE_STRING = "Import of node_modules must be higher than users import.";
Rule.metadata = {
    ruleName: 'origin-ordered-imports',
    description: 'Strict order of imports (node_modules imports higher than users\'s imports).',
    rationale: 'Helps maintain a readable style in your codebase.',
    optionsDescription: 'Not configurable.',
    options: null,
    optionExamples: ['true'],
    type: 'typescript',
    typescriptOnly: false,
};
exports.Rule = Rule;
var SourceType;
(function (SourceType) {
    SourceType[SourceType["USER"] = 0] = "USER";
    SourceType[SourceType["LIB"] = 1] = "LIB";
})(SourceType || (SourceType = {}));
var flowRules = (_a = {},
    _a[SourceType.LIB] = [SourceType.USER, SourceType.LIB],
    _a[SourceType.USER] = [SourceType.USER],
    _a);
var OriginOrderedImportWalker = (function (_super) {
    __extends(OriginOrderedImportWalker, _super);
    function OriginOrderedImportWalker() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.nextSourceTypeMayBe = flowRules[SourceType.LIB];
        return _this;
    }
    /**
     * For expressions like: import { A, B } from 'foo'
     */
    OriginOrderedImportWalker.prototype.visitImportDeclaration = function (node) {
        this.check(node, node.moduleSpecifier.getText());
        _super.prototype.visitImportDeclaration.call(this, node);
    };
    /**
     * For expressions like: import foo = require('foo')
     */
    OriginOrderedImportWalker.prototype.visitImportEqualsDeclaration = function (node) {
        var moduleName = '';
        if (node.moduleReference.kind === ts.SyntaxKind.ExternalModuleReference) {
            var moduleRef = node.moduleReference;
            if (moduleRef.expression.kind === ts.SyntaxKind.StringLiteral) {
                moduleName = moduleRef.expression.text;
            }
        }
        else if (node.moduleReference.kind === ts.SyntaxKind.QualifiedName) {
            moduleName = node.moduleReference.getText();
        }
        this.check(node, moduleName);
        _super.prototype.visitImportEqualsDeclaration.call(this, node);
    };
    OriginOrderedImportWalker.prototype.check = function (node, source) {
        var sourceType = this.getSourceType(this.removeQuotes(source));
        if (this.nextSourceTypeMayBe.indexOf(sourceType) === -1) {
            this.addFailureAtNode(node, Rule.FAILURE_STRING, null);
        }
        else {
            this.nextSourceTypeMayBe = flowRules[sourceType];
        }
    };
    OriginOrderedImportWalker.prototype.getSourceType = function (source) {
        return source.trim().charAt(0) === '.'
            ? SourceType.USER
            : SourceType.LIB;
    };
    OriginOrderedImportWalker.prototype.removeQuotes = function (value) {
        if (value && value.length > 1 && (value[0] === "'" || value[0] === "\"")) {
            value = value.substr(1, value.length - 2);
        }
        return value;
    };
    return OriginOrderedImportWalker;
}(Lint.RuleWalker));
var _a;
//# sourceMappingURL=/home/oleg/code/expirements/tslint-custom-rule/dist/originOrderedImportsRule.js.map