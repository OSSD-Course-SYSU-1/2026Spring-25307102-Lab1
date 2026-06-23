export enum ShapeType {
    TETRAHEDRON = 0,
    SPHERE = 1,
    CUBE = 2,
    CONE = 3
}
export interface ModelEntry {
    name: string;
    description: string;
    shapeType: ShapeType;
}
export const MODELS: ModelEntry[] = [
    {
        name: '四面体 (Tetrahedron)',
        description: '经典四面体，4个三角面',
        shapeType: ShapeType.TETRAHEDRON,
    },
    {
        name: '球体 (Sphere)',
        description: '光滑球体，经纬网格生成',
        shapeType: ShapeType.SPHERE,
    },
    {
        name: '正方体 (Cube)',
        description: '六面正方体，彩色面',
        shapeType: ShapeType.CUBE,
    },
    {
        name: '圆锥 (Cone)',
        description: '标准圆锥体',
        shapeType: ShapeType.CONE,
    }
];
