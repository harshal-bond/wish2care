/**
 * Start Metro for a USB-connected Android device.
 *
 * Why this exists rather than `expo start --localhost`:
 *
 *   --localhost binds Metro to the loopback *hostname*, which Node resolves to
 *   ::1 (IPv6) on Windows. `adb reverse tcp:8081 tcp:8081` forwards to IPv4
 *   127.0.0.1, so adb accepts the device's connection, fails to connect
 *   locally, and closes it immediately. The dev client then reports
 *   "unexpected end of stream" with limit=0 - zero bytes read - which looks
 *   like a network problem and is not one.
 *
 * So: let Metro bind every interface (dual-stack, IPv4 included) and only
 * override the hostname it advertises. The device loads the bundle from
 * localhost:8081 and the API from localhost:3000, both over the cable.
 *
 * This is the only workable mode on an IPv6-only mobile network, where the
 * device has no IPv4 address and cannot reach the machine's LAN IP at all.
 */
import { spawn, spawnSync } from 'node:child_process';

const PORTS = [8081, 3000]; // Metro, backend API

for (const port of PORTS) {
  const r = spawnSync('adb', ['reverse', `tcp:${port}`, `tcp:${port}`], {
    stdio: ['ignore', 'ignore', 'pipe'],
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.error || r.status !== 0) {
    console.error(
      `\nCould not set up the adb reverse tunnel for port ${port}.\n` +
        `${(r.stderr || r.error?.message || '').trim()}\n\n` +
        'Check that the device is connected and authorised: adb devices\n'
    );
    process.exit(1);
  }
  console.log(`adb reverse tcp:${port} -> localhost:${port}`);
}

// Advertise localhost; bind everything. Both halves matter.
spawn('npx', ['expo', 'start'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: 'localhost' },
}).on('exit', (code) => process.exit(code ?? 0));
