import Foundation
import Combine

// Application-owned mock API contract. No Twilio credentials belong in the app.
struct ReviewRequest: Encodable {
    let schemaVersion = 1
    let requestID: String
    let chartID = ChartConfiguration.chartID
    let revisionID = ChartConfiguration.revisionID
    let action = "confirm_snapshot_review"
}

struct ReviewResult: Codable {
    let schemaVersion: Int
    let requestID: String
    let chartID: String
    let revisionID: String
    let action: String
    let mode: String
    let status: String
    let receiptID: String
    let message: String

    static func mock(_ request: ReviewRequest) -> Self {
        Self(schemaVersion: 1, requestID: request.requestID, chartID: request.chartID,
             revisionID: request.revisionID, action: request.action, mode: "mock",
             status: "confirmed", receiptID: "mock-" + request.requestID.lowercased(),
             message: "Mock review confirmed. No business action was performed.")
    }

    func validate(for request: ReviewRequest) throws {
        guard schemaVersion == 1, requestID == request.requestID,
              chartID == request.chartID, revisionID == request.revisionID,
              action == request.action, mode == "mock", status == "confirmed",
              receiptID == "mock-" + request.requestID.lowercased(), !message.isEmpty
        else { throw ReviewError.invalidResponse }
    }
}

enum ReviewError: LocalizedError {
    case invalidResponse, rejected(Int)
    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "The mock API returned an unexpected response."
        case .rejected(let code): return "The mock API returned HTTP \(code)."
        }
    }
}

protocol ReviewAPI {
    var transportLabel: String { get }
    func confirm(_ request: ReviewRequest) async throws -> ReviewResult
}

struct LocalMockReviewAPI: ReviewAPI {
    var transportLabel: String { "Local mock • no network request" }
    func confirm(_ request: ReviewRequest) async throws -> ReviewResult {
        try await Task.sleep(nanoseconds: 400_000_000)
        return .mock(request)
    }
}

// Reject redirects before any request data can be forwarded to another URL.
final class NoReviewRedirects: NSObject, URLSessionTaskDelegate {
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest,
                    completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}

struct HTTPMockReviewAPI: ReviewAPI {
    var transportLabel: String { "HTTP mock API • /mock-confirm" }
    func confirm(_ payload: ReviewRequest) async throws -> ReviewResult {
        let endpoint = try ChartConfiguration.origin().appendingPathComponent("mock-confirm")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)
        request.timeoutInterval = 10
        let session = URLSession(configuration: .ephemeral, delegate: NoReviewRedirects(), delegateQueue: nil)
        defer { session.finishTasksAndInvalidate() }
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.url == endpoint,
              http.mimeType == "application/json", data.count <= 16_384
        else { throw ReviewError.invalidResponse }
        guard http.statusCode == 200 else { throw ReviewError.rejected(http.statusCode) }
        let result = try JSONDecoder().decode(ReviewResult.self, from: data)
        try result.validate(for: payload)
        return result
    }
}

@MainActor final class ConfirmationStore: ObservableObject {
    enum State {
        case ready, submitting, confirmed(ReviewResult), cancelled, failed(String)
    }
    @Published private(set) var state: State = .ready
    @Published private(set) var requestID = UUID().uuidString.lowercased()
    private let api: any ReviewAPI
    var transportLabel: String { api.transportLabel }
    var isSubmitting: Bool { if case .submitting = state { return true }; return false }

    init(api: (any ReviewAPI)? = nil) {
        if let api { self.api = api }
        else if ChartConfiguration.publicOrigin.isEmpty { self.api = LocalMockReviewAPI() }
        else { self.api = HTTPMockReviewAPI() }
    }

    func confirm() async {
        switch state { case .ready, .failed: break; default: return }
        let payload = ReviewRequest(requestID: requestID)
        state = .submitting
        do {
            let result = try await api.confirm(payload)
            try result.validate(for: payload)
            guard requestID == payload.requestID else { return }
            state = .confirmed(result)
        } catch {
            guard requestID == payload.requestID else { return }
            state = .failed(error.localizedDescription)
        }
    }

    func cancel() {
        // Cancel is offered only before submission. It never calls the API.
        guard case .ready = state else { return }
        state = .cancelled
    }

    func reset() {
        requestID = UUID().uuidString.lowercased()
        state = .ready
    }
}
