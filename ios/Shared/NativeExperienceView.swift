import SwiftUI

// Shared by the full app and App Clip. When the full app is installed, Apple
// routes App Clip invocations to it, so both hosts must handle the same URLs.
struct NativeExperienceView: View {
    @StateObject private var store = ChartStore()
    @State private var invocationURL: URL?
    var body: some View {
        NavigationStack {
            ChartScreen(store: store, confirmation: store.confirmation)
                .navigationTitle("Chart Concierge")
                .navigationBarTitleDisplayMode(.inline)
        }
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
            invocationURL = activity.webpageURL
        }
        .task(id: invocationURL) { await store.load(messageURL: invocationURL) }
    }
}
