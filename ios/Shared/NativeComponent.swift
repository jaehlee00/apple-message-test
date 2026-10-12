import Foundation

enum NativeComponent: String, CaseIterable, Identifiable {
    case bar, line, pie, data, confirmation
    var id: String { rawValue }
    var title: String {
        switch self {
        case .bar: return "Bar chart"
        case .line: return "Line chart"
        case .pie: return "Pie chart"
        case .data: return "Data display"
        case .confirmation: return "Confirm / Cancel"
        }
    }
}

struct ComponentRoute {
    let session: UUID
    let component: NativeComponent
}
