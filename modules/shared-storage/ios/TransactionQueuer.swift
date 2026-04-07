import Foundation

public struct QueueEntry: Codable {
    public let id: String
    public let amount: Double
    public let type: String
    public let categoryId: String
    public let notes: String
    public let date: String
    public let createdAt: String
}

public class TransactionQueuer {
    public static let shared = TransactionQueuer()
    private let groupIdentifier = "group.com.ingatuang.money.shared"
    private let storageKey = "pending_transactions"
    
    public func enqueue(parsed: ParsedTransaction) -> Bool {
        let entry = QueueEntry(
            id: UUID().uuidString,
            amount: parsed.amount,
            type: parsed.type,
            categoryId: parsed.categoryId,
            notes: parsed.notes,
            date: ISO8601DateFormatter().string(from: Date()),
            createdAt: ISO8601DateFormatter().string(from: Date())
        )
        
        guard let defaults = UserDefaults(suiteName: groupIdentifier) else {
            return false
        }
        
        var queue: [QueueEntry] = []
        if let data = defaults.data(forKey: storageKey),
           let existingQueue = try? JSONDecoder().decode([QueueEntry].self, from: data) {
            queue = existingQueue
        }
        
        queue.append(entry)
        
        if let encoded = try? JSONEncoder().encode(queue) {
            defaults.set(encoded, forKey: storageKey)
            defaults.synchronize() 
            return true
        }
        
        return false
    }
}
