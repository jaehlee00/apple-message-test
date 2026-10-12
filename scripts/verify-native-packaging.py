"""Structural checks only. This does not compile Swift or replace xcodebuild."""
from pathlib import Path
import json
import plistlib
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1]


def verify(folder, name, standalone):
    base = root / 'ios' / folder
    project = base / (name + '.xcodeproj')
    content = (project / 'project.pbxproj').read_text()
    objects = dict(re.findall(r'^\s+([A-F0-9]{24}) = \{ (.*?) \};$', content, re.M))
    references = set(re.findall(r'\b[A-F0-9]{24}\b', content))
    assert references <= objects.keys(), references - objects.keys()
    targets = [value for value in objects.values() if value.startswith('isa = PBXNativeTarget;')]
    expected_app_type = 'com.apple.product-type.application.messages' if standalone else 'com.apple.product-type.application'
    app_target = next(value for value in targets if f'name = "{name}";' in value)
    assert f'productType = "{expected_app_type}";' in app_target
    extensions = [value for value in targets if 'productType = "com.apple.product-type.app-extension.messages"' in value]
    assert len(extensions) == 1
    assert len(targets) in ([2] if standalone else [2, 3])
    has_clip = len(targets) == 3
    assert has_clip == ('Embed App Clips' in content)
    app_plist = plistlib.loads((base / 'App/Info.plist').read_bytes())
    ext_plist = plistlib.loads((base / 'MessagesExtension/Info.plist').read_bytes())
    assert bool(app_plist.get('LSApplicationLaunchProhibited')) == standalone
    assert ext_plist['NSExtension']['NSExtensionPointIdentifier'] == 'com.apple.message-payload-provider'
    for value in objects.values():
        if value.startswith('isa = PBXFileReference;') and 'sourceTree = "<group>";' in value:
            rel = json.loads(re.search(r'path = (".*?");', value).group(1))
            assert (base / rel).is_file(), rel
        if value.startswith('isa = XCBuildConfiguration;'):
            for key in ['INFOPLIST_FILE', 'CODE_SIGN_ENTITLEMENTS']:
                match = re.search(r'(?<![A-Z_])' + key + r' = (".*?");', value)
                if match:
                    assert (base / json.loads(match.group(1))).is_file()
    phases = re.search(r'buildPhases = \((.*?)\);', app_target).group(1)
    app_sources = next(objects[oid] for oid in re.findall(r'[A-F0-9]{24}', phases) if objects[oid].startswith('isa = PBXSourcesBuildPhase;'))
    assert ('files = ();' in app_sources) == standalone
    if standalone:
        assert 'ChartConciergeApp.swift' not in content and 'NativeExperienceView.swift' not in content
        assert 'AppClip' not in content and 'CODE_SIGN_ENTITLEMENTS' not in content
    else:
        assert 'ChartConciergeApp.swift' in content and 'NativeExperienceView.swift' in content
    scheme = ET.parse(project / 'xcshareddata/xcschemes' / (name + '.xcscheme')).getroot()
    assert (scheme.find('LaunchAction') is None) == standalone
    for scheme_path in (project / 'xcshareddata/xcschemes').glob('*.xcscheme'):
        for reference in ET.parse(scheme_path).getroot().iter('BuildableReference'):
            assert reference.attrib['BlueprintIdentifier'] in objects
    bundle = 'com.example.ChartConciergeMessages' if standalone else 'com.example.ChartConcierge'
    env_name = 'standalone.env.example' if standalone else 'app-with-messages.env.example'
    env = (root / 'twilio/config' / env_name).read_text()
    assert 'APPLE_EXTENSION_BUNDLE_ID=' + bundle + '.Messages\n' in env
    assert 'AMB_ENABLE_LIVE_DELIVERY=false\n' in env
    assert 'APPLE_TEAM_ID=\n' in env and 'APPLE_APP_STORE_ID=\n' in env
    assert f'PRODUCT_BUNDLE_IDENTIFIER = "{bundle}.Messages";' in content
    print(f'PASS {folder}: {len(targets)} targets, product types, source membership, plists, references, schemes and identity template')


verify('StandaloneMessages', 'ChartMessagesStandalone', True)
verify('AppWithMessages', 'ChartConcierge', False)
assert (root / 'ios/Shared/chart-manifest.json').read_bytes() == (root / 'twilio/assets/chart-manifest.private.json').read_bytes()
for path in (root / 'ios').rglob('*.plist'):
    plistlib.loads(path.read_bytes())
for path in (root / 'ios').rglob('*.entitlements'):
    plistlib.loads(path.read_bytes())
print('PASS all property lists and identical native/server snapshot. Swift compilation remains unverified.')
