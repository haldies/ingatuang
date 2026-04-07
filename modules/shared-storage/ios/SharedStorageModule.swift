import ExpoModulesCore
import Foundation

public class SharedStorageModule: Module {
  private let groupId = "group.com.ingatuang.money.shared"
  private let storageKey = "pending_transactions"

  public func definition() -> ModuleDefinition {
    Name("SharedStorage")

    Function("getQueue") { () -> String in
      guard let defaults = UserDefaults(suiteName: self.groupId),
            let data = defaults.data(forKey: self.storageKey),
            let json = String(data: data, encoding: .utf8) else {
        return "[]"
      }
      return json
    }

    Function("clearQueue") {
      guard let defaults = UserDefaults(suiteName: self.groupId) else { return }
      defaults.removeObject(forKey: self.storageKey)
      defaults.synchronize()
      print("[SharedStorage] Antrian di UserDefaults berhasil dihapus.")
    }
  }
}
