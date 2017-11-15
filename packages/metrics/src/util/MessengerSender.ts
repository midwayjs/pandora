export class MessengerSender {

  static MESSAGE_KEY_PREFIX = 'PANDORA_PROCESS_MESSAGE_';

  client: {
    on(msg: string, reply: (data?) => {}),
    emit(messageKey: string, messageData: any)
  } = process;

  /**
   * send message by process
   * @param categoryKey like logger,trace...
   * @param args
   */
  send(categoryKey, args: any) {
    this.client.emit(`${MessengerSender.MESSAGE_KEY_PREFIX}${categoryKey}`, args);
  }

  on(categoryKey, reply) {
    this.client.on(`${MessengerSender.MESSAGE_KEY_PREFIX}${categoryKey}`, reply);
  }
}
