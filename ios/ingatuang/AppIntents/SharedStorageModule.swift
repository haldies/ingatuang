import ExpoModulesCore
import Foundation

public class SharedStorageModule: Module {
  private let groupId = "group.com.ingatuang.money.shared"
  private let queueFile = "transaction_queue.json"

  public func definition() -> ModuleDefinition {
    Name("SharedStorage")

    // Baca antrian transaksi dari file JSON di App Group container
    Function("getQueue") { () -> String in
      guard let folderURL = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: self.groupId
      ) else {
        print("[SharedStorage] App Group container tidak ditemukan: \(self.groupId)")
        return "[]"
      }

      let fileURL = folderURL.appendingPathComponent(self.queueFile)
      guard let data = try? Data(contentsOf: fileURL),
            let json = String(data: data, encoding: .utf8) else {
        return "[]"
      }
      return json
    }

    // Hapus antrian setelah berhasil diproses oleh React Native
    Function("clearQueue") {
      guard let folderURL = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: self.groupId
      ) else { return }
      let fileURL = folderURL.appendingPathComponent(self.queueFile)
      try? FileManager.default.removeItem(at: fileURL)
      print("[SharedStorage] Antrian berhasil dihapus.")
    }
  }
}
