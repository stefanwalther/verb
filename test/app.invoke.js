'use strict';

require('mocha');
var path = require('path');
var assert = require('assert');
var gm = require('global-modules');
var commands = require('spawn-commands');
var utils = require('generator-util');
require('generate-foo/generator.js');
var Verb = require('..');
var verb;

var fixture = path.resolve.bind(path, __dirname, 'fixtures/generators');
function install(name, cb) {
  commands({
    args: ['install', '-g', '--silent', name],
    cmd: 'npm'
  }, cb);
}

describe('.invoke', function() {
  before(function(cb) {
    if (!utils.exists(path.resolve(gm, 'generate-bar'))) {
      install('generate-bar', cb);
    } else {
      cb();
    }
  });

  beforeEach(function() {
    verb = new Verb({prefix: 'generate'});
  });
  
  describe('invoke generators', function(cb) {
    it('should invoke an instance', function(cb) {
      verb.register('foo', function(app) {
        var bar = app.getGenerator('bar');
        app.invoke(bar);

        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        assert(app.tasks.hasOwnProperty('c'));
        cb();
      });

      verb.register('bar', function(app) {
        app.task('a', function() {});
        app.task('b', function() {});
        app.task('c', function() {});
      });

      verb.getGenerator('foo');
    });

    it('should invoke a named generator', function(cb) {
      verb.register('foo', function(app) {
        app.invoke('bar');

        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        assert(app.tasks.hasOwnProperty('c'));
        cb();
      });

      verb.register('bar', function(app) {
        app.task('a', function() {});
        app.task('b', function() {});
        app.task('c', function() {});
      });

      verb.getGenerator('foo');
    });
  });

  describe('extend generators', function(cb) {
    it('should extend a generator with a generator invoked by name', function(cb) {
      verb.register('foo', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('bar');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.register('bar', function(app) {
        app.task('a', function() {});
        app.task('b', function() {});
        app.task('c', function() {});
      });

      verb.getGenerator('foo');
    });

    it('should extend a generator with a generator invoked by alias', function(cb) {
      verb.register('foo', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('qux');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.register('generate-qux', function(app) {
        app.task('a', function() {});
        app.task('b', function() {});
        app.task('c', function() {});
      });

      verb.getGenerator('foo');
    });

    it('should extend with a generator invoked by filepath', function(cb) {
      verb.register('foo', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke(fixture('qux'));
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.getGenerator('foo');
    });

    it('should extend with a generator invoked from node_modules by name', function(cb) {
      verb.register('abc', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('generate-foo');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.getGenerator('abc');
    });
    
    it('should extend with a generator invoked from node_modules by alias', function(cb) {
      verb.prefix = 'generate';
      verb.register('abc', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('foo');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.getGenerator('abc');
    });

    it('should extend with a generator invoked from global modules by name', function(cb) {
      verb.register('zzz', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);
        app.invoke('generate-bar');

        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.getGenerator('zzz');
    });

    it('should extend with a generator invoked from global modules by alias', function(cb) {
      verb.register('zzz', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('bar');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.getGenerator('zzz');
    });
  });

  describe('sub-generators', function(cb) {
    it('should invoke sub-generators', function(cb) {
      verb.register('foo', function(app) {
        app.register('one', function(app) {
          app.task('a', function() {});
        });
        app.register('two', function(app) {
          app.task('b', function() {});
        });

        app.invoke('one');
        app.invoke('two');

        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        cb();
      });

      verb.getGenerator('foo');
    });
    
    it('should invoke a sub-generator on the verb instance', function(cb) {
      verb.register('foo', function(app) {
        app.invoke('bar.sub');
        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        assert(app.tasks.hasOwnProperty('c'));
        cb();
      });

      verb.register('bar', function(app) {
        app.register('sub', function(sub) {
          sub.task('a', function() {});
          sub.task('b', function() {});
          sub.task('c', function() {});
        });
      });

      verb.getGenerator('foo');
    });

    it('should invoke a sub-generator from node_modules by name', function(cb) {
      verb.register('abc', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('xyz');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.register('xyz', function(app) {
        app.invoke('generate-foo');
      });

      verb.getGenerator('abc');
    });

    it('should invoke a sub-generator from node_modules by alias', function(cb) {
      verb.register('abc', function(app) {
        assert(!app.tasks.a);
        assert(!app.tasks.b);
        assert(!app.tasks.c);

        app.invoke('xyz');
        assert(app.tasks.a);
        assert(app.tasks.b);
        assert(app.tasks.c);
        cb();
      });

      verb.register('xyz', function(app) {
        app.invoke('foo');
      });

      verb.getGenerator('abc');
    });

    it('should invoke an array of sub-generators', function(cb) {
      verb.register('foo', function(app) {
        app.register('one', function(app) {
          app.task('a', function() {});
        });
        app.register('two', function(app) {
          app.task('b', function() {});
        });

        app.invoke(['one', 'two']);

        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        cb();
      });

      verb.getGenerator('foo');
    });

    it('should invoke sub-generators from sub-generators', function(cb) {
      verb.register('foo', function(app) {
        app.register('one', function(sub) {
          sub.register('a', function(a) {
            a.task('a', function() {});
          });
        });

        app.register('two', function(sub) {
          sub.register('a', function(a) {
            a.task('b', function() {});
          });
        });

        app.invoke('one.a');
        app.invoke('two.a');

        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        cb();
      });

      verb.getGenerator('foo');
    });

    it('should invoke an array of sub-generators from sub-generators', function(cb) {
      verb.register('foo', function(app) {
        app.register('one', function(sub) {
          sub.register('a', function(a) {
            a.task('a', function() {});
          });
        });

        app.register('two', function(sub) {
          sub.register('a', function(a) {
            a.task('b', function() {});
          });
        });

        app.invoke(['one.a', 'two.a']);

        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        cb();
      });

      verb.getGenerator('foo');
    });

    it('should invoke sub-generator that invokes another generator', function(cb) {
      verb.register('foo', function(app) {
        app.invoke('bar');
        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        assert(app.tasks.hasOwnProperty('c'));
        cb();
      });

      verb.register('bar', function(app) {
        app.invoke('baz');
      });

      verb.register('baz', function(app) {
        app.task('a', function() {});
        app.task('b', function() {});
        app.task('c', function() {});
      });

      verb.getGenerator('foo');
    });

    it('should invoke sub-generator that invokes another sub-generator', function(cb) {
      verb.register('foo', function(app) {
        app.invoke('bar.sub');
        assert(app.tasks.hasOwnProperty('a'));
        assert(app.tasks.hasOwnProperty('b'));
        assert(app.tasks.hasOwnProperty('c'));
        cb();
      });

      verb.register('bar', function(app) {
        app.register('sub', function(sub) {
          sub.invoke('baz.sub');
        });
      });

      verb.register('baz', function(app) {
        app.register('sub', function(sub) {
          sub.task('a', function() {});
          sub.task('b', function() {});
          sub.task('c', function() {});
        });
      });

      verb.getGenerator('foo');
    });
  });
});
