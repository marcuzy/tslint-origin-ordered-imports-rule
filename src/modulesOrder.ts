import { enumHas } from './utils';

export enum ModuleType {
    Lib = 'lib',
    User = 'user',
    CustomRule = 'custom-rule'
}

export class ModulesOrderItem {
    readonly type: ModuleType;
    private readonly customRule?: RegExp;

    constructor(optionsItem: string) {
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
}

export class ModulesOrder {
    private orderPosition: number = 0;
    private orderItems: Array<ModulesOrderItem>;

    constructor(optionsItems: Array<string>) {
        this.orderItems = optionsItems.map(_ => new ModulesOrderItem(_));
    }

    check(path: string): boolean {
        const index = this.orderItems
            .slice(this.orderPosition)
            .findIndex(item => item.check(path));

        if (index === -1) {
            return false;
        }

        this.orderPosition += index;

        return true;
    }

    getOrderItemIndex(path: string): number {
        return this.orderItems.findIndex(item => item.check(path));
    }
}