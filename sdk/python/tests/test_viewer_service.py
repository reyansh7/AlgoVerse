"""Tests for the embedded Visualization Service."""

from __future__ import annotations

import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

from algoverse.viewer import service as viewer_service


SAMPLE = {
    "version": "0.1",
    "language": "python",
    "algorithm": "demo",
    "metadata": {"initial": {"array": [3, 1, 2]}},
    "events": [
        {
            "type": "call",
            "timestamp": 1,
            "data": {"frame": "demo"},
        },
        {
            "type": "swap",
            "timestamp": 2,
            "data": {"i": 0, "j": 1},
        },
    ],
}


class ViewerServiceTests(unittest.TestCase):
    def setUp(self) -> None:
        viewer_service._latest_trace = None  # noqa: SLF001
        self._httpd = ThreadingHTTPServer(
            ("127.0.0.1", 0),
            viewer_service._ViewerHandler,  # noqa: SLF001
        )
        self._port = self._httpd.server_address[1]
        self._thread = threading.Thread(target=self._httpd.serve_forever, daemon=True)
        self._thread.start()

    def tearDown(self) -> None:
        self._httpd.shutdown()
        self._httpd.server_close()

    def _get(self, path: str):
        url = f"http://127.0.0.1:{self._port}{path}"
        with urllib.request.urlopen(url, timeout=2) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def _post(self, path: str, body: dict):
        url = f"http://127.0.0.1:{self._port}{path}"
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_health(self) -> None:
        status, payload = self._get("/health")
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])

    def test_load_and_fetch_trace(self) -> None:
        status, payload = self._post("/api/load-trace", {"trace": SAMPLE})
        self.assertEqual(status, 200)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["url"], "/")

        status, doc = self._get("/api/trace")
        self.assertEqual(status, 200)
        self.assertEqual(doc["algorithm"], "demo")
        self.assertEqual(len(doc["events"]), 2)

    def test_trace_missing_before_load(self) -> None:
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self._get("/api/trace")
        self.assertEqual(ctx.exception.code, 404)

    def test_reject_bad_body(self) -> None:
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            self._post("/api/load-trace", {"nope": 1})
        self.assertEqual(ctx.exception.code, 400)

    def test_index_served(self) -> None:
        url = f"http://127.0.0.1:{self._port}/"
        with urllib.request.urlopen(url, timeout=2) as resp:
            self.assertEqual(resp.status, 200)
            html = resp.read().decode("utf-8")
        self.assertIn("AlgoVerse", html)
        self.assertIn("player.js", html)


if __name__ == "__main__":
    unittest.main()
