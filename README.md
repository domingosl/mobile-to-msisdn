mobile-to-msisdn
================

Converts a mobile phone to an internationalized msisdn format.

See `numbering-scheme.json` for international formats. Pull requests wanted / welcome =)

Usage
----

```

npm install mobile-to-msisdn

```

```
var Msisdn = require('mobile-to-msisdn');

var m = new Msisdn('(415) 555-1212', 'US');

m.msisdn(function (err, formatted) {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Formatted: ' + formatted);
});

```