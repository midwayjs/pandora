import {AppletRepresentation} from '../domain';

/**
 * Class AppletRepresentationChainModifier
 */
export class AppletRepresentationChainModifier {
  representation: AppletRepresentation;

  constructor(representation: AppletRepresentation) {
    this.representation = representation;
  }

  /**
   * Modify applet's name
   * @param appletName
   * @return {AppletRepresentationChainModifier}
   */
  name(appletName): AppletRepresentationChainModifier {
    this.representation.appletName = appletName;
    return this;
  }

  /**
   * Modify applet's category
   * @param category
   * @return {AppletRepresentationChainModifier}
   */
  category(category): AppletRepresentationChainModifier {
    this.representation.category = category;
    return this;
  }

  /**
   * Modify applet's config
   * @param configResolver
   * @return {AppletRepresentationChainModifier}
   */
  config(configResolver): AppletRepresentationChainModifier {
    if ('function' === typeof configResolver) {
      this.representation.configResolver = configResolver;
      return this;
    }
    this.representation.config = configResolver;
    return this;
  }
}
