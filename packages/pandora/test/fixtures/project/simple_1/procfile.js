console.log('PLS KEEP THIS LOG FOR https://github.com/midwayjs/pandora/issues/24');
module.exports = function (pandora) {
  pandora.service('myVeryOwnService', './SomeService').process('background');
  pandora.service('DepServiceBABA', './DepServiceBABA').process('background');
  pandora.service('myVeryOwnApplet', './SomeApplet').process('background');
};
