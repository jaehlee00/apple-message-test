import SwiftUI

struct ConfirmationView: View {
    @ObservedObject var store: ConfirmationStore
    let snapshot: ChartSnapshot
    let compact: Bool

    private func json(_ result: ReviewResult) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        return (try? encoder.encode(result)).flatMap { String(data: $0, encoding: .utf8) } ?? "Response unavailable"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Review confirmation", systemImage: "checkmark.seal").font(.headline)
            Text("Microsoft FY2025 revenue • 4 quarterly records").font(.subheadline)
            Text("Fiscal via Financial Data • USD • restated • Q4 calculated")
                .font(.caption).foregroundStyle(.secondary)
            switch store.state {
            case .ready:
                Text("Confirm that you reviewed this snapshot?")
                Text("Demo action only. No trade, holding change, or message is sent.").font(.caption)
                HStack {
                    Button("Cancel", role: .cancel) { store.cancel() }.buttonStyle(.bordered)
                    Button("Confirm") { Task { await store.confirm() } }.buttonStyle(.borderedProminent)
                }
            case .submitting:
                ProgressView("Submitting mock confirmation…")
                Text("Waiting for the API response.").font(.caption)
            case .confirmed(let result):
                Label("Mock confirmation received", systemImage: "checkmark.circle.fill").foregroundStyle(.green)
                Text(result.message).font(.caption)
                Text("Status: \(result.status) • Mode: \(result.mode)").font(.caption.monospaced())
                Text("Receipt: \(result.receiptID)").font(.caption2.monospaced()).textSelection(.enabled)
                if !compact {
                    DisclosureGroup("API response") {
                        Text(json(result)).font(.caption2.monospaced()).textSelection(.enabled)
                    }
                }
                Button("Start another mock review") { store.reset() }.font(.caption)
            case .cancelled:
                Label("Cancelled", systemImage: "xmark.circle")
                Text("No confirmation request was made.").font(.caption)
                Button("Review again") { store.reset() }
            case .failed(let reason):
                Label("Response unavailable", systemImage: "exclamationmark.triangle")
                Text(reason).font(.caption)
                Text("The outcome is unknown. Retry uses the same request ID; this mock has no side effects.").font(.caption)
                Button("Retry mock request") { Task { await store.confirm() } }.buttonStyle(.bordered)
            }
            Text(store.transportLabel).font(.caption2).foregroundStyle(.secondary)
            if !compact { RevenueDataView(snapshot: snapshot) }
        }
    }
}
