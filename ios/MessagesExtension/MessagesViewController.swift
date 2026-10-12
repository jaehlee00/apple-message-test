import UIKit
import SwiftUI
import Messages

@objc(MessagesViewController)
final class MessagesViewController: MSMessagesAppViewController {
    private let store = ChartStore()
    private var hosting: UIHostingController<ChartScreen>?
    private var loadTask: Task<Void, Never>?

    override func willBecomeActive(with conversation: MSConversation) {
        super.willBecomeActive(with: conversation)
        render()
        loadTask?.cancel()
        let messageURL = conversation.selectedMessage?.url
        loadTask = Task { await store.load(messageURL: messageURL) }
    }

    override func didSelect(_ message: MSMessage, conversation: MSConversation) {
        super.didSelect(message, conversation: conversation)
        loadTask?.cancel()
        loadTask = Task { await store.load(messageURL: message.url) }
        render()
    }

    override func didTransition(to presentationStyle: MSMessagesAppPresentationStyle) {
        super.didTransition(to: presentationStyle)
        render()
    }

    override func willResignActive(with conversation: MSConversation) {
        loadTask?.cancel()
        super.willResignActive(with: conversation)
    }

    override func contentSizeThatFits(_ size: CGSize) -> CGSize {
        CGSize(width: min(size.width, 380), height: min(size.height, 405))
    }

    private func render() {
        let inline = presentationStyle == .transcript
        let screen = ChartScreen(store: store, confirmation: store.confirmation, compact: inline,
            expand: inline ? { [weak self] in self?.requestPresentationStyle(.expanded) } : nil,
            insert: inline ? nil : { [weak self] in self?.insertChart() })
        if let hosting { hosting.rootView = screen; return }
        let host = UIHostingController(rootView: screen)
        addChild(host); view.addSubview(host.view)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        host.didMove(toParent: self); hosting = host
    }

    private func insertChart() {
        guard let conversation = activeConversation, store.snapshot != nil else { return }
        do {
            // Stage only. The user presses Send in Messages.
            let session = conversation.selectedMessage?.session ?? MSSession()
            let message = MSMessage(session: session)
            message.url = try ChartConfiguration.messageURL(session: UUID(), component: store.component)
            message.summaryText = "\(store.component.title): Microsoft FY2025 revenue — Fiscal, USD; restated; Q4 calculated"
            let alternate = MSMessageTemplateLayout()
            alternate.image = UIImage(named: "revenue-preview")
            alternate.caption = "\(store.component.title) · Microsoft FY2025 revenue"
            alternate.subcaption = "Fiscal · USD · Restated · Q4 calculated"
            message.layout = MSMessageLiveLayout(alternateLayout: alternate)
            conversation.insert(message) { [weak self] error in
                guard error != nil else { return }
                Task { @MainActor in self?.showError("Messages could not insert the chart.") }
            }
        } catch { showError(error.localizedDescription) }
    }

    private func showError(_ message: String) {
        let alert = UIAlertController(title: "Chart not inserted", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
