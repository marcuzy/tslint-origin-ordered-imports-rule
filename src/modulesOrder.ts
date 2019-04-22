import { enumHas } from './utils';

export default class ModulesOrder {
    private groupIndex: number = 0;
    private readonly importGroups: Array<ImportGroup>;

    constructor(optionsItems: Array<string>) {
        const hasLib = optionsItems.some(_ => _ === ModuleType.Lib);
        const hasUser = optionsItems.some(_ => _ === ModuleType.User);

        if (!hasLib) {
            optionsItems = [ ModuleType.Lib, ...optionsItems ];
        }

        if (!hasUser) {
            optionsItems = [ ...optionsItems, ModuleType.User ];
        }

        this.importGroups = optionsItems.map((_, i) => new ImportGroup(_, i));
    }

    check(path: string): boolean {
        let index = this.importGroups
            .slice(this.groupIndex)
            .findIndex(item => item.check(path));

        if (this.importGroups[this.groupIndex + index].type === ModuleType.User) {
            let anotherIndex = this.importGroups
                .slice(this.groupIndex + index + 1)
                .findIndex(item => item.check(path)); // look ahead to check if there are more specific cases

            if (anotherIndex >= 0) {
                index += anotherIndex + 1;
            }
        }

        if (index === -1) {
            return false;
        }

        this.groupIndex += index;

        return true;
    }

    findImportGroup(path: string): ImportGroup {
        return this.findImportGroupIndexWith(index => this.importGroups[index], path);
    }

    getCurrentImportGroup(): ImportGroup {
        return this.importGroups[this.groupIndex];
    }

    private findImportGroupIndexWith<T>(customizer: (index: number) => T , path: string): T {
        // built-in ModuleTypes can intersect with CustomRules so first we try to find something among CustomRules
        const customIndex = this.importGroups
            .findIndex(item => item.type === ModuleType.CustomRule && item.check(path));
        
        if (customIndex > -1) {
            return customizer(customIndex);
        }

        return customizer(
            this.importGroups
                .findIndex(item => item.check(path))
        );
    }
}

export enum ModuleType {
    Lib = 'lib',
    User = 'user',
    CustomRule = 'custom-rule'
}

export class ImportGroup {
    readonly type: ModuleType;
    private readonly customRule?: RegExp;

    constructor(optionsItem: string, readonly index: number) {
        if (enumHas(ModuleType, optionsItem)) {
            this.type = optionsItem as any;
        } else {
            this.type = ModuleType.CustomRule;
            this.customRule = new RegExp(optionsItem);
        }
    }

    check(path: string): boolean {
        if (this.type === ModuleType.CustomRule) {
            return this.customRule.test(path);
        }

        const isUserModule = path.startsWith('/') || path.startsWith('.');
            
        if (this.type === ModuleType.User && isUserModule) {
            return true;
        }

        if (this.type === ModuleType.Lib && !isUserModule) {
            return true;
        }

        return false;
    }

    getTitle(): string {
        switch(this.type) {
            case ModuleType.Lib:
                return 'Lib import';
            case ModuleType.User:
                return 'User import';
            case ModuleType.CustomRule:
                return `Custom import ${this.customRule.toString()}`;
        }
    }
}