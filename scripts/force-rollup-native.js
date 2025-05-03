// This file is never executed.
// It only forces Cloudflare to install the optional Rollup native module.
try {
    require('@rollup/rollup-linux-x64-gnu');
  } catch (_) {}
  