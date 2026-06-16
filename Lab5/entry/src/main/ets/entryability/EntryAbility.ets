import AbilityConstant from '@ohos.app.ability.AbilityConstant';
import UIAbility from '@ohos.app.ability.UIAbility';
import Want from '@ohos.app.ability.Want';
import window from '@ohos.window';
import { ContinuationHelper } from '../common/ContinuationHelper';
import { NoteItem } from '../model/NoteModel';
import { AppState } from '../common/AppState';

export default class EntryAbility extends UIAbility {
  onCreate(want: Want, launchParam: AbilityConstant.LaunchParam): void {
    let params = want.parameters ?? {};
    let continuationNote = ContinuationHelper.unpack(params);
    AppState.set('continuationNote', continuationNote as Object | undefined);
    AppState.set('isContinuation', continuationNote ? true : false as Object);
  }

  onContinue(wantParam: Record<string, Object>): AbilityConstant.OnContinueResult {
    let currentNote = AppState.get<NoteItem>('currentNote');
    if (currentNote) {
      let packed = ContinuationHelper.pack(currentNote);
      let keys = Object.keys(packed);
      for (let i = 0; i < keys.length; i++) {
        wantParam[keys[i]] = packed[keys[i]];
      }
    }
    return AbilityConstant.OnContinueResult.AGREE;
  }

  onWindowStageCreate(windowStage: window.WindowStage): void {
    windowStage.loadContent('pages/NoteList', (err) => {
      if (err.code) {
        console.error('Load failed: ' + JSON.stringify(err));
      }
    });
  }

  onDestroy(): void { }
  onForeground(): void { }
  onBackground(): void { }
}
