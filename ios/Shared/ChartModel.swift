import Foundation
import CryptoKit
import Combine

struct ChartSnapshot: Decodable {
    let schemaVersion: Int
    let chartID: String
    let revisionID: String
    let title: String
    let retrievedOn: String
    let dataMode: String
    let currency: String
    let valueBasis: String
    let displayDivisor: Double
    let rows: [RevenueRow]
    let sources: [ChartSource]

    func validate() throws {
        guard schemaVersion == 1, chartID == ChartConfiguration.chartID,
              revisionID == ChartConfiguration.revisionID,
              dataMode == "verified-snapshot", currency == "USD",
              valueBasis == "base USD", displayDivisor == 1_000_000_000,
              rows.count == 4, Set(rows.map(\.fiscalQuarter)) == Set(1...4),
              rows.allSatisfy({ $0.currency == "USD" && $0.value >= 0 && $0.fiscalYear == 2025 }),
              rows.allSatisfy({ row in row.sourceIDs.allSatisfy { id in sources.contains { $0.id == id } } })
        else { throw ChartError.invalidSnapshot }
    }
}

struct RevenueRow: Decodable, Identifiable {
    let date: String
    let value: Int64
    let currency: String
    let provider: String
    let unit: String?
    let originalCurrency: String?
    let originalValue: String?
    let fiscalQuarter: Int
    let fiscalYear: Int
    let isRestated: Bool?
    let isCalculated: Bool?
    let isAdjusted: Bool?
    let calcType: String?
    let lastSourceFilingDate: String?
    let observedAt: String?
    let sourceIDs: [String]
    var id: String { date }
    var quarter: String { "Q\(fiscalQuarter)" }
    var billions: Double { Double(value) / 1_000_000_000 }
    var exactUSD: String { String(value) }
    static func flag(_ value: Bool?) -> String { value.map { $0 ? "true" : "false" } ?? "null" }
    enum CodingKeys: String, CodingKey {
        case date, value, currency, provider, unit
        case originalCurrency = "original_currency", originalValue = "original_value"
        case fiscalQuarter = "fiscal_quarter", fiscalYear = "fiscal_year"
        case isRestated = "is_restated", isCalculated = "is_calculated", isAdjusted = "is_adjusted"
        case calcType = "calc_type", lastSourceFilingDate = "last_source_filing_date"
        case observedAt = "observed_at", sourceIDs = "source_ref_ids"
    }
}

struct ChartSource: Decodable, Identifiable {
    let id: String
    let provider: String
    let url: URL
    let pageNumber: Int
}

enum ChartError: LocalizedError {
    case configuration, invalidMessage, invalidSnapshot, snapshotChanged, network
    var errorDescription: String? {
        switch self {
        case .configuration: return "Configure the deployed HTTPS origin in ChartModel.swift before loading or inserting messages."
        case .invalidMessage: return "This message does not match the configured origin and verified chart revision."
        case .invalidSnapshot: return "The chart snapshot did not pass validation."
        case .snapshotChanged: return "The server snapshot differs from the verified snapshot packaged in this app. No replacement data was displayed."
        case .network: return "The verified chart could not be loaded from the server. Try again when connected."
        }
    }
}

enum ChartConfiguration {
    static let chartID = "b71d8906-be7f-499e-a448-044d4ec39825"
    static let revisionID = "f47530da-762a-44a1-9c52-ab142462bf6f"
    // Set once to the Twilio Functions origin returned by your deployment.
    // Empty means bundled-snapshot mode only; no URL is invented.
    static let publicOrigin = ""

    static func origin() throws -> URL {
        guard let u = URL(string: publicOrigin), u.scheme == "https", u.host != nil,
              u.user == nil, u.password == nil, u.query == nil, u.fragment == nil,
              u.path.isEmpty || u.path == "/" else { throw ChartError.configuration }
        return u
    }

