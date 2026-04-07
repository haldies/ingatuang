import Foundation

public struct ParsedTransaction {
    public let amount: Double
    public let type: String
    public let categoryId: String
    public let notes: String
}

public class TransactionParser {
    
    public static func parse(text: String) -> ParsedTransaction? {
        let lowerText = text.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
        
        let amount = extractAmount(from: lowerText)
        guard amount > 0 else { return nil }
        
        let type = detectType(from: lowerText)
        let categoryId = detectCategory(from: lowerText, type: type)
        let notes = extractNotes(from: text, amount: amount)
        
        return ParsedTransaction(
            amount: amount,
            type: type,
            categoryId: categoryId,
            notes: notes
        )
    }
    
    private static func detectType(from text: String) -> String {
        let incomeKeywords = ["gaji", "terima", "dapat", "bonus", "income", "masuk", "salary", "upah", "cair", "profit", "untung"]
        for keyword in incomeKeywords {
            if text.contains(keyword) {
                return "INCOME"
            }
        }
        return "EXPENSE"
    }
    
    private static func extractAmount(from text: String) -> Double {
        // Robust Regex matching "rp 25.000", "25rb", "25k", "5 juta", etc.
        let pattern = "(?:rp\\s*)?([\\d]+(?:[.,][\\d]+)?)\\s*(ribu|rb|k|juta|jt|m|ratus)?"
        guard let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) else { return 0 }
        
        let nsRange = NSRange(text.startIndex..<text.endIndex, in: text)
        let matches = regex.matches(in: text, options: [], range: nsRange)
        
        var maxAmount: Double = 0
        var foundWithUnit = false
        
        for match in matches {
            guard let numberRange = Range(match.range(at: 1), in: text) else { continue }
            var numberStr = text[numberRange].replacingOccurrences(of: ",", with: ".")
            
            // Check for ID style dot thousands separator: 25.000
            let parts = numberStr.components(separatedBy: ".")
            if parts.count > 1 && parts.last?.count == 3 {
                numberStr = numberStr.replacingOccurrences(of: ".", with: "")
            }
            
            guard var number = Double(numberStr) else { continue }
            
            var hasUnit = false
            if let unitRange = Range(match.range(at: 2), in: text) {
                let unit = text[unitRange].lowercased()
                hasUnit = true
                if ["ribu", "rb", "k"].contains(unit) { number *= 1000 }
                else if ["juta", "jt", "m"].contains(unit) { number *= 1000000 }
                else if unit == "ratus" { number *= 100 }
            }
            
            // Priority logic
            if hasUnit {
                if !foundWithUnit || number > maxAmount {
                    maxAmount = number
                    foundWithUnit = true
                }
            } else if number >= 1000 {
                if !foundWithUnit && number > maxAmount {
                    maxAmount = number
                }
            } else if maxAmount == 0 && !foundWithUnit {
                maxAmount = number
            }
        }
        
        return maxAmount
    }

    private static func detectCategory(from text: String, type: String) -> String {
        // IDs match DEFAULT_CATEGORIES in @/lib/storage/storage.ts
        if type == "INCOME" {
            if text.contains("gaji") || text.contains("upah") || text.contains("cair") { return "1" }
            if text.contains("bonus") || text.contains("hadiah") { return "2" }
            if text.contains("investasi") || text.contains("profit") || text.contains("saham") || text.contains("crypto") { return "3" }
            return "4" // Lainnya (Income)
        } else {
            if text.contains("tagihan") || text.contains("pulsa") || text.contains("listrik") || text.contains("wifi") || text.contains("internet") { return "9" }
            if text.contains("makan") || text.contains("kopi") || text.contains("jajan") || text.contains("restoran") || text.contains("sate") || text.contains("bakso") || text.contains("nasgor") { return "5" }
            if text.contains("transport") || text.contains("bensin") || text.contains("ojek") || text.contains("grab") || text.contains("gojek") || text.contains("parkir") || text.contains("tol") { return "6" }
            if text.contains("belanja") || text.contains("supermarket") || text.contains("indomaret") || text.contains("alfamart") || text.contains("pasar") || text.contains("mall") { return "7" }
            if text.contains("nonton") || text.contains("bioskop") || text.contains("game") || text.contains("netflix") || text.contains("spotify") { return "8" }
            if text.contains("obat") || text.contains("dokter") || text.contains("rs") || text.contains("apotek") { return "10" }
            return "12" // Lainnya (Expense)
        }
    }
    
    private static func extractNotes(from text: String, amount: Double) -> String {
        var clean = text
        
        // Remove amount entries
        let amountPattern = "\\b\\d+[.,]?\\d*\\s*(ribu|rb|k|juta|jt|m|ratus)\\b"
        if let regex = try? NSRegularExpression(pattern: amountPattern, options: .caseInsensitive) {
            clean = regex.stringByReplacingMatches(in: clean, options: [], range: NSRange(location: 0, length: clean.count), withTemplate: "")
        }
        
        let largeNumPattern = "\\b\\d{4,}[.,]?\\d*\\b"
        if let regex = try? NSRegularExpression(pattern: largeNumPattern, options: []) {
            clean = regex.stringByReplacingMatches(in: clean, options: [], range: NSRange(location: 0, length: clean.count), withTemplate: "")
        }
        
        // Remove verbs
        let verbs = ["beli", "bayar", "untuk", "ke", "di", "dari", "terima", "dapat", "rp", "idr"]
        for verb in verbs {
            let verbPattern = "\\b\(verb)\\b"
            if let regex = try? NSRegularExpression(pattern: verbPattern, options: .caseInsensitive) {
                clean = regex.stringByReplacingMatches(in: clean, options: [], range: NSRange(location: 0, length: clean.count), withTemplate: "")
            }
        }
        
        clean = clean.trimmingCharacters(in: .whitespacesAndNewlines)
        if clean.isEmpty { return "Transaksi" }
        
        return clean.prefix(1).uppercased() + clean.dropFirst()
    }
}
