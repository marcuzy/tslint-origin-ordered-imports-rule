export function values(obj: object): Array<string> {
    const res = [];
    
    for(const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        
        res.push(obj[key]);
    }
    
    return res;
}

export function enumHas(enm: object, value: any): boolean {
    return values(enm).indexOf(value) > -1;
}