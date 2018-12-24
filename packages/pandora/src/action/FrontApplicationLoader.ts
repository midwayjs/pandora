'use strict';
import {ApplicationRepresentation} from '../domain';
import {ApplicationHandler} from '../application/ApplicationHandler';
import {consoleLogger} from 'pandora-dollar';
import {CoreSDK} from 'pandora-core-sdk';
import {CoreSDKWithExtendedConfig} from '../util/CoreSDKWithExtendedConfig';

/**
 * Class FrontApplicationLoader
 */
export class FrontApplicationLoader {

  protected representation: ApplicationRepresentation;
  protected applicationHandler: ApplicationHandler;
  protected coreSdk: CoreSDK;

  constructor(representation: ApplicationRepresentation) {

    this.representation = {
      ...representation,
      appName: representation.appName || 'unnamed'
    };

    const {appName, appDir} = this.representation;
    this.coreSdk = new CoreSDKWithExtendedConfig({
      mode: 'supervisor',
      appName, appDir
    });

    this.applicationHandler = new ApplicationHandler(this.representation);

  }

  /**
   * Start
   * @return {Promise<void>}
   */
  async start() {

    const representation = this.representation;

    if(representation.appDir !== process.cwd()) {
      process.chdir(representation.appDir);
      consoleLogger.info('Switch current working dir to ' + representation.appDir);
    }

    await this.coreSdk.start();

    const onProcessTerm = (sig) => {
      consoleLogger.log();
      consoleLogger.important(`Receive a signal ${sig}, trying to stop...`);
      this.stop().then(() => {
        process.exit(0);
      }).catch((err) => {
        consoleLogger.error(err);
        process.exit(1);
      });
    };

    this.applicationHandler.start().then(() => {
      consoleLogger.important(`Application [name = ${representation.appName}] start successful.`);
      process.once('SIGQUIT', onProcessTerm.bind(null, 'SIGQUIT'));
      process.once('SIGTERM', onProcessTerm.bind(null, 'SIGTERM'));
      process.once('SIGINT', onProcessTerm.bind(null, 'SIGINT'));
    }).catch((err) => {
      consoleLogger.error(err);
    });

  }

  async stop() {
    await this.applicationHandler.stop();
    await this.coreSdk.stop();
  }

}