    static func messageURL(session: UUID, component: NativeComponent = .bar) throws -> URL {
        var c = URLComponents(url: try origin().appendingPathComponent("chart"), resolvingAgainstBaseURL: false)!
        c.queryItems = [URLQueryItem(name: "chart_id", value: chartID),
                        URLQueryItem(name: "revision_id", value: revisionID),
                        URLQueryItem(name: "session_id", value: session.uuidString),
                        URLQueryItem(name: "component", value: component.rawValue)]
        guard let url = c.url else { throw ChartError.configuration }
        return url
    }

    static func validateMessage(_ url: URL) throws -> ComponentRoute {
        let expected = try origin()
        guard let c = URLComponents(url: url, resolvingAgainstBaseURL: false),
              c.scheme == expected.scheme, c.host == expected.host, c.port == expected.port,
              c.user == nil, c.password == nil, c.fragment == nil, c.path == "/chart",
              let items = c.queryItems, (3...4).contains(items.count),
              Set(items.map(\.name)).count == items.count,
              Set(["chart_id", "revision_id", "session_id"]).isSubset(of: Set(items.map(\.name))),
              Set(items.map(\.name)).isSubset(of: Set(["chart_id", "revision_id", "session_id", "component"])),
              items.first(where: { $0.name == "chart_id" })?.value == chartID,
              items.first(where: { $0.name == "revision_id" })?.value == revisionID,
              let session = UUID(uuidString: items.first(where: { $0.name == "session_id" })?.value ?? ""),
              let component = NativeComponent(rawValue: items.contains(where: { $0.name == "component" })
                ? (items.first(where: { $0.name == "component" })?.value ?? "") : "bar")
        else { throw ChartError.invalidMessage }
        return ComponentRoute(session: session, component: component)
    }
}

@MainActor final class ChartStore: ObservableObject {
    @Published var snapshot: ChartSnapshot?
    @Published var status = "Loading verified snapshot…"
    @Published var error: String?
    @Published var component: NativeComponent = .bar
    let confirmation = ConfirmationStore()
    private var loadedMessage: URL?

    func load(messageURL: URL?) async {
        snapshot = nil; error = nil
        do {
            guard let bundledURL = Bundle.main.url(forResource: "chart-manifest", withExtension: "json")
            else { throw ChartError.invalidSnapshot }
            let bundled = try Data(contentsOf: bundledURL)
            var data = bundled
            if let messageURL {
                let route = try ChartConfiguration.validateMessage(messageURL)
                if loadedMessage != messageURL {
                    component = route.component
                    confirmation.reset()
                    loadedMessage = messageURL
                }
                let endpoint = try ChartConfiguration.origin().appendingPathComponent("chart-manifest")
                var request = URLRequest(url: endpoint)
                request.timeoutInterval = 10
                request.cachePolicy = .reloadIgnoringLocalCacheData
                let (received, response) = try await URLSession.shared.data(for: request)
                guard let http = response as? HTTPURLResponse, http.statusCode == 200,
                      http.url?.host == endpoint.host, http.url?.scheme == "https",
                      http.mimeType == "application/json" else { throw ChartError.network }
                // The HTTP runtime may reserialize JSON. Compare all content
                // after deterministic key ordering, not transport whitespace.
                func canonical(_ value: Data) throws -> Data {
                    let object = try JSONSerialization.jsonObject(with: value)
                    return try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys])
                }
                guard try SHA256.hash(data: canonical(received)) == SHA256.hash(data: canonical(bundled))
                else { throw ChartError.snapshotChanged }
                data = received
            } else if loadedMessage != nil {
                loadedMessage = nil
                component = .bar
                confirmation.reset()
            }
            let decoded = try JSONDecoder().decode(ChartSnapshot.self, from: data)
            try decoded.validate()
            guard !Task.isCancelled else { return }
            snapshot = decoded
            status = messageURL == nil ? "Bundled verified snapshot • retrieved \(decoded.retrievedOn)" : "Server snapshot verified • retrieved \(decoded.retrievedOn)"
        } catch {
            guard !Task.isCancelled else { return }
            self.error = (error as? ChartError)?.errorDescription ?? ChartError.network.errorDescription
            status = "Chart unavailable"
        }
    }
}
