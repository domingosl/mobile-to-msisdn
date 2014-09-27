'use strict';

var fs = require('fs');
var path = require('path');

var numberingSchemeCache,
  defaultCountry;

function getNumberingScheme (country, callback) {

  if (numberingSchemeCache) {
    callback(null, numberingSchemeCache[country]);
    return;
  }

  fs.readFile(path.join(__dirname, 'numbering-scheme.json'), { encoding: 'utf8' }, function (err, fileData) {

    if (err) {
      callback(err, null);
      return;
    }

    try {
      numberingSchemeCache = JSON.parse(fileData);
    } catch(err) {
      callback(err, null);
      return;
    }

    callback(null, numberingSchemeCache[country]);
  });
}

function Msisdn (unformatted, country) {

  var msisdnInstance = this;

  this.unformatted = unformatted;
  this.country = country || defaultCountry;
  this.msisdn = null;
  this.numberingScheme = null;

  if (!this.country) {
    throw new Error('No country provided; msisdn must specify a country if no default is configured');
  }

  this.raw = function (unformatted, callback) {

    if (unformatted instanceof Function) {
      callback = unformatted;
      unformatted = null;
    }

    if (unformatted) {
      msisdnInstance.unformatted = unformatted;
    }

    return msisdnInstance.unformatted;
  };

  this.scheme = function (callback) {

    // scheme already cached
    if (msisdnInstance.numberingScheme) {
      callback(null, msisdnInstance.numberingScheme);
      return;
    }

    // cache the scheme
    getNumberingScheme(msisdnInstance.country, function (err, scheme) {

      var err;

      if (err) {
        callback(err, null);
        return;
      }

      if (!scheme) {
        err = new Error('No numbering scheme found for country ' + msisdnInstance.country);
      }

      msisdnInstance.numberingScheme = scheme;
      callback(null, msisdnInstance.numberingScheme);
    });
  };

  this.msisdn = function (msisdn, callback) {

    if (msisdn instanceof Function) {
      callback = msisdn;
      msisdn = null;
    }

    // this call was made as a getter
    if (!msisdn) {

      // retrieve scheme
      msisdnInstance.scheme(function (err, scheme) {
        var msisdn;
        if (err) {
          callback(err, null);
          return;
        }

        // generate msisdn using format
        msisdn = msisdnFromUnformatted(msisdnInstance.unformatted, scheme);

        // validate generated msisdn
        valid(msisdn, scheme.formats, function (err, validatedMsisdn) {
          msisdnInstance.msisdn = validatedMsisdn;
          callback(err, validatedMsisdn);
        });
      });
      return;
    }

    // call was made as a setter
    msisdnInstance.scheme(function (err, scheme) {

      if (err) {
        callback(err, null);
        return;
      }

      valid(strip(msisdn), scheme.formats, function (err, validatedMsisdn) {

        if (err) {
          callback(err, null);
          return;
        }

        msisdnInstance.msisdn = validatedMsisdn;
        callback(null, validatedMsisdn);
      });
    });
  };

  this.toString = function() {
    return msisdnInstance.msisdn;
  };

  function strip(unformattedInput) {
    return unformattedInput.replace(/[^0-9]/g, '');
  }

  /**
   * Returns a msisdn from the unformatted input string
   *
   * @param {String} unformatted
   * @param {Object} numberingScheme Containing {"internationalCode": {String}, "nationalPrefix": {String}, "canStartWithInternationalCode": {Boolean} }
   * @returns {String}
   */
  function msisdnFromUnformatted(unformatted, numberingScheme) {

    // strip out non-digits
    var stripped,
      withoutNationalDialingPrefix;

    stripped = strip(unformatted);

    // strip the national dialing prefix, if it exists, since it's not part of a msisdn
    withoutNationalDialingPrefix = stripped;
    if (numberingScheme.nationalPrefix) {
      if (0 === stripped.indexOf(numberingScheme.nationalPrefix)) {
        withoutNationalDialingPrefix = stripped.substring(numberingScheme.nationalPrefix.length);
      }
    }

    // prepend the international prefix, if not already there
    if (0 === withoutNationalDialingPrefix.indexOf(numberingScheme.internationalCode)) {
      // international code must already be there, since local format does not permit number to begin with it
      if (!numberingScheme.canStartWithInternationalCode) {
        return withoutNationalDialingPrefix;
      }

      // fall-through: indicates international code probably not present since local format permits numbers to begin with it
    }

    return numberingScheme.internationalCode + withoutNationalDialingPrefix;
  }

  function valid(msisdn, formats, callback) {

    var i, regexFormat, err;

    for (i = 0; i < formats.length; i++) {

      regexFormat = new RegExp(formats[i], 'gi');

      if (regexFormat.test(msisdn)) {
        msisdnInstance.msisdn = msisdn;
        callback(null, msisdn);
        return;
      }
    }

    err = new Error('Msisdn does not match any numbering plan formats');
    callback(err, null);
  }

}

module.exports = {
  defaultCountry: function (country) {
    if (country) {
      defaultCountry = country;
    }
    return defaultCountry;
  },
  Msisdn: Msisdn
};
