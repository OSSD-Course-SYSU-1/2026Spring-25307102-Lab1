export class ModelState {
  shapeType: number = 0;
  scale: number = 1.0;
  angleX: number = 30;
  angleY: number = 45;
  wireframe: boolean = false;
}

export class ContinuationHelper {
  static pack(state: ModelState): Record<string, Object> {
    let result: Record<string, Object> = {};
    result['shapeType'] = state.shapeType;
    result['scale'] = state.scale;
    result['angleX'] = state.angleX;
    result['angleY'] = state.angleY;
    result['wireframe'] = state.wireframe;
    return result;
  }

  static unpack(params: Record<string, Object>): ModelState | null {
    if (params['shapeType'] === undefined) {
      return null;
    }
    let state = new ModelState();
    state.shapeType = params['shapeType'] as number;
    state.scale = (params['scale'] as number) || 1.0;
    state.angleX = (params['angleX'] as number) || 30;
    state.angleY = (params['angleY'] as number) || 45;
    state.wireframe = (params['wireframe'] as boolean) || false;
    return state;
  }
}
