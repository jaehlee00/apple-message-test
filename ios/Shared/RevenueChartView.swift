import SwiftUI
import Charts

struct RevenueChartView: View {
    let snapshot: ChartSnapshot
    let compact: Bool
    let style: NativeComponent
    var expand: (() -> Void)? = nil
    @State private var selection: String? = "Q1"
    @State private var selectedAngle: Double?
    private let accent = Color(red: 0.04, green: 0.40, blue: 0.31)
    private var selected: RevenueRow {
        if style == .pie, let angle = selectedAngle {
            var cumulative = 0.0
            for row in snapshot.rows {
                cumulative += Double(row.value)
                if angle < cumulative { return row }
            }
        }
        return snapshot.rows.first { $0.quarter == selection } ?? snapshot.rows[0]
    }
    private var total: Double { snapshot.rows.reduce(0) { $0 + Double($1.value) } }

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 7 : 14) {
            Text("Microsoft FY2025 revenue").font(compact ? .headline : .title2.bold())
            Text(style == .pie ? "Share of the four displayed quarters • USD" : "Reported results • USD billions")
                .font(.caption).foregroundStyle(.secondary)
            if style == .pie {
                Chart(snapshot.rows) { row in
                    SectorMark(angle: .value("Revenue, USD", Double(row.value)), angularInset: 2)
                        .foregroundStyle(by: .value("Quarter", row.quarter))
                        .opacity(row.id == selected.id ? 1 : 0.65)
                        .accessibilityLabel("\(row.quarter), ending \(row.date)")
                        .accessibilityValue("USD \(row.exactUSD)")
                }
                .chartAngleSelection(value: $selectedAngle)
                .chartLegend(position: .bottom)
                .frame(height: compact ? 145 : 250)
                Text("\(selected.quarter): \(Double(selected.value) / total * 100, specifier: "%.1f")% of displayed total")
                    .font(.caption)
            } else {
                Chart(snapshot.rows) { row in
                    if style == .bar {
                        BarMark(x: .value("Quarter", row.quarter), y: .value("USD billions", row.billions))
                            .foregroundStyle(row.id == selected.id ? accent : accent.opacity(0.40))
                    } else {
                        LineMark(x: .value("Quarter", row.quarter), y: .value("USD billions", row.billions))
                            .foregroundStyle(accent)
                        PointMark(x: .value("Quarter", row.quarter), y: .value("USD billions", row.billions))
                            .foregroundStyle(accent)
                    }
                }
                .chartYScale(domain: 0...90)
                .chartXSelection(value: $selection)
                .frame(height: compact ? 125 : 230)
                .accessibilityLabel("Microsoft quarterly revenue in billions of US dollars")
            }
            Picker("Quarter details", selection: Binding(get: { selected.quarter }, set: { selection = $0; selectedAngle = nil })) {
                ForEach(snapshot.rows) { Text($0.quarter).tag($0.quarter) }
            }.pickerStyle(.segmented)
            Text("\(selected.quarter) · \(selected.date) · USD \(selected.exactUSD)")
                .font(.caption.monospacedDigit()).fixedSize(horizontal: false, vertical: true)
            Text("\(selected.provider) · Restated: \(RevenueRow.flag(selected.isRestated)) · Calculated: \(RevenueRow.flag(selected.isCalculated))")
                .font(.caption2).fixedSize(horizontal: false, vertical: true)
            if compact {
                if let expand { Button("View sources and details", action: expand).font(.caption) }
            } else { RevenueDataView(snapshot: snapshot) }
        }.tint(accent)
    }
}

struct ChartScreen: View {
    @ObservedObject var store: ChartStore
    @ObservedObject var confirmation: ConfirmationStore
    var compact = false
    var expand: (() -> Void)? = nil
    var insert: (() -> Void)? = nil
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                if let snapshot = store.snapshot {
                    if !compact {
                        Picker("Native component", selection: $store.component) {
                            ForEach(NativeComponent.allCases) { Text($0.title).tag($0) }
                        }.pickerStyle(.menu).disabled(confirmation.isSubmitting)
                    }
                    switch store.component {
                    case .bar, .line, .pie:
                        RevenueChartView(snapshot: snapshot, compact: compact, style: store.component, expand: expand)
                    case .data:
                        Text("Microsoft FY2025 revenue").font(.headline)
                        RevenueDataView(snapshot: snapshot)
                    case .confirmation:
                        ConfirmationView(store: confirmation, snapshot: snapshot, compact: compact)
                    }
                    if let insert {
                        Button("Insert \(store.component.title) into message", action: insert)
                            .buttonStyle(.borderedProminent).disabled(confirmation.isSubmitting)
                    }
                } else if let error = store.error {
                    Label("Chart unavailable", systemImage: "exclamationmark.triangle").font(.headline)
                    Text(error).font(.caption)
                } else { ProgressView("Loading verified snapshot") }
                Text(store.status).font(.caption2).foregroundStyle(.secondary)
            }.padding(compact ? 12 : 20)
        }.background(Color(uiColor: .systemBackground))
    }
}
