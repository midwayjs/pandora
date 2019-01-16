import {expect} from 'chai';
import {FileReporterUtil} from '../src/FileReporterUtil';

describe('FileReporterUtil', () => {

  it('should unix() be ok', () => {
    expect(FileReporterUtil.unix(1000)).to.be.equal(1);
    expect(FileReporterUtil.unix()).to.be.ok;
  });

  it('should getSeed() be ok', () => {
    expect(FileReporterUtil.getSeed()).to.be.ok;
    expect(FileReporterUtil.getSeed().length).to.be.equal(32);
  });

});