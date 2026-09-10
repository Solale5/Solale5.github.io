import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
from tab_shelf_release import FILES, ROOT, package, publish


class ReleaseTests(unittest.TestCase):
    def test_package_has_root_manifest_and_only_runtime(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory) / 'extension.zip'
            version = package(ROOT / 'tab-shelf/extension', target)
            with zipfile.ZipFile(target) as archive:
                self.assertEqual(set(archive.namelist()), set(FILES))
                self.assertEqual(json.loads(archive.read('manifest.json'))['version'], version)
            with self.assertRaises(ValueError):
                package(ROOT / 'tab-shelf/extension', target, 'tab-shelf-v0.0.0')

    def test_missing_configuration_never_calls_network(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError):
                publish(None, '1.2.1', True, call=lambda *a, **k: self.fail('Network called'))

    def exercise(self, upload, status=None, submit=True):
        calls = []
        responses = [{'access_token': 'fake'}, upload]
        if status:
            responses.append({'lastAsyncUploadState': status})
        responses.append({'state': 'PENDING_REVIEW'})
        def call(url, *args, **kwargs):
            calls.append(url)
            return responses.pop(0)
        config = {key: 'fake' for key in ['CWS_CLIENT_ID', 'CWS_CLIENT_SECRET', 'CWS_REFRESH_TOKEN', 'CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID']}
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, config):
            archive = Path(directory) / 'archive.zip'
            archive.write_bytes(b'fake zip')
            try:
                return publish(archive, '1.2.1', submit, call=call, sleep=lambda _: None), calls
            except RuntimeError:
                self.assertFalse(any(url.endswith(':publish') for url in calls))
                raise

    def test_failed_upload_blocks_submission(self):
        with self.assertRaises(RuntimeError):
            self.exercise({'uploadState': 'FAILED'})

    def test_async_upload_then_submit(self):
        message, calls = self.exercise({'uploadState': 'IN_PROGRESS'}, 'SUCCEEDED')
        self.assertIn('PENDING_REVIEW', message)
        self.assertTrue(calls[-1].endswith(':publish'))

    def test_draft_does_not_submit(self):
        message, calls = self.exercise({'uploadState': 'SUCCEEDED', 'crxVersion': '1.2.1'}, submit=False)
        self.assertIn('Draft only', message)
        self.assertFalse(any(url.endswith(':publish') for url in calls))

    def test_version_mismatch_blocks_submission(self):
        with self.assertRaises(RuntimeError):
            self.exercise({'uploadState': 'SUCCEEDED', 'crxVersion': '9.9.9'})
