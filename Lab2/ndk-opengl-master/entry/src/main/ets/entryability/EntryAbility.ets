import { UIAbility, Want, AbilityConstant } from '@kit.AbilityKit';
import { window } from '@kit.ArkUI';
import { BusinessError } from '@kit.BasicServicesKit';
import { Logger } from '../utils/Logger';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { ModelState, ContinuationHelper } from '../utils/ContinuationHelper';

class AppState {
  static set(key: string, value: Object | undefined): void {
    AppStorage.setOrCreate(key, value ?? null);
  }
  static get<T>(key: string): T | undefined {
    return AppStorage.get(key) as T | undefined;
  }
}

export default class EntryAbility extends UIAbility {
  public uiContext?: UIContext;
  private currentState: ModelState = new ModelState();

  public onWindowSizeChange: (windowSize: window.Size) => void = (windowSize: window.Size) => {
    AppStorage.setOrCreate('windowHeight', windowSize.height);
    AppStorage.setOrCreate('windowWidth', windowSize.width);
  };

  public onAvoidAreaChange: (avoidArea: window.AvoidAreaOptions) => void = (avoidArea: window.AvoidAreaOptions) => {
    if (avoidArea.type === window.AvoidAreaType.TYPE_CUTOUT) {
      AppStorage.setOrCreate('cutout', avoidArea);
    }
  }

  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    Logger.info('Ability onCreate');

    let params = want.parameters ?? {};
    let continuationState = ContinuationHelper.unpack(params);
    AppState.set('continuationState', continuationState as Object | undefined);
    AppState.set('isContinuation', continuationState ? true : false as Object);
  }

  onContinue(wantParam: Record<string, Object>): AbilityConstant.OnContinueResult {
    let packed = ContinuationHelper.pack(this.currentState);
    let keys = Object.keys(packed);
    for (let i = 0; i < keys.length; i++) {
      wantParam[keys[i]] = packed[keys[i]];
    }
    return AbilityConstant.OnContinueResult.AGREE;
  }

  onDestroy() {
    Logger.info('Ability onDestroy');
  }

  onWindowStageCreate(windowStage: window.WindowStage) {
    Logger.info('Ability onWindowStageCreate');

    try {
      windowStage.getMainWindowSync().setWindowLayoutFullScreen(true);
      windowStage.getMainWindowSync().setWindowSystemBarEnable([]);
    } catch (error) {
      let err = error as BusinessError;
      hilog.error(0x0000, 'EntryAbility',
        `Failed to set the window state. Error code=${err.code}, message=${err.message}`);
    }

    let windowClass: window.Window | undefined = undefined;
    windowStage.getMainWindow((err: BusinessError, data) => {
      if (err.code) {
        Logger.error('Failed to obtain the main window. Cause: %{public}s', JSON.stringify(err) ?? '');
        return;
      }
      windowClass = data;
      let orientation = window.Orientation.AUTO_ROTATION_PORTRAIT;
      try {
        windowClass.setPreferredOrientation(orientation, (err: BusinessError) => {
          if (err.code) {
            Logger.error('Failed to set window orientation. Cause: %{public}s', JSON.stringify(err) ?? '');
            return;
          }
          Logger.info('Succeeded in setting window orientation. Data: %{public}s');
        })
      } catch (exception) {
        Logger.error('Failed to set window orientation. Cause: %{public}s', JSON.stringify(exception) ?? '');
      }
    })
    windowStage.loadContent('pages/Index', (err, data) => {
      if (err.code) {
        Logger.error('Failed to load the content. Cause: ' + JSON.stringify(err));
        return;
      }
      Logger.info('Succeeded in loading the content. Data: ' + JSON.stringify(data));
      windowStage.getMainWindow((err: BusinessError, data) => {
        if (err.code) {
          Logger.error('Failed to obtain the main window. Cause: %{public}s', JSON.stringify(err) ?? '');
          return;
        }
        let properties = data.getWindowProperties();
        AppStorage.setOrCreate('windowHeight', properties.windowRect.height);
        AppStorage.setOrCreate('windowWidth', properties.windowRect.width);
        this.uiContext = data.getUIContext();
        let widthBp: WidthBreakpoint = this.uiContext.getWindowWidthBreakpoint();
        let heightBp: HeightBreakpoint = this.uiContext.getWindowHeightBreakpoint();
        AppStorage.setOrCreate('currentWidthBreakpoint', widthBp);
        AppStorage.setOrCreate('currentHeightBreakpoint', heightBp);
        data.on('windowSizeChange', this.onWindowSizeChange);
        let avoidArea: window.AvoidArea = data.getWindowAvoidArea(window.AvoidAreaType.TYPE_CUTOUT);
        this.onAvoidAreaChange({ type: window.AvoidAreaType.TYPE_CUTOUT, area: avoidArea });
        data.on('avoidAreaChange', this.onAvoidAreaChange);
      })
    });
  }

  onWindowStageDestroy() {
    Logger.info('Ability onWindowStageDestroy');
  }

  onForeground() {
    Logger.info('Ability onForeground');
  }

  onBackground() {
    Logger.info('%{public}s', 'Ability onBackground');
  }
};
