'use strict';

var Msisdn = require('./index').Msisdn;

var msisdn = new Msisdn('(415) 601-4879', 'US');

console.log('Raw: ' + msisdn.raw());

msisdn.msisdn(function (err, formatted) {
  if (err) {
    console.error(err);
    return;
  }
  console.log('Msisdn: ' + formatted);
});

msisdn.msisdn('+14156014879 1asdfadf', function (err, formatted) {

  if (err) {
    console.log(err);
    return;
  }

  console.log(formatted);
});