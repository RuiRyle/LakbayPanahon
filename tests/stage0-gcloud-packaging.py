"""Offline packaging proof using the pinned CLI's actual source zip routine.

No deploy command, API client, credentials, upload or live resource is used.
"""
import hashlib
import json
import os
import pathlib
import sys
import zipfile

root = pathlib.Path(__file__).resolve().parent.parent
os.environ['CLOUDSDK_CONFIG'] = str(root / 'build/gcloud-offline-config')
os.environ['CLOUDSDK_AUTH_DISABLE_CREDENTIALS'] = 'true'
os.environ['CLOUDSDK_COMPONENT_MANAGER_DISABLE_UPDATE_CHECK'] = 'true'
sys.path.insert(0, str(root / 'build/google-cloud-cli-592/google-cloud-sdk/lib'))
sys.path.insert(0, str(root / 'build/google-cloud-cli-592/google-cloud-sdk/lib/third_party'))
from googlecloudsdk.command_lib.functions import source_util

results = []
for rollback in (False, True):
    source = root / 'build/priority3-stage0-release' / ('rollback/functions' if rollback else 'functions')
    output = root / 'build/stage0-upload-proof' / ('rollback' if rollback else 'release')
    output.mkdir(parents=True, exist_ok=True)
    source_util.ValidateDirectoryHasRequiredRuntimeFiles(str(source), 'nodejs22')
    archive = source_util.CreateSourcesZipFile(str(output), str(source), ignore_file='.gcloudignore', enforce_size_limit=True)
    with zipfile.ZipFile(archive) as package:
        files = sorted(name for name in package.namelist() if not name.endswith('/'))
        assert len(files) == (4 if rollback else 13), files
        assert 'index.js' in files and 'package.json' in files and 'package-lock.json' in files
        for name in files:
            assert package.read(name) == (source / name).read_bytes()
        assert not any('node_modules' in name or '..' in name for name in files)
    results.append({'rollback': rollback, 'files': files, 'sha256': hashlib.sha256(pathlib.Path(archive).read_bytes()).hexdigest()})
(root / 'docs/validation/priority-3-stage0-actual-packaging-2026-11-07.json').write_text(json.dumps({'status': 'pass', 'mode': 'offline-actual-gcloud-zip-routine', 'packages': results}, indent=2), encoding='utf-8')
print(json.dumps({'status': 'pass', 'packageFileCounts': [len(p['files']) for p in results]}))
