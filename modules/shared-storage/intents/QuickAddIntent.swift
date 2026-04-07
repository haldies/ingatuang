import AppIntents
import Foundation
import SharedStorage

@available(iOS 16.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Cepat"
    static var description = IntentDescription("Catat pengeluaran atau pemasukan tanpa membuka aplikasi.")
    static var openAppWhenRun: Bool = false

    @Parameter(
        title: "Teks Transaksi",
        description: "Contoh: Beli kopi 25rb",
        requestValueDialog: IntentDialog("Sebutkan transaksimu. Contoh: Beli kopi 25rb")
    )
    var transactionText: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
    
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
@available(iOS 16.0, *)
struct ManualAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Manual"
    static var description = IntentDescription("Buka form input transaksi lengkap.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        return .result()
    }
}

