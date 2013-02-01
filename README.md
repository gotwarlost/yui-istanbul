yui-istanbul
============

YUI adaptor for istanbul factored out into its own module.

The `index.js` file can be used as the `--post-require-hook` argument to `istanbul`
in order to hook the YUI loader for coverage.

Note that this module neither depends on `istanbul` nor on `YUI` by design.
It only provides the hook function.

Test runners for YUI tests (e.g. `ytestrunner`) can depend on this module in order
to provide coverage for YUI tests.


