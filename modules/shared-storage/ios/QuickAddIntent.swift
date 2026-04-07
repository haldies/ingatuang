import AppIntents
import Foundation

// Konstanta
private let appGroupId = "group.com.ingatuang.money.shared"

// --- 1. Quick Add via Siri (BACKGROUND - App TIDAK terbuka) ---
@available(iOS 16.0, *)
struct QuickAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Cepat"
    static var description = IntentDescription("Catat pengeluaran atau pemasukan tanpa membuka aplikasi.")
    
    // Gunakan supportedModes (openAppWhenRun sudah DEPRECATED per Apple docs)
    // .background = intent jalan di background, app TIDAK dibuka
    @available(iOS 17.0, *)
    static var supportedModes: IntentModes { .background }
    
    // Fallback untuk iOS 16 (openAppWhenRun masih bekerja walau deprecated)
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Teks Transaksi", description: "Contoh: Beli kopi 25rb atau Gaji 5 juta")
    var text: String

    func perform() async throws -> some IntentResult & ProvidesDialog {
        // 1. Parse teks menggunakan logic Swift
        guard let parsed = TransactionParser.parse(text: text) else {
            return .result(dialog: "Maaf, nominal tidak terdeteksi. Coba ulangi dengan menyebut nominalnya.")
        }
        
        // 2. Simpan ke antrian (App Group shared storage)
        let success = TransactionQueuer.shared.enqueue(parsed: parsed)
        
        if success {
            let typeLabel = parsed.type == "INCOME" ? "pemasukan" : "pengeluaran"
            let amount = formatAmount(parsed.amount)
            // 3. Siri konfirmasi suara — App tidak pernah terbuka
            return .result(dialog: "Oke! \(typeLabel) \(parsed.notes) \(amount) sudah dicatat di IngatUang. 👍")
        }
        
        return .result(dialog: "Maaf, gagal menyimpan. Coba lagi ya.")
    }
    
    private func formatAmount(_ amount: Double) -> String {
        if amount >= 1_000_000 {
            let juta = amount / 1_000_000
            return juta.truncatingRemainder(dividingBy: 1) == 0
                ? "\(Int(juta)) juta rupiah"
                : "\(juta) juta rupiah"
        } else if amount >= 1_000 {
            let ribu = amount / 1_000
            return ribu.truncatingRemainder(dividingBy: 1) == 0
                ? "\(Int(ribu)) ribu rupiah"
                : "\(ribu) ribu rupiah"
        }
        return "\(Int(amount)) rupiah"
    }
}

// --- 2. Manual Add (Buka App karena butuh form detail) ---
@available(iOS 16.0, *)
struct ManualAddIntent: AppIntent {
    static var title: LocalizedStringResource = "Catat Manual"
    static var description = IntentDescription("Buka form input transaksi lengkap di IngatUang.")
    static var openAppWhenRun: Bool = true

    func perform() async throws -> some IntentResult {
        // Tidak perlu apa-apa, iOS buka app karena openAppWhenRun = true
        return .result()
    }
}

// --- 3. App Shortcuts Provider (Auto-muncul di Pintasan & Spotlight) ---
@available(iOS 16.0, *)
struct IngatUangShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        [
            AppShortcut(
                intent: QuickAddIntent(),
                phrases: [
                    "Catat \(\.$text) di \(.applicationName)",
                    "Beli \(\.$text) di \(.applicationName)",
                    "Makan \(\.$text) di \(.applicationName)",
                    "Bayar \(\.$text) di \(.applicationName)",
                    "Terima \(\.$text) di \(.applicationName)"
                ],
                shortTitle: "Catat Cepat",
                systemImageName: "bolt.fill"
            ),
            AppShortcut(
                intent: ManualAddIntent(),
                phrases: ["Catat manual di \(.applicationName)"],
                shortTitle: "Catat Manual",
                systemImageName: "keyboard"
            )
        ]
    }
}
