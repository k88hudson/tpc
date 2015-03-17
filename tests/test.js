require('colors');
var wd = require('wd');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var argv = require('minimist')(process.argv.slice(2));
var _ = require('lodash');
// Check username
if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
  console.log('\nERROR: Hey! you need to add SAUCE_USERNAME and SAUCE_ACCESS_KEY to your environment to run these tests.\n'.red);
  process.exit(1);
}

chai.use(chaiAsPromised);
chai.should();
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// browser capabilities
var DESIREDS = require('../desireds');

// http configuration, not needed for simple runs
wd.configureHttp( {
  timeout: 60000,
  retryDelay: 15000,
  retries: 5
});

// building desired capability
var browserKey = argv.browser || 'chrome';
var desired = DESIREDS[browserKey];
desired.name = 'example with ' + browserKey;
desired.tags = ['tutorial'];

describe('Basic smoke tests (' + desired.browserName + ')', function() {
  this.timeout(60000);
  var browser;
  var allPassed = true;

  before(function(done) {
    var username = process.env.SAUCE_USERNAME;
    var accessKey = process.env.SAUCE_ACCESS_KEY;
    browser = wd.promiseChainRemote('ondemand.saucelabs.com', 80, username, accessKey);
    if(process.env.VERBOSE){
      // optional logging
      browser.on('status', function(info) {
        console.log(info.cyan);
      });
      browser.on('command', function(meth, path, data) {
        console.log(' > ' + meth.yellow, path.grey, data || '');
      });
    }

    // browser.on('status', function(info) {
    //   console.log(info.cyan);
    // });
    // browser.on('command', function(eventType, command, response) {
    //   console.log(' > ' + eventType.cyan, command, (response || '').grey);
    // });
    // browser.on('http', function(meth, path, data) {
    //   console.log(' > ' + meth.magenta, path, (data || '').grey);
    // });

    browser
      .init(desired)
      .nodeify(done);
  });

  afterEach(function(done) {
    allPassed = allPassed && (this.currentTest.state === 'passed');
    done();
  });

  after(function(done) {
    browser
      .quit()
      .sauceJobStatus(allPassed)
      .nodeify(done);
  });

  it('should get home page', function(done) {
    browser
      .get('http://localhost:4000')
      .title()
      .should.become('Your New Jekyll Site')
      .nodeify(done);
  });
  it('should get a post and navigate back to home', function(done) {
    browser
      .get('http://localhost:4000/jekyll/update/2015/03/05/welcome-to-jekyll.html')
      .waitForElementByCss('a[href="/"]')
      .click()
      .eval('document.title')
      .should.eventually.equal('Your New Jekyll Site')
      .nodeify(done);
  });

});
