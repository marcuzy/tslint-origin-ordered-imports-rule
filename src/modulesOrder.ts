import { enumHas } from './utils';

export default class ModulesOrder {
    private orderPosition: number = 0;
    private orderItems: Array<ModulesOrderItem>;

    constructor(optionsItems: Array<string>) {
        const hasLib = optionsItems.some(_ => _ === ModuleType.Lib);
        const hasUser = optionsItems.some(_ => _ === ModuleType.User);

        if (!hasLib) {
            optionsItems = [ModuleType.Lib, ...optionsItems];
        }

        if (!hasUser) {
            optionsItems = [ModuleType.User, ...optionsItems];
        }

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

    // TODO: fix
    getOrderItem(path: string): ModulesOrderItem {
        return this.orderItems.find(item => item.check(path));
    }

    // TODO: fix
    getPrevOrderItem(): ModulesOrderItem {
        return this.orderItems[this.orderPosition];
    }
}

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

    getTitle(): string {
        switch(this.type) {
            case ModuleType.Lib:
                return 'Core/node_modules';
            case ModuleType.User:
                return 'User module';
            case ModuleType.CustomRule:
                return `Module with custom rule: ${this.customRule.toString()}`;
        }
    }
}