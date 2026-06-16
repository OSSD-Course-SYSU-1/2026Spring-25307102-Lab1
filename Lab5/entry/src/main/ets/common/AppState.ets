export class AppState {
  static set(key: string, value: Object | undefined): void {
    AppStorage.setOrCreate(key, value ?? null);
  }

  static get<T>(key: string): T | undefined {
    return AppStorage.get(key) as T | undefined;
  }

  static delete(key: string): void {
    AppStorage.setOrCreate(key, null);
  }
}
