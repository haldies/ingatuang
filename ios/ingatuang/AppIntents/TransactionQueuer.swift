import Foundation

struct QueueEntry: Codable {
    let id: String
    let amount: Double
    let type: String
    let categoryId: String
    let notes: String
    let date: String
    let createdAt: String
}

class TransactionQueuer {
    static let shared = TransactionQueuer()
    private let groupIdentifier = "group.com.ingatuang.money.shared"
    private let fileName = "transaction_queue.json"
    
    func enqueue(parsed: ParsedTransaction) -> Bool {
        let entry = QueueEntry(
            id: UUID().uuidString,
            amount: parsed.amount,
            type: parsed.type,
            categoryId: parsed.categoryId,
            notes: parsed.notes,
            date: ISO8601DateFormatter().string(from: Date()),
            createdAt: ISO8601DateFormatter().string(from: Date())
        )
        
        guard let folderURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: groupIdentifier) else {
            return false
        }
        
        let fileURL = folderURL.appendingPathComponent(fileName)
        
        var queue: [QueueEntry] = []
        if let data = try? Data(contentsOf: fileURL),
           let existingQueue = try? JSONDecoder().decode([QueueEntry].self, from: data) {
            queue = existingQueue
        }
        
        queue.append(entry)
        
        if let data = try? JSONEncoder().encode(queue) {
            try? data.write(to: fileURL)
            return true
        }
        
        return false
    }
}
