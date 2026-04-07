import AppIntents
import Foundation

// --- 1. Quick Add via Siri ---
@available(iOS 16.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Cepat"
    static var description = IntentDescription("Catat pengeluaran atau pemasukan tanpa membuka aplikasi.")
    
    // Properti ini menentukan apakah app terbuka atau tidak
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Teks Transaksi", description: "Contoh: Beli kopi 25rb")
    var text: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        guard let parsed = TransactionParser.parse(text: text) else {
            return .result(dialog: "Maaf, nominal tidak terdeteksi. Coba ulangi.")
        }
        
        let success = TransactionQueuer.shared.enqueue(parsed: parsed)
        
        if success {
            let typeLabel = parsed.type == "INCOME" ? "pemasukan" : "pengeluaran"
            return .result(dialog: "Oke! \(typeLabel) \(parsed.notes) sudah dicatat. 👍")
        }
        
        return .result(dialog: "Maaf, gagal menyimpan. Coba lagi ya.")
    }
}

// --- 2. Manual Add ---
@available(iOS 16.0, *)
struct ManualAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Manual"
    static var description = IntentDescription("Buka form input transaksi lengkap.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        return .result()
    }
}

// --- 3. App Shortcuts Provider ---
@available(iOS 16.0, *)
struct IngatUangShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: QuickAddIntent(),
            phrases: [
                "Catat \(\.$text) di \(.applicationName)",
                "Beli \(\.$text) di \(.applicationName)",
                "Makan \(\.$text) di \(.applicationName)"
            ],
            shortTitle: "Catat Cepat",
            systemImageName: "bolt.fill"
        )
        
        AppShortcut(
            intent: ManualAddIntent(),
            phrases: ["Catat manual di \(.applicationName)"],
            shortTitle: "Catat Manual",
            systemImageName: "keyboard"
        )
    }
}
