type ObjectType =
    // biome-ignore lint: intended
    | Record<any, unknown>
    // biome-ignore lint/complexity/noBannedTypes: This is a generic type for objects and it should work with data layers
    | Object;
export const isSameObject = (obj1: ObjectType, obj2: ObjectType) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
};
