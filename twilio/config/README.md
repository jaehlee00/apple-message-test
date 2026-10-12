# Select one native product identity

Copy exactly one template to `twilio/.env` for your chosen test environment:

- `standalone.env.example`: path A, Messages-only product.
- `app-with-messages.env.example`: path B, normal app plus extension.

The example bundle identifiers match their Xcode projects. Replace them with your registered identifiers, and supply the matching real Team ID and App Store ID. The wrapper/app ID is included for reference; current native-message construction consumes the extension ID, Team ID and App Store ID. No App Clip ID is needed.

For concurrent testing use separate Twilio service environments with separately configured origins and identity. This server selects one product identity per environment. Keep `AMB_ENABLE_LIVE_DELIVERY=false` until the account-specific contract and authorized test setup are verified. These files are configuration examples, not real account credentials or financial evidence.
