"""Package Tab Shelf and optionally upload/submit it using Chrome Web Store v2."""
import argparse
import json
import os
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = ['manifest.json', 'background.js', 'core.js', 'app.js', 'index.html',
         'style.css', 'icons/icon16.png', 'icons/icon32.png', 'icons/icon48.png', 'icons/icon128.png']


def package(source, target, tag=''):
    version = json.loads((source / 'manifest.json').read_text())['version']
    if tag and tag != 'tab-shelf-v' + version:
        raise ValueError('Release tag must match the manifest version: tab-shelf-v' + version)
    target.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in FILES:
            archive.write(source / name, name)
    return version


def request(url, data=None, headers=None):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers or {}), timeout=90) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Never log response bodies: OAuth errors may contain sensitive data.
        raise RuntimeError('Google API returned HTTP ' + str(error.code) + '; inspect the developer dashboard before retrying.') from None
    except (urllib.error.URLError, TimeoutError, ValueError):
        raise RuntimeError('Google API response unavailable; inspect the developer dashboard before retrying.') from None


def publish(archive, version, submit, call=request, sleep=time.sleep):
    keys = ['CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN', 'CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID']
    config = {key: os.environ.get(key, '') for key in keys}
    missing = [key for key in keys if not config[key]]
    if missing:
        raise ValueError('Configure GitHub secrets/variables: ' + ', '.join(missing))
    for key in keys[-2:]:
        if not re.fullmatch(r'[A-Za-z0-9_-]+', config[key]):
            raise ValueError('Invalid identifier: ' + key)
    token = call('https://oauth2.googleapis.com/token', urllib.parse.urlencode({
        'client_id': config['CWS_CLIENT_ID'], 'client_secret': config['CWS_CLIENT_SECRET'],
        'refresh_token': config['CWS_REFRESH_TOKEN'], 'grant_type': 'refresh_token'
    }).encode(), {'Content-Type': 'application/x-www-form-urlencoded'})['access_token']
    headers = {'Authorization': 'Bearer ' + token}
    item = 'publishers/' + config['CWS_PUBLISHER_ID'] + '/items/' + config['CWS_EXTENSION_ID']
    base = 'https://chromewebstore.googleapis.com/'
    result = call(base + 'upload/v2/' + item + ':upload', archive.read_bytes(),
                  dict(headers, **{'Content-Type': 'application/zip'}))
    if result.get('crxVersion') and result['crxVersion'] != version:
        raise RuntimeError('Uploaded version mismatch; submission stopped.')
    state = result.get('uploadState')
    for _ in range(30):
        if state != 'IN_PROGRESS':
            break
        sleep(10)
        state = call(base + 'v2/' + item + ':fetchStatus', headers=headers).get('lastAsyncUploadState')
    if state != 'SUCCEEDED':
        raise RuntimeError('Upload did not succeed; submission stopped. Check the developer dashboard.')
    if not submit:
        return 'Upload succeeded. Draft only; not submitted for review.'
    result = call(base + 'v2/' + item + ':publish', json.dumps({
        'publishType': 'DEFAULT_PUBLISH', 'skipReview': False, 'blockOnWarnings': True
    }).encode(), dict(headers, **{'Content-Type': 'application/json'}))
    state = result.get('state', 'UNKNOWN')
    if state not in {'PENDING_REVIEW', 'PUBLISHED', 'PUBLISHED_TO_TESTERS', 'STAGED'}:
        raise RuntimeError('Submission needs verification in the developer dashboard; no automatic retry.')
    return 'Submission accepted. Store state: ' + state + '. Google review may still be pending.'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--tag', default='')
    parser.add_argument('--mode', choices=['build', 'upload', 'submit'], default='build')
    args = parser.parse_args()
    archive = ROOT / 'dist/tab-shelf-webstore.zip'
    version = package(ROOT / 'tab-shelf/extension', archive, args.tag)
    print('Packaged Tab Shelf ' + version)
    if args.mode != 'build':
        print(publish(archive, version, args.mode == 'submit'))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, KeyError) as error:
        raise SystemExit(str(error)) from None
