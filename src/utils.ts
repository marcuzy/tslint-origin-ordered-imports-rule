export function values(obj: object): Array<string> {
    const res = [];
    
    for(const key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        
        res.push(obj[key]);
    }
    
    return res;
}