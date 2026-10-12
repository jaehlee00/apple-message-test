import SwiftUI

struct RevenueDataView: View {
    let snapshot: ChartSnapshot
    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            Divider()
            Text("Source records").font(.headline)
            ForEach(snapshot.rows) { row in
                VStack(alignment: .leading, spacing: 4) {
                    Text("FY\(String(row.fiscalYear)) \(row.quarter) · \(row.date)").font(.subheadline.bold())
                    Text("USD \(row.exactUSD) · \(row.provider)").monospacedDigit()
                    Text("Restated: \(RevenueRow.flag(row.isRestated)); calculated: \(RevenueRow.flag(row.isCalculated)); adjusted: \(RevenueRow.flag(row.isAdjusted))")
                    Text("Calculation: \(row.calcType ?? "null")")
                    Text("Provider unit hint: \(row.unit ?? "null"); value basis: base USD")
                    Text("Original currency: \(row.originalCurrency ?? "null"); original value: \(row.originalValue ?? "null")")
                    Text("Latest source filing: \(row.lastSourceFilingDate ?? "null")")
                    Text("Provider observed: \(row.observedAt ?? "null")")
                    ForEach(snapshot.sources.filter { row.sourceIDs.contains($0.id) }) { source in
                        Link("\(source.provider) filing · page \(source.pageNumber)", destination: source.url)
                    }
                }.font(.caption).padding(.vertical, 6)
            }
            Text("Values are the existing Fiscal provider snapshot retrieved through Financial Data on \(snapshot.retrievedOn). All four quarters are marked restated; Q4 is provider-calculated. This is not a live market-price feed or management guidance. The unit hint does not rescale the stored base-USD values.")
                .font(.caption).foregroundStyle(.secondary)
        }
    }
}
