import AppIntents
import Foundation

// MARK: - Entry Point (WAJIB untuk App Intents Extension)
// Tanpa @main ini, ExtractAppIntentsMetadata tidak bisa menemukan intent
// dan akan gagal saat archive.
@available(iOS 16.0, *)
@main
struct IngatUangIntentsMain: AppIntentsExtension {}

// MARK: - 1. Quick Add via Siri
@available(iOS 16.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Cepat"
    static var description = IntentDescription("Catat pengeluaran atau pemasukan tanpa membuka aplikasi.")
    static var openAppWhenRun: Bool = false

    // ATURAN APPLE (dari docs):
    // - String @Parameter BOLEH didefinisikan
    // - Tapi TIDAK BISA dipakai di AppShortcut phrase sebagai \(\.$param)
    // - requestValueDialog harus dideklarasi DI SINI (bukan di dalam perform())
    // - Siri otomatis menanyakan nilainya sebelum memanggil perform()
    @Parameter(
        title: "Teks Transaksi",
        description: "Contoh: Beli kopi 25rb",
        requestValueDialog: IntentDialog("Sebutkan transaksimu. Contoh: Beli kopi 25rb")
    )
    var transactionText: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // transactionText sudah terisi oleh Siri sebelum perform() dipanggil.
        // Tidak perlu memanggil $transactionText.requestValue() lagi.
        guard let parsed = TransactionParser.parse(text: transactionText) else {
            return .result(dialog: "Maaf, nominal tidak terdeteksi. Coba: Beli kopi 25rb")
        }

        let success = TransactionQueuer.shared.enqueue(parsed: parsed)

        if success {
            let typeLabel = parsed.type == "INCOME" ? "pemasukan" : "pengeluaran"
            return .result(dialog: "Oke! \(typeLabel) \(parsed.notes) sudah dicatat. 👍")
        }

        return .result(dialog: "Maaf, gagal menyimpan. Coba lagi ya.")
    }
}

// MARK: - 2. Manual Add
@available(iOS 16.0, *)
struct ManualAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Manual"
    static var description = IntentDescription("Buka form input transaksi lengkap.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        return .result()
    }
}

// MARK: - 3. App Shortcuts Provider
@available(iOS 16.0, *)
struct IngatUangShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        // ATURAN APPLE: phrase interpolation \(\.$param) hanya valid untuk AppEntity & AppEnum.
        // transactionText bertipe String → TIDAK BOLEH dipakai di phrase.
        // Siri akan meminta input saat runtime via requestValueDialog yang sudah dideklarasi.
        AppShortcut(
            intent: QuickAddIntent(),
            phrases: [
                "Catat cepat di \(.applicationName)",
                "Tambah transaksi di \(.applicationName)",
                "Catat pengeluaran di \(.applicationName)"
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
