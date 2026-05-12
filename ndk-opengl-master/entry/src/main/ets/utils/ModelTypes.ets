export enum ShapeType {
  TETRAHEDRON = 0,
  SPHERE = 1,
  CUBE = 2,
  CONE = 3,
  PARAMETRIC_ELLIPSOID = 4,
  PARAMETRIC_HYPERBOLOID = 5,
  PARAMETRIC_PARABOLOID = 6,
  PARAMETRIC_ELLIPTIC_CONE = 7,
}

export interface ShapeParams {
  paramA: number;
  paramB: number;
  paramC: number;
  resolutionU: number;
  resolutionV: number;
}

export interface ParamDescription {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface ModelEntry {
  name: string;
  description: string;
  shapeType: ShapeType;
  isCustom: boolean;
  defaultParams?: ShapeParams;
}

export const PREDEFINED_MODELS: ModelEntry[] = [
  {
    name: '四面体 (Tetrahedron)',
    description: '经典四面体，4个三角面',
    shapeType: ShapeType.TETRAHEDRON,
    isCustom: false
  },
  {
    name: '球体 (Sphere)',
    description: '光滑球体，经纬网格生成',
    shapeType: ShapeType.SPHERE,
    isCustom: false,
    defaultParams: { paramA: 1.5, paramB: 1.5, paramC: 1.5, resolutionU: 32, resolutionV: 32 }
  },
  {
    name: '正方体 (Cube)',
    description: '六面正方体，彩色面',
    shapeType: ShapeType.CUBE,
    isCustom: false,
    defaultParams: { paramA: 1.5, paramB: 1.5, paramC: 1.5, resolutionU: 0, resolutionV: 0 }
  },
  {
    name: '圆锥 (Cone)',
    description: '标准圆锥体',
    shapeType: ShapeType.CONE,
    isCustom: false,
    defaultParams: { paramA: 1.5, paramB: 1.5, paramC: 1.5, resolutionU: 32, resolutionV: 0 }
  }
];

export const CUSTOM_FUNCTIONS: ModelEntry[] = [
  {
    name: '椭球面 (Ellipsoid)',
    description: 'x²/a² + y²/b² + z²/c² = 1',
    shapeType: ShapeType.PARAMETRIC_ELLIPSOID,
    isCustom: true,
    defaultParams: { paramA: 1.5, paramB: 1.2, paramC: 1.0, resolutionU: 32, resolutionV: 32 }
  },
  {
    name: '单叶双曲面 (Hyperboloid)',
    description: 'x²/a² + y²/b² − z²/c² = 1',
    shapeType: ShapeType.PARAMETRIC_HYPERBOLOID,
    isCustom: true,
    defaultParams: { paramA: 1.0, paramB: 1.0, paramC: 0.8, resolutionU: 32, resolutionV: 32 }
  },
  {
    name: '椭圆抛物面 (Paraboloid)',
    description: 'z = x²/a² + y²/b²',
    shapeType: ShapeType.PARAMETRIC_PARABOLOID,
    isCustom: true,
    defaultParams: { paramA: 0.8, paramB: 0.8, paramC: 0.6, resolutionU: 32, resolutionV: 32 }
  },
  {
    name: '椭圆锥面 (Elliptic Cone)',
    description: 'x²/a² + y²/b² = z²/c²',
    shapeType: ShapeType.PARAMETRIC_ELLIPTIC_CONE,
    isCustom: true,
    defaultParams: { paramA: 0.7, paramB: 0.7, paramC: 0.7, resolutionU: 32, resolutionV: 32 }
  }
];

export function getDefaultParams(): ShapeParams {
  return { paramA: 1.5, paramB: 1.5, paramC: 1.5, resolutionU: 32, resolutionV: 32 };
}

export function getParamDescriptions(shapeType: ShapeType): ParamDescription[] {
  switch (shapeType) {
    case ShapeType.PARAMETRIC_ELLIPSOID:
      return [
        { key: 'paramA', label: '半长轴 a (x方向)', min: 0.3, max: 3.0, step: 0.1, defaultValue: 1.5 },
        { key: 'paramB', label: '半长轴 b (y方向)', min: 0.3, max: 3.0, step: 0.1, defaultValue: 1.2 },
        { key: 'paramC', label: '半长轴 c (z方向)', min: 0.3, max: 3.0, step: 0.1, defaultValue: 1.0 },
        { key: 'resolutionU', label: '经度分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
        { key: 'resolutionV', label: '纬度分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
      ];
    case ShapeType.PARAMETRIC_HYPERBOLOID:
      return [
        { key: 'paramA', label: '参数 a', min: 0.3, max: 2.5, step: 0.1, defaultValue: 1.0 },
        { key: 'paramB', label: '参数 b', min: 0.3, max: 2.5, step: 0.1, defaultValue: 1.0 },
        { key: 'paramC', label: '参数 c', min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8 },
        { key: 'resolutionU', label: '环向分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
        { key: 'resolutionV', label: '纵向分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
      ];
    case ShapeType.PARAMETRIC_PARABOLOID:
      return [
        { key: 'paramA', label: '参数 a', min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8 },
        { key: 'paramB', label: '参数 b', min: 0.3, max: 2.0, step: 0.1, defaultValue: 0.8 },
        { key: 'paramC', label: 'z轴缩放', min: 0.2, max: 1.5, step: 0.1, defaultValue: 0.6 },
        { key: 'resolutionU', label: '环向分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
        { key: 'resolutionV', label: '径向分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
      ];
    case ShapeType.PARAMETRIC_ELLIPTIC_CONE:
      return [
        { key: 'paramA', label: '参数 a', min: 0.2, max: 2.0, step: 0.1, defaultValue: 0.7 },
        { key: 'paramB', label: '参数 b', min: 0.2, max: 2.0, step: 0.1, defaultValue: 0.7 },
        { key: 'paramC', label: '参数 c', min: 0.2, max: 2.0, step: 0.1, defaultValue: 0.7 },
        { key: 'resolutionU', label: '环向分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
        { key: 'resolutionV', label: '纵向分辨率', min: 8, max: 64, step: 4, defaultValue: 32 },
      ];
    default:
      return [];
  }
}
