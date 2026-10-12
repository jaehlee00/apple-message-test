"""Generate two explicitly separate iMessage packaging paths; requires Xcode to build."""
from pathlib import Path
import argparse
import hashlib
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1] / 'ios'
SHARED = ['model', 'view', 'component', 'dataView', 'confirmationModel', 'confirmationView']


def generate(standalone, include_clip=False):
    folder = 'StandaloneMessages' if standalone else 'AppWithMessages'
    name = 'ChartMessagesStandalone' if standalone else 'ChartConcierge'
    extension_name = 'StandaloneChartMessages' if standalone else 'ChartMessages'
    bundle = 'com.example.ChartConciergeMessages' if standalone else 'com.example.ChartConcierge'
    base = ROOT / folder
    project = base / (name + '.xcodeproj')
    schemes = project / 'xcshareddata/xcschemes'
    schemes.mkdir(parents=True, exist_ok=True)
    objects = {}

    def oid(label):
        return hashlib.sha256((folder + ':' + label).encode()).hexdigest()[:24].upper()

    def add(label, content):
        objects[oid(label)] = content
        return oid(label)

    def q(value):
        return json.dumps(value)

    def seq(values):
        return '(' + ', '.join(values) + (',' if values else '') + ')'

    files = {
        'model': ('../Shared/ChartModel.swift', 'sourcecode.swift'),
        'view': ('../Shared/RevenueChartView.swift', 'sourcecode.swift'),
        'component': ('../Shared/NativeComponent.swift', 'sourcecode.swift'),
        'dataView': ('../Shared/RevenueDataView.swift', 'sourcecode.swift'),
        'confirmationModel': ('../Shared/ConfirmationModel.swift', 'sourcecode.swift'),
        'confirmationView': ('../Shared/ConfirmationView.swift', 'sourcecode.swift'),
        'extension': ('../MessagesExtension/MessagesViewController.swift', 'sourcecode.swift'),
        'snapshot': ('../Shared/chart-manifest.json', 'text.json'),
        'image': ('../Shared/revenue-preview.png', 'image.png'),
        'appinfo': ('App/Info.plist', 'text.plist.xml'),
        'extinfo': ('MessagesExtension/Info.plist', 'text.plist.xml'),
    }
    if not standalone:
        files.update({
            'experience': ('../Shared/NativeExperienceView.swift', 'sourcecode.swift'),
            'app': ('App/ChartConciergeApp.swift', 'sourcecode.swift'),
        })
    if include_clip:
        files.update({
            'clip': ('../AppClip/ChartClipApp.swift', 'sourcecode.swift'),
            'clipinfo': ('../AppClip/Info.plist', 'text.plist.xml'),
            'clipentitlements': ('../AppClip/ChartClip.entitlements', 'text.plist.entitlements'),
            'appentitlements': ('App/ChartConcierge.entitlements', 'text.plist.entitlements'),
        })
    targets = ['app', 'ext'] + (['clip'] if include_clip else [])
    names = {'app': name, 'ext': extension_name, 'clip': 'ChartClip'}
    products = {
        'app': 'com.apple.product-type.application.messages' if standalone else 'com.apple.product-type.application',
        'ext': 'com.apple.product-type.app-extension.messages',
        'clip': 'com.apple.product-type.application.on-demand-install-capable',
    }
    for key, (path, typ) in files.items():
        assert (base / path).is_file(), path
        add(key, f'isa = PBXFileReference; lastKnownFileType = {q(typ)}; path = {q(path)}; sourceTree = "<group>";')
    for target in targets:
        suffix = '.appex' if target == 'ext' else '.app'
        typ = 'wrapper.app-extension' if target == 'ext' else 'wrapper.application'
        add(target + 'product', f'isa = PBXFileReference; explicitFileType = {q(typ)}; includeInIndex = 0; path = {q(names[target] + suffix)}; sourceTree = BUILT_PRODUCTS_DIR;')
    add('products', f'isa = PBXGroup; children = {seq([oid(t + "product") for t in targets])}; name = Products; sourceTree = "<group>";')
    add('rootgroup', f'isa = PBXGroup; children = {seq([oid(k) for k in files] + [oid("products")])}; sourceTree = "<group>";')

    sources = {'app': [] if standalone else SHARED + ['experience', 'app'], 'ext': SHARED + ['extension'], 'clip': SHARED + ['experience', 'clip']}
    for target in targets:
        # The standalone top-level app is Xcode's Messages wrapper. It has no @main,
        # no Swift sources and no normal app scene. All UI lives in its extension.
        resources = [] if target == 'app' and standalone else ['snapshot', 'image']
        for key in sources[target] + resources:
            add(target + key, f'isa = PBXBuildFile; fileRef = {oid(key)};')
        for phase, keys in [('sources', sources[target]), ('resources', resources), ('frameworks', [])]:
            isa = {'sources': 'PBXSourcesBuildPhase', 'resources': 'PBXResourcesBuildPhase', 'frameworks': 'PBXFrameworksBuildPhase'}[phase]
            add(target + phase, f'isa = {isa}; buildActionMask = 2147483647; files = {seq([oid(target + k) for k in keys])}; runOnlyForDeploymentPostprocessing = 0;')
        for config in ['Debug', 'Release']:
            settings = {
                'CODE_SIGN_STYLE': 'Automatic', 'DEVELOPMENT_TEAM': '', 'GENERATE_INFOPLIST_FILE': 'NO',
                'IPHONEOS_DEPLOYMENT_TARGET': '17.0', 'SWIFT_VERSION': '5.0', 'TARGETED_DEVICE_FAMILY': '1,2',
                'PRODUCT_NAME': '$(TARGET_NAME)', 'SDKROOT': 'iphoneos', 'SUPPORTED_PLATFORMS': 'iphoneos iphonesimulator',
                'SUPPORTS_MACCATALYST': 'NO',
                'INFOPLIST_FILE': {'app': 'App/Info.plist', 'ext': 'MessagesExtension/Info.plist', 'clip': '../AppClip/Info.plist'}[target],
                'PRODUCT_BUNDLE_IDENTIFIER': bundle + {'app': '', 'ext': '.Messages', 'clip': '.Clip'}[target],
                'SWIFT_OPTIMIZATION_LEVEL': '-Onone' if config == 'Debug' else '-O',
                'LD_RUNPATH_SEARCH_PATHS': '$(inherited) @executable_path/Frameworks' + (' @executable_path/../../Frameworks' if target == 'ext' else ''),
            }
            if target == 'ext':
                settings.update({'APPLICATION_EXTENSION_API_ONLY': 'YES', 'SKIP_INSTALL': 'YES'})
            if target == 'app':
                settings['ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES'] = 'YES'
            if target == 'app' and include_clip:
                settings['CODE_SIGN_ENTITLEMENTS'] = 'App/ChartConcierge.entitlements'
            if target == 'clip':
                settings.update({'CODE_SIGN_ENTITLEMENTS': '../AppClip/ChartClip.entitlements', 'SKIP_INSTALL': 'YES'})
            body = ' '.join(f'{k} = {q(v)};' for k, v in settings.items())
            add(target + config, f'isa = XCBuildConfiguration; buildSettings = {{ {body} }}; name = {config};')
        add(target + 'configs', f'isa = XCConfigurationList; buildConfigurations = {seq([oid(target + "Debug"), oid(target + "Release")])}; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')

    for child in ['ext'] + (['clip'] if include_clip else []):
        add(child + 'embedbuild', f'isa = PBXBuildFile; fileRef = {oid(child + "product")}; settings = {{ ATTRIBUTES = (RemoveHeadersOnCopy,); }};')
        destination, path, title = (13, '', 'Embed App Extensions') if child == 'ext' else (16, '$(CONTENTS_FOLDER_PATH)/AppClips', 'Embed App Clips')
        add(child + 'embed', f'isa = PBXCopyFilesBuildPhase; buildActionMask = 2147483647; dstPath = {q(path)}; dstSubfolderSpec = {destination}; files = ({oid(child + "embedbuild")},); name = {q(title)}; runOnlyForDeploymentPostprocessing = 0;')
        add(child + 'proxy', f'isa = PBXContainerItemProxy; containerPortal = {oid("project")}; proxyType = 1; remoteGlobalIDString = {oid(child + "target")}; remoteInfo = {q(names[child])};')
        add(child + 'dependency', f'isa = PBXTargetDependency; target = {oid(child + "target")}; targetProxy = {oid(child + "proxy")};')
    children = ['ext'] + (['clip'] if include_clip else [])
    for target in targets:
        phases = [oid(target + s) for s in ['sources', 'frameworks', 'resources']]
        if target == 'app':
            phases += [oid(child + 'embed') for child in children]
        dependencies = [oid(child + 'dependency') for child in children] if target == 'app' else []
        add(target + 'target', f'isa = PBXNativeTarget; buildConfigurationList = {oid(target + "configs")}; buildPhases = {seq(phases)}; buildRules = (); dependencies = {seq(dependencies)}; name = {q(names[target])}; productName = {q(names[target])}; productReference = {oid(target + "product")}; productType = {q(products[target])};')
    for config in ['Debug', 'Release']:
        add('project' + config, f'isa = XCBuildConfiguration; buildSettings = {{ CLANG_ENABLE_MODULES = YES; CLANG_ENABLE_OBJC_ARC = YES; ENABLE_STRICT_OBJC_MSGSEND = YES; }}; name = {config};')
    add('projectconfigs', f'isa = XCConfigurationList; buildConfigurations = {seq([oid("projectDebug"), oid("projectRelease")])}; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;')
    add('project', f'isa = PBXProject; attributes = {{ LastUpgradeCheck = 1600; BuildIndependentTargetsInParallel = YES; }}; buildConfigurationList = {oid("projectconfigs")}; compatibilityVersion = "Xcode 14.0"; developmentRegion = en; hasScannedForEncodings = 0; knownRegions = (en,Base,); mainGroup = {oid("rootgroup")}; productRefGroup = {oid("products")}; projectDirPath = ""; projectRoot = ""; targets = {seq([oid(t + "target") for t in targets])};')
    output = '// !$*UTF8*$!\n{\n archiveVersion = 1; classes = {}; objectVersion = 56;\n objects = {\n'
    output += '\n'.join(f'  {key} = {{ {value} }};' for key, value in objects.items())
    output += f'\n }};\n rootObject = {oid("project")};\n}}\n'
    (project / 'project.pbxproj').write_text(output)

    def write_scheme(target, launch):
        scheme = ET.Element('Scheme', LastUpgradeVersion='1600', version='1.3')
        build = ET.SubElement(scheme, 'BuildAction', parallelizeBuildables='YES', buildImplicitDependencies='YES')
        entries = ET.SubElement(build, 'BuildActionEntries')
        entry = ET.SubElement(entries, 'BuildActionEntry', **{k: 'YES' for k in ['buildForTesting', 'buildForRunning', 'buildForProfiling', 'buildForArchiving', 'buildForAnalyzing']})

        def reference(parent):
            ET.SubElement(parent, 'BuildableReference', BuildableIdentifier='primary', BlueprintIdentifier=oid(target + 'target'), BuildableName=names[target] + '.app', BlueprintName=names[target], ReferencedContainer='container:' + project.name)

        reference(entry)
        # Standalone is intentionally build/archive only. Configure an extension
        # Run scheme with Messages as its host on the actual Xcode installation.
        if launch:
            action = ET.SubElement(scheme, 'LaunchAction', buildConfiguration='Debug', selectedDebuggerIdentifier='Xcode.DebuggerFoundation.Debugger.LLDB', selectedLauncherIdentifier='Xcode.IDEFoundation.Launcher.LLDB', launchStyle='0', useCustomWorkingDirectory='NO', ignoresPersistentStateOnLaunch='NO', debugDocumentVersioning='YES', debugServiceExtension='internal', allowLocationSimulation='YES')
            reference(ET.SubElement(action, 'BuildableProductRunnable', runnableDebuggingMode='0'))
        ET.SubElement(scheme, 'AnalyzeAction', buildConfiguration='Debug')
        ET.SubElement(scheme, 'ArchiveAction', buildConfiguration='Release', revealArchiveInOrganizer='YES')
        ET.indent(scheme)
        ET.ElementTree(scheme).write(schemes / (names[target] + '.xcscheme'), encoding='UTF-8', xml_declaration=True)

    write_scheme('app', not standalone)
    if include_clip:
        write_scheme('clip', True)
    else:
        optional = schemes / 'ChartClip.xcscheme'
        if optional.exists():
            optional.unlink()  # This generator's optional scheme only.
    print(f'{folder}/{project.name}: ' + ', '.join(names[t] for t in targets))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--include-app-clip', action='store_true', help='Add optional Clip to AppWithMessages only; never to StandaloneMessages')
    args = parser.parse_args()
    generate(standalone=True)
    generate(standalone=False, include_clip=args.include_app_clip)
    print('Source projects generated. Compilation, signing and Messages host testing require Xcode on macOS.')
